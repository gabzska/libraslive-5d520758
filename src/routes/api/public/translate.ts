import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { jsonResponse, preflight } from "@/lib/cors";

const Body = z.object({
  glosses: z.array(z.string().min(1).max(80)).min(1).max(60),
  context: z.array(z.string().max(400)).max(8).optional(),
});

/**
 * POST /api/public/translate
 * Body: { glosses: string[], context?: string[] }
 * Resposta: { sentence, confidence, alternatives? }
 *
 * Endpoint público para tradução Libras (glosas) → Português natural.
 */
export const Route = createFileRoute("/api/public/translate")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      POST: async ({ request }) => {
        try {
          const raw = await request.json().catch(() => null);
          const parsed = Body.safeParse(raw);
          if (!parsed.success) {
            return jsonResponse({ error: "invalid_body", issues: parsed.error.issues }, 400);
          }
          const { reconstructSentence } = await import("@/lib/libras.functions");
          const out = await reconstructSentence({ data: parsed.data });
          return jsonResponse(out);
        } catch (err) {
          const msg = err instanceof Error ? err.message : "internal_error";
          const status = /Limite de requisi/.test(msg) ? 429 : /Cr[eé]ditos/.test(msg) ? 402 : 500;
          return jsonResponse({ error: msg }, status);
        }
      },
    },
  },
});
