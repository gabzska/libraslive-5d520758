/**
 * Education Service
 * Aulas acessíveis: textos didáticos traduzidos para Libras via avatar.
 */
import { supabase } from "@/integrations/supabase/client";

export interface Aula {
  id: string;
  slug: string;
  titulo: string;
  disciplina: string | null;
  nivel: string | null;
  autor_nome: string | null;
  texto_pt: string;
  descricao: string | null;
  publica: boolean;
  visualizacoes: number;
  created_at: string;
  updated_at: string;
}

export function slugify(input: string) {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "aula";
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}

export async function listAulas(opts: { disciplina?: string; q?: string; limit?: number } = {}) {
  let q = supabase.from("aulas").select("*").eq("publica", true);
  if (opts.disciplina) q = q.eq("disciplina", opts.disciplina);
  if (opts.q) q = q.ilike("titulo", `%${opts.q}%`);
  q = q.order("created_at", { ascending: false }).limit(opts.limit ?? 60);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Aula[];
}

export async function getAulaBySlug(slug: string) {
  const { data, error } = await supabase
    .from("aulas")
    .select("*")
    .eq("slug", slug)
    .eq("publica", true)
    .maybeSingle();
  if (error) throw error;
  return data as Aula | null;
}

export async function createAula(input: {
  titulo: string;
  texto_pt: string;
  disciplina?: string;
  nivel?: string;
  autor_nome?: string;
  descricao?: string;
}) {
  const slug = slugify(input.titulo);
  const { data, error } = await supabase
    .from("aulas")
    .insert({ ...input, slug, publica: true })
    .select("*")
    .single();
  if (error) throw error;
  return data as Aula;
}
