import { useEffect, useRef } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
    __vlibrasInited?: boolean;
  }
}

const MARKUP = `
  <div vw class="enabled">
    <div vw-access-button class="active"></div>
    <div vw-plugin-wrapper>
      <div class="vw-plugin-top-wrapper"></div>
    </div>
  </div>
`;

export function VLibrasWidget() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const init = () => {
      if (window.__vlibrasInited) return true;
      if (window.VLibras?.Widget) {
        try {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
          window.__vlibrasInited = true;
          return true;
        } catch (e) {
          console.warn("VLibras init failed", e);
        }
      }
      return false;
    };

    // Ensure the script is present (in case head injection was skipped on hot reload)
    if (!document.querySelector('script[data-vlibras]')) {
      const s = document.createElement("script");
      s.src = "https://vlibras.gov.br/app/vlibras-plugin.js";
      s.async = true;
      s.dataset.vlibras = "1";
      s.onload = () => init();
      document.body.appendChild(s);
    }

    if (init()) return;
    const t = window.setInterval(() => { if (init()) window.clearInterval(t); }, 600);
    const stop = window.setTimeout(() => window.clearInterval(t), 20000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, []);

  return <div ref={ref} dangerouslySetInnerHTML={{ __html: MARKUP }} />;
}
