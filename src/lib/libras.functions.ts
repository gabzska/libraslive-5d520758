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

const SYSTEM = `Você é um intérprete profissional de Libras → Português brasileiro.
Receberá uma sequência de glosas (sinais reconhecidos pela câmera). Glosas vêm em CAIXA ALTA, no infinitivo, sem preposições/artigos, possivelmente fora de ordem ou com sinais redundantes/baixa confiança.
Sua tarefa: reconstruir UMA frase natural em português brasileiro, respeitando a INTENÇÃO do sinalizador.
Regras:
- Adicione artigos, preposições, conjugação verbal, concordância e pontuação.
- Use o contexto da conversa para resolver ambiguidades, pronomes e tempo verbal.
- Se houver glosa claramente equivocada (ruído), descarte-a silenciosamente.
- Não invente fatos: limite-se ao que as glosas + contexto sugerem.
- Se a sequência for muito curta ou incoerente, devolva a melhor aproximação curta.
- Devolva também 'confidence' (0-1) e até 3 'alternatives' plausíveis.
Exemplo: ["EU","GOSTAR","ESTUDAR","MEDICINA","FUTURO"] → "Eu gostaria de estudar Medicina no futuro."`;

export const reconstructSentence = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY ausente");
    const gateway = createLovableAiGatewayProvider(key);

    const ctx = (data.context ?? []).slice(-6).join("\n");
    const prompt = `Glosas reconhecidas (em ordem):\n${data.glosses.join(" ")}\n\nContexto recente da conversa:\n${ctx || "(vazio)"}\n\nReconstrua a frase em português natural.`;

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
