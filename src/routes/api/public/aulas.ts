import { createFileRoute } from "@tanstack/react-router";
import { jsonResponse, preflight } from "@/lib/cors";

export const Route = createFileRoute("/api/public/aulas")({
  server: {
    handlers: {
      OPTIONS: async () => preflight(),
      GET: async ({ request }) => {
        try {
          const url = new URL(request.url);
          const slug = url.searchParams.get("slug")?.slice(0, 80) ?? null;
          const limit = Math.min(Number(url.searchParams.get("limit") ?? 30), 100);
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          if (slug) {
            const { data, error } = await supabaseAdmin
              .from("aulas").select("*").eq("slug", slug).eq("publica", true).maybeSingle();
            if (error) throw error;
            return jsonResponse({ aula: data });
          }
          const { data, error } = await supabaseAdmin
            .from("aulas")
            .select("id, slug, titulo, disciplina, nivel, autor_nome, descricao, created_at")
            .eq("publica", true)
            .order("created_at", { ascending: false })
            .limit(limit);
          if (error) throw error;
          return jsonResponse({ aulas: data ?? [] });
        } catch (err) {
          return jsonResponse({ error: err instanceof Error ? err.message : "internal_error" }, 500);
        }
      },
    },
  },
});
