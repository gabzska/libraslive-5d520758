import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/cors";

export const Route = createFileRoute("/api/public/hospital-phrases")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const categoria = url.searchParams.get("categoria")?.slice(0, 40) ?? null;
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let q = supabaseAdmin
            .from("frases_hospital")
            .select("id, categoria, prioridade, texto_pt, gloss, icone, ordem")
            .order("ordem", { ascending: true });
          if (categoria) q = q.eq("categoria", categoria);
          const { data, error } = await q;
          if (error) throw error;
          return jsonResponse({ phrases: data ?? [] });
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "internal_error" }, 500);
        }
      },
    },
  },
});
