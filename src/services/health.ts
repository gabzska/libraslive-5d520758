/**
 * Health Service
 * Frases hospitalares e comunicação em ambientes clínicos.
 */
import { supabase } from "@/integrations/supabase/client";

export async function listFrasesHospital(categoria?: string) {
  let q = supabase.from("frases_hospital").select("*").order("ordem", { ascending: true });
  if (categoria) q = q.eq("categoria", categoria);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}
