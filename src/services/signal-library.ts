/**
 * Signal Library Service
 * Acesso ao banco colaborativo de sinais e categorias.
 */
import { supabase } from "@/integrations/supabase/client";

export async function listCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSinais(opts: { categoria?: string; q?: string; limit?: number } = {}) {
  let query = supabase.from("sinais").select("*").eq("aprovado", true);
  if (opts.categoria) query = query.eq("categoria_id", opts.categoria);
  if (opts.q) query = query.ilike("palavra", `%${opts.q}%`);
  query = query.order("palavra").limit(opts.limit ?? 200);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}
