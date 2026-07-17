import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Hand, Loader2, Volume2 } from "lucide-react";
import { attachVLibrasTo, parkVLibras, translateToVLibras } from "@/lib/vlibras";

interface Props {
  text: string;
  autoPlay?: boolean;
  hint?: string;
}

/**
 * Painel visual que controla o avatar VLibras (que vive flutuante no canto).
 * Sempre que `text` muda (com debounce) dispara a tradução e abre o widget.
 */
export function VLibrasPlayer({ text, autoPlay = true, hint }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const lastRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    let cancelled = false;
    setStatus("loading");
    attachVLibrasTo(host)
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      parkVLibras();
    };
  }, []);

  useEffect(() => {
    if (!autoPlay) return;
    const clean = text.trim();
    if (!clean || clean === lastRef.current) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      lastRef.current = clean;
      translateToVLibras(clean);
      // open widget if collapsed
      try {
        const btn = document.querySelector<HTMLElement>("[vw-access-button]");
        btn?.click();
      } catch { /* ignore */ }
    }, 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text, autoPlay]);

  const play = () => {
    if (!text.trim()) return;
    translateToVLibras(text.trim());
    try {
      document.querySelector<HTMLElement>("[vw-access-button]")?.click();
    } catch { /* ignore */ }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-card backdrop-blur">
      <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Avatar VLibras integrado</p>
            <h2 className="mt-1 font-display text-xl font-semibold">Tradução visual</h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-background/60 px-2.5 py-1 text-[11px] text-muted-foreground">
            {status === "ready" ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : status === "error" ? <AlertCircle className="h-3.5 w-3.5 text-destructive" /> : <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
            {status === "ready" ? "Pronto" : status === "error" ? "Indisponível" : "Carregando"}
          </span>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border bg-background/80">
          <div
            ref={hostRef}
            className="libraslive-vlibras-host relative min-h-[470px] bg-card"
            aria-label="Painel integrado do avatar VLibras"
          >
            {status !== "ready" && (
              <div className="absolute inset-0 z-10 grid place-items-center bg-background/90 p-6 text-center">
                <div>
                  <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-primary shadow-glow">
                    {status === "error" ? <AlertCircle className="h-9 w-9 text-primary-foreground" /> : <Hand className="h-9 w-9 text-primary-foreground" />}
                  </div>
                  <p className="mt-4 text-sm font-medium text-foreground">
                    {status === "error" ? "Não foi possível carregar o VLibras agora." : "Preparando avatar oficial…"}
                  </p>
                </div>
              </div>
            )}
          </div>
          <p className="border-t bg-background/60 px-4 py-3 text-center text-sm text-muted-foreground">
            {hint ?? "O texto enviado é reproduzido automaticamente neste painel, sem abrir janelas ou abas externas."}
          </p>
          <button
            onClick={play}
            disabled={!text.trim()}
            className="mx-auto my-4 flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" /> Sinalizar agora
          </button>
        </div>
      </div>
    </div>
  );
}
