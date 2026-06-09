import { useEffect, useRef } from "react";
import { Hand, Volume2 } from "lucide-react";
import { translateToVLibras } from "@/lib/vlibras";

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
  const lastRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Avatar de Libras</p>
        <h2 className="mt-1 font-display text-xl font-semibold">Tradução visual</h2>

        <div className="mt-5 grid place-items-center rounded-2xl border bg-gradient-to-b from-secondary/60 to-background/60 px-4 py-10">
          <div className="float-soft grid h-32 w-32 place-items-center rounded-full gradient-primary shadow-glow">
            <Hand className="h-12 w-12 text-primary-foreground" />
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">
            {hint ?? "O avatar VLibras abre no canto inferior direito e executa a tradução automaticamente."}
          </p>
          <button
            onClick={play}
            disabled={!text.trim()}
            className="mt-4 inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
          >
            <Volume2 className="h-4 w-4" /> Sinalizar agora
          </button>
        </div>
      </div>
    </div>
  );
}
