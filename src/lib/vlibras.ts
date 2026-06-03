/**
 * Push text into the VLibras widget so the avatar signs it.
 * VLibras exposes window.gManager.translate / .player.translate at runtime.
 */
export function translateToVLibras(text: string) {
  if (!text || typeof window === "undefined") return;
  const w = window as any;
  try {
    if (w?.gManager?.translate) {
      w.gManager.translate(text);
      return;
    }
    if (w?.gManager?.player?.translate) {
      w.gManager.player.translate(text);
      return;
    }
    // Fallback: try again shortly while widget boots
    setTimeout(() => {
      const ww = window as any;
      if (ww?.gManager?.translate) ww.gManager.translate(text);
      else if (ww?.gManager?.player?.translate) ww.gManager.player.translate(text);
    }, 1500);
  } catch (e) {
    console.warn("VLibras translate failed", e);
  }
}
