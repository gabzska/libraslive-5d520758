import { useEffect } from "react";

declare global {
  interface Window {
    VLibras?: { Widget: new (url: string) => unknown };
  }
}

let initialized = false;

export function VLibrasWidget() {
  useEffect(() => {
    const init = () => {
      if (initialized) return;
      if (window.VLibras?.Widget) {
        try {
          new window.VLibras.Widget("https://vlibras.gov.br/app");
          initialized = true;
        } catch (e) {
          console.warn("VLibras init failed", e);
        }
      }
    };
    init();
    const t = window.setInterval(init, 800);
    const stop = window.setTimeout(() => window.clearInterval(t), 15000);
    return () => {
      window.clearInterval(t);
      window.clearTimeout(stop);
    };
  }, []);

  const anyDiv = "div" as unknown as React.ElementType;
  return (
    <anyDiv {...{ vw: "true" }} className="enabled">
      <anyDiv {...{ "vw-access-button": "true" }} className="active" />
      <anyDiv {...{ "vw-plugin-wrapper": "true" }}>
        <div className="vw-plugin-top-wrapper" />
      </anyDiv>
    </anyDiv>
  );

}
