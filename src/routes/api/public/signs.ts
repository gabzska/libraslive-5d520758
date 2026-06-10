import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/cors";

export const Route = createFileRoute("/api/public/signs")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const q = url.searchParams.get("q")?.slice(0, 80) ?? null;
          const categoria = url.searchParams.get("categoria")?.slice(0, 60) ?? null;
          const limit = Math.min(Number(url.searchParams.get("limit") ?? 50), 200);

          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          let query = supabaseAdmin
            .from("sinais")
            .select("id, palavra, slug, descricao, sinonimos, video_url, categoria_id, confianca")
            .eq("aprovado", true);
          if (q) query = query.ilike("palavra", `%${q}%`);
          if (categoria) query = query.eq("categoria_id", categoria);
          const { data, error } = await query.order("palavra").limit(limit);
          if (error) throw error;
          return jsonResponse({ signs: data ?? [], total: data?.length ?? 0 });
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "internal_error" }, 500);
        }
      },
    },
  },
});
