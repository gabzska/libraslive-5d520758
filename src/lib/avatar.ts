import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";

/** Gera uma URL temporária para exibir a foto de perfil armazenada. */
export async function getAvatarUrl(path: string | null | undefined) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

/** Envia uma nova foto de perfil e devolve o caminho salvo. */
export async function uploadAvatar(userId: string, file: File) {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });
  if (error) throw new Error("Não foi possível enviar a foto.");
  return path;
}

export function initials(name: string, fallback = "?") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  return (parts[0][0] + (parts.at(-1)?.[0] ?? "")).toUpperCase();
}
