/**
 * Configuração central do avatar Lia.
 *
 * Ready Player Me (RPM) é a fonte oficial: você cria a Lia em
 * https://readyplayer.me, copia a URL do .glb do avatar e cola em
 * `VITE_LIA_AVATAR_URL` no `.env`.
 *
 * Ex: VITE_LIA_AVATAR_URL=https://models.readyplayer.me/6570abcde12345.glb
 *
 * O helper abaixo garante que os blendshapes ARKit (rosto/expressões) e a
 * pose padrão sejam carregados junto do GLB — obrigatórios para Libras.
 */

const RPM_QUERY = "morphTargets=ARKit,Oculus+Visemes&textureAtlas=1024&pose=A&lod=0";

function withRpmParams(url: string): string {
  if (!url.includes("readyplayer.me")) return url;
  if (url.includes("morphTargets=")) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}${RPM_QUERY}`;
}

const RAW_URL = (import.meta.env.VITE_LIA_AVATAR_URL as string | undefined)?.trim();

/**
 * URL efetiva do GLB da Lia.
 * - Se `VITE_LIA_AVATAR_URL` estiver definida, usa-a (com params RPM injetados).
 * - Senão, tenta `/models/lia.glb` local (placeholder cai em cena).
 */
export const LIA_AVATAR_URL: string = RAW_URL
  ? withRpmParams(RAW_URL)
  : "/models/lia.glb";

export const LIA_AVATAR_IS_RPM = !!RAW_URL && RAW_URL.includes("readyplayer.me");
