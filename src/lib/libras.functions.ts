import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const Input = z.object({
  glosses: z.array(z.string().min(1).max(80)).min(1).max(60),
  context: z.array(z.string().max(400)).max(8).optional(),
});

const Schema = z.object({
  sentence: z
    .string()
    .describe("Frase final em português natural, com pontuação e acentos."),
  confidence: z.number().min(0).max(1),
  alternatives: z.array(z.string()).max(3).optional(),
});

const SYSTEM = `Você é um intérprete profissional de Libras → Português brasileiro, com domínio nativo do português culto e coloquial.
Receberá uma sequência de glosas reconhecidas pela câmera (CAIXA ALTA, infinitivo, sem preposições/artigos), possivelmente fora de ordem, com sinais redundantes ou de baixa confiança. Pode haver tokens [SOLETRADO:XXX] indicando soletração manual — preserve-os como nomes próprios ou palavras fora do vocabulário, mantendo a grafia (apenas com capitalização correta).

Sua tarefa: reconstruir UMA frase natural, gramaticalmente correta e fluente em PT-BR, respeitando a INTENÇÃO do sinalizador.

Regras de qualidade:
- Adicione artigos, preposições, conjugação verbal, concordância de gênero/número, acentuação e pontuação final.
- Use o contexto recente da conversa para resolver pronomes, tempo verbal e referências implícitas.
- Prefira construções naturais ("Eu gostaria de…", "Você poderia…") em vez de tradução literal.
- Se houver glosa claramente espúria/ruído, descarte-a silenciosamente.
- Nunca invente fatos: limite-se ao que glosas + contexto sugerem.
- Soletrações ([SOLETRADO:JOAO]) viram nomes próprios com capitalização adequada ("João").
- Se a sequência for muito curta/ambígua, devolva a melhor aproximação curta, sem inventar conteúdo.
- A confiança ('confidence') deve refletir realisticamente a clareza da entrada (0–1).
- Forneça até 3 'alternatives' plausíveis quando houver ambiguidade.

Exemplos:
- ["EU","GOSTAR","ESTUDAR","MEDICINA","FUTURO"] → "Eu gostaria de estudar Medicina no futuro."
- ["EU","CHAMAR","[SOLETRADO:JOAO]"] → "Eu me chamo João."
- ["VOCÊ","QUERER","ÁGUA","O-QUE"] → "Você quer água?"`;

export const reconstructSentence = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);

    const ctx = (data.context ?? []).slice(-8).join("\n");
    const prompt = `Glosas reconhecidas (em ordem):\n${data.glosses.join(" ")}\n\nContexto recente da conversa (mais antigo → mais recente):\n${ctx || "(vazio)"}\n\nReconstrua a frase em português brasileiro natural.`;


    try {
      const { experimental_output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: SYSTEM,
        prompt,
        experimental_output: Output.object({ schema: Schema }),
      });
      return experimental_output;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/429/.test(msg)) throw new Error("Limite de requisições atingido. Tente novamente em instantes.");
      if (/402/.test(msg)) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
      throw new Error("Falha ao reconstruir frase: " + msg);
    }
  });
