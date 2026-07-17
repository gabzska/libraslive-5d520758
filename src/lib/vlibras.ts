/**
 * Ponte com o widget oficial do VLibras (governo federal).
 * O widget é montado uma única vez no RootShell (src/routes/__root.tsx),
 * portanto permanece ativo em todas as rotas — não recarrega ao navegar.
 *
 * Expõe:
 *  - translateToVLibras(text): envia frase para o avatar sinalizar
 *  - openVLibras(): abre o painel do avatar (se estiver recolhido)
 *  - closeVLibras(): recolhe o painel
 *  - isVLibrasReady(): true quando a API window.gManager está pronta
 */

function getManager(): any {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w?.gManager ?? null;
}

export function isVLibrasReady(): boolean {
  const m = getManager();
  return !!(m && (m.translate || m.player?.translate));
}

export function openVLibras() {
  if (typeof document === "undefined") return;
  try {
    const wrapper = document.querySelector<HTMLElement>("[vw]");
    if (wrapper && !wrapper.classList.contains("active")) {
      const btn = document.querySelector<HTMLElement>("[vw-access-button]");
      btn?.click();
    }
  } catch { /* ignore */ }
}

export function closeVLibras() {
  if (typeof document === "undefined") return;
  try {
    const closeBtn = document.querySelector<HTMLElement>(
      "[vp-close-button], .vpw-controls-close, [vw-plugin-wrapper] [class*='close']",
    );
    closeBtn?.click();
  } catch { /* ignore */ }
}

/** Envia texto ao avatar VLibras. Reintenta se o widget ainda estiver inicializando. */
export function translateToVLibras(text: string) {
  if (!text || typeof window === "undefined") return;
  const clean = text.trim();
  if (!clean) return;

  const attempt = (tries: number) => {
    const m = getManager();
    try {
      if (m?.translate) { m.translate(clean); return; }
      if (m?.player?.translate) { m.player.translate(clean); return; }
    } catch (e) {
      console.warn("VLibras translate failed", e);
      return;
    }
    if (tries > 0) setTimeout(() => attempt(tries - 1), 800);
  };
  attempt(6); // ~4.8s de tentativas enquanto o script carrega
}

/** Abre o widget e imediatamente sinaliza o texto (auto-open + play). */
export function signOnVLibras(text: string) {
  openVLibras();
  translateToVLibras(text);
}
