import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function norm(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function getServerSupabase() {
  // Publishable client é suficiente — leitura de sinais aprovados + correcoes é público.
  const { createClient } = await import("@supabase/supabase-js");
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

interface DictEntry {
  palavra: string;
  slug: string;
  sinonimos: string[] | null;
  significado: string | null;
  contexto_uso: string | null;
  exemplos: unknown;
  variacoes_regionais: unknown;
  categoria_gramatical: string | null;
}

async function lookupDictionary(terms: string[]): Promise<DictEntry[]> {
  if (!terms.length) return [];
  const supabase = await getServerSupabase();
  const patterns = Array.from(new Set(terms.map((t) => norm(t)).filter(Boolean)));
  if (!patterns.length) return [];
  // Match por palavra OR sinônimos (via ilike em array). Simples e sem full-text.
  const orFilter = patterns
    .map((p) => `palavra.ilike.%${p}%,slug.ilike.%${p}%`)
    .join(",");
  const { data } = await supabase
    .from("sinais")
    .select("palavra,slug,sinonimos,significado,contexto_uso,exemplos,variacoes_regionais,categoria_gramatical")
    .eq("aprovado", true)
    .or(orFilter)
    .limit(40);
  return (data ?? []) as DictEntry[];
}

async function lookupCorrections(direcao: "pt_libras" | "libras_pt", entrada: string) {
  const supabase = await getServerSupabase();
  const key = norm(entrada);
  if (!key) return null;
  const { data } = await supabase
    .from("correcoes_traducao")
    .select("saida_corrigida,votos")
    .eq("direcao", direcao)
    .eq("entrada_norm", key)
    .order("votos", { ascending: false })
    .limit(1);
  return data?.[0] ?? null;
}

function formatDictContext(entries: DictEntry[]): string {
  if (!entries.length) return "(nenhuma entrada encontrada no dicionário)";
  return entries
    .slice(0, 20)
    .map((e) => {
      const cat = e.categoria_gramatical ? ` [${e.categoria_gramatical}]` : "";
      const sig = e.significado ? ` — ${e.significado}` : "";
      const ctx = e.contexto_uso ? ` (uso: ${e.contexto_uso})` : "";
      const syn = e.sinonimos?.length ? ` | sinônimos: ${e.sinonimos.join(", ")}` : "";
      return `• ${e.palavra.toUpperCase()}${cat}${sig}${ctx}${syn}`;
    })
    .join("\n");
}

/* ------------------------------------------------------------------ */
/* Libras (glosas) → Português                                         */
/* ------------------------------------------------------------------ */

const InputLibrasToPt = z.object({
  glosses: z.array(z.string().min(1).max(80)).min(1).max(60),
  context: z.array(z.string().max(400)).max(8).optional(),
});

const SchemaLibrasToPt = z.object({
  sentence: z.string().describe("Frase final em português natural, com pontuação e acentos."),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).max(3).optional(),
});

const SYSTEM_LIBRAS_TO_PT = `Você é um intérprete profissional de Libras → Português brasileiro.
Receberá uma sequência de glosas reconhecidas pela câmera (CAIXA ALTA, infinitivo, sem preposições/artigos), possivelmente fora de ordem, com sinais redundantes ou de baixa confiança. Pode haver tokens [SOLETRADO:XXX] indicando soletração manual.

Você TAMBÉM receberá um trecho do DICIONÁRIO DE LIBRAS com significado, contexto de uso, categoria gramatical e variações regionais das glosas relevantes. Use este dicionário como base semântica autoritativa: ele resolve ambiguidades (mesma glosa com múltiplos significados) e sugere a construção mais natural.

REGRAS INEGOCIÁVEIS:
- NUNCA traduza palavra por palavra. Reconstrua a frase com a INTENÇÃO do sinalizador.
- Sempre priorize o significado do dicionário sobre a tradução literal do gloss.
- Considere múltiplos sentidos: escolha o que casa com o contexto da conversa.
- Adicione artigos, preposições, conjugação, concordância, acentuação e pontuação.
- Descarte silenciosamente glosas espúrias/ruído.
- Soletrações ([SOLETRADO:JOAO]) viram nomes próprios com capitalização adequada ("João").
- 'confidence' reflete a clareza da entrada (0–1).
- Forneça até 3 'alternatives' quando houver ambiguidade real.

Exemplos:
- ["EU","GOSTAR","ESTUDAR","MEDICINA","FUTURO"] → "Eu gostaria de estudar Medicina no futuro."
- ["VOCÊ","QUERER","ÁGUA","O-QUE"] → "Você quer água?"`;

export const reconstructSentence = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputLibrasToPt.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    // 1. Correção prévia validada pela comunidade → atalho.
    const corrective = await lookupCorrections("libras_pt", data.glosses.join(" "));
    if (corrective && corrective.votos >= 2) {
      return { sentence: corrective.saida_corrigida, confidence: 0.95, alternatives: [] };
    }

    // 2. Consulta ao dicionário para ancorar semântica.
    const dict = await lookupDictionary(data.glosses);
    const dictBlock = formatDictContext(dict);

    const gateway = createLovableAiGatewayProvider(key);
    const ctx = (data.context ?? []).slice(-8).join("\n");
    const prompt = `Glosas reconhecidas (em ordem):\n${data.glosses.join(" ")}\n\nDICIONÁRIO DE LIBRAS (referência semântica):\n${dictBlock}\n\nContexto recente da conversa:\n${ctx || "(vazio)"}\n\nReconstrua a frase em português brasileiro natural.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_LIBRAS_TO_PT,
        prompt,
        experimental_output: Output.object({ schema: SchemaLibrasToPt }),
      });
      return experimental_output;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (/402/.test(msg)) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error("Falha ao reconstruir frase: " + msg);
    }
  });

/* ------------------------------------------------------------------ */
/* Português → Libras (glosas + plano de sinalização)                  */
/* ------------------------------------------------------------------ */

const InputPtToLibras = z.object({
  text: z.string().min(1).max(500),
  context: z.array(z.string().max(400)).max(8).optional(),
});

const SchemaPtToLibras = z.object({
  glosses: z.array(z.string()).min(1).max(40)
    .describe("Sequência de glosas em Libras (CAIXA ALTA, infinitivo). Use [SOLETRADO:NOME] para nomes/palavras sem sinal."),
  intent: z.string().describe("Intenção comunicativa curta (afirmação, pergunta, saudação, pedido, etc.)"),
  notes: z.string().optional().describe("Observações de execução: expressão facial, ritmo, ênfase."),
  confidence: z.number().min(0).max(1),
});

const SYSTEM_PT_TO_LIBRAS = `Você é um intérprete profissional de Português brasileiro → Libras.
Sua tarefa é analisar a frase completa, identificar a INTENÇÃO comunicativa e produzir a sequência de glosas em Libras que um intérprete humano usaria — NÃO uma tradução palavra por palavra.

Você receberá um trecho do DICIONÁRIO DE LIBRAS com glosas conhecidas, significados, contexto de uso, variações regionais e categoria gramatical. Use-o como fonte autoritativa: quando uma palavra aparece no dicionário, use a glosa oficial; quando há variação regional, prefira a mais neutra (padrão nacional). Palavras sem sinal próprio (nomes, termos técnicos raros) viram [SOLETRADO:PALAVRA].

REGRAS DA LIBRAS:
- Ordem típica: TÓPICO-COMENTÁRIO ou SUJEITO-OBJETO-VERBO. Não copie a ordem do português.
- Perguntas ficam com marcador ao final: adicione "O-QUE", "QUEM", "ONDE", "COMO", "POR-QUE", "QUANDO" no final ou início conforme a pergunta.
- Elimine artigos, preposições redundantes, verbos de ligação (ser/estar quando implícitos).
- Verbos ficam no infinitivo/direção; tempo é marcado por advérbios (ONTEM, AGORA, FUTURO).
- Negação: adicione "NÃO" após o verbo ou expressão negada.
- Mantenha nomes próprios com [SOLETRADO:...] preservando capitalização.
- 'confidence' reflete quão confiante você está da glosa escolhida (0–1).
- 'notes' pode descrever expressão facial/ritmo quando relevante (ex: "sobrancelha erguida na pergunta").

Exemplos:
- "Eu quero água, por favor." → glosses: ["EU","QUERER","ÁGUA","POR-FAVOR"]
- "Você está bem?" → glosses: ["VOCÊ","BEM","O-QUE"], notes: "sobrancelha erguida"
- "Meu nome é João, prazer." → glosses: ["EU","NOME","[SOLETRADO:JOAO]","PRAZER"]
- "Não gosto de café." → glosses: ["EU","CAFÉ","GOSTAR","NÃO"]`;

export const translateToGlosses = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputPtToLibras.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");

    // 1. Atalho por correção comunitária.
    const corrective = await lookupCorrections("pt_libras", data.text);
    if (corrective && corrective.votos >= 2) {
      const glosses = corrective.saida_corrigida.split(/\s+/).filter(Boolean);
      return { glosses, intent: "correção validada", notes: undefined, confidence: 0.95 };
    }

    // 2. Dicionário: usa palavras da frase como sementes.
    const tokens = data.text.split(/\s+/).slice(0, 20);
    const dict = await lookupDictionary(tokens);
    const dictBlock = formatDictContext(dict);

    const gateway = createLovableAiGatewayProvider(key);
    const ctx = (data.context ?? []).slice(-8).join("\n");
    const prompt = `Frase em português:\n"${data.text}"\n\nDICIONÁRIO DE LIBRAS (glosas oficiais disponíveis):\n${dictBlock}\n\nContexto recente:\n${ctx || "(vazio)"}\n\nProduza a sequência de glosas em Libras.`;

    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM_PT_TO_LIBRAS,
        prompt,
        experimental_output: Output.object({ schema: SchemaPtToLibras }),
      });
      return experimental_output;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (/402/.test(msg)) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error("Falha ao traduzir para Libras: " + msg);
    }
  });

/* ------------------------------------------------------------------ */
/* Correção / aprendizado contínuo                                     */
/* ------------------------------------------------------------------ */

const InputCorrection = z.object({
  direcao: z.enum(["pt_libras", "libras_pt"]),
  entrada: z.string().min(1).max(2000),
  saida_original: z.string().max(2000).optional(),
  saida_corrigida: z.string().min(1).max(2000),
  contexto: z.record(z.string(), z.unknown()).optional(),
});

export const submitCorrection = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputCorrection.parse(d))
  .handler(async ({ data }) => {
    const supabase = await getServerSupabase();
    const entrada_norm = norm(data.entrada);

    // Se já existe correção idêntica, incrementa votos; senão, insere.
    const { data: existing } = await supabase
      .from("correcoes_traducao")
      .select("id,votos")
      .eq("direcao", data.direcao)
      .eq("entrada_norm", entrada_norm)
      .eq("saida_corrigida", data.saida_corrigida)
      .limit(1);

    if (existing?.[0]) {
      const { error } = await supabase
        .from("correcoes_traducao")
        .update({ votos: existing[0].votos + 1 })
        .eq("id", existing[0].id);
      if (error) throw new Error(error.message);
      return { ok: true, votos: existing[0].votos + 1, id: existing[0].id };
    }

    const { data: inserted, error } = await supabase
      .from("correcoes_traducao")
      .insert({
        direcao: data.direcao,
        entrada: data.entrada,
        entrada_norm,
        saida_original: data.saida_original ?? null,
        saida_corrigida: data.saida_corrigida,
        contexto: data.contexto ?? {},
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);
    return { ok: true, votos: 1, id: inserted.id };
  });
