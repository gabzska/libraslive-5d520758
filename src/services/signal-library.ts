/**
 * Signal Library Service
 * Fonte única de verdade para sinais (banco colaborativo) e categorias.
 * Tanto a Biblioteca quanto o Quiz do alfabeto consomem daqui — qualquer
 * atualização de vídeo/imagem/descrição se reflete em toda a aplicação.
 */
import { supabase } from "@/integrations/supabase/client";

export interface Sinal {
  id: string;
  palavra: string;
  slug: string;
  categoria_id: string | null;
  descricao: string | null;
  video_url: string | null;
  imagem_url: string | null;
  animacao_url: string | null;
  sinonimos: string[];
  relacionados: string[];
  confianca: number;
  origem: string;
  aprovado: boolean;
}

const COLS = "id,palavra,slug,categoria_id,descricao,video_url,imagem_url,animacao_url,sinonimos,relacionados,confianca,origem,aprovado";

export async function listCategorias() {
  const { data, error } = await supabase
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function listSinais(opts: { categoria?: string; q?: string; limit?: number } = {}): Promise<Sinal[]> {
  let query = supabase.from("sinais").select(COLS).eq("aprovado", true);
  if (opts.categoria) query = query.eq("categoria_id", opts.categoria);
  if (opts.q) query = query.ilike("palavra", `%${opts.q}%`);
  query = query.order("palavra").limit(opts.limit ?? 200);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Sinal[];
}

/** Retorna as 26 letras do alfabeto manual, ordenadas A→Z. */
export async function listAlfabeto(): Promise<Sinal[]> {
  // Busca por slug `letra-*` é mais robusta que JOIN com categoria.
  const { data, error } = await supabase
    .from("sinais")
    .select(COLS)
    .like("slug", "letra-%")
    .eq("aprovado", true)
    .order("palavra", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Sinal[];
}
