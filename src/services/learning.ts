/**
 * Learning Service
 * Persistência de progresso e estatísticas dos usuários no módulo Aprender.
 */
import { supabase } from "@/integrations/supabase/client";

export async function saveProgresso(input: {
  user_id: string;
  modulo: "alfabeto" | "quiz" | "sinais";
  acertos: number;
  erros: number;
  tempo_seg?: number;
  payload?: Record<string, unknown>;
}) {
  const { error } = await supabase.from("progresso_educacao").insert(input);
  if (error) throw error;
}
