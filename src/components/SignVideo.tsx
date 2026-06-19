import { useEffect, useRef, useState } from "react";
import { Hand, Volume2, Play } from "lucide-react";
import { translateToVLibras } from "@/lib/vlibras";

interface Props {
  /** Palavra/letra em PT-BR — usada para fallback no VLibras e como legenda. */
  palavra: string;
  videoUrl?: string | null;
  imagemUrl?: string | null;
  descricao?: string | null;
  /** Esconde a legenda da palavra (modo quiz). */
  hideCaption?: boolean;
  /** Esconde a descrição (modo quiz). */
  hideDescription?: boolean;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
  className?: string;
  /** Conteúdo de fallback quando não há vídeo/imagem (ex.: <HandGlyph />). */
  fallback?: React.ReactNode;
  /** Aria-label custom para o player. */
  ariaLabel?: string;
}

/**
 * Player unificado de sinais. Prioridade:
 *   1) <video> se houver `videoUrl`
 *   2) <img> se houver `imagemUrl`
 *   3) `fallback` (ex.: glifo SVG da mão)
 * + botão "Sinalizar com VLibras" como recurso de acessibilidade quando não há mídia.
 */
export function SignVideo({
  palavra, videoUrl, imagemUrl, descricao,
  hideCaption, hideDescription, autoPlay = true, loop = true, controls = true,
  className = "", fallback, ariaLabel,
}: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [errored, setErrored] = useState(false);

  // Reinicia o vídeo quando a fonte muda — evita "frame congelado" entre questões do quiz.
  useEffect(() => {
    setErrored(false);
    const v = ref.current;
    if (!v || !videoUrl) return;
    try { v.currentTime = 0; if (autoPlay) v.play().catch(() => {}); } catch { /* ignore */ }
  }, [videoUrl, autoPlay]);

  const hasVideo = !!videoUrl && !errored;
  const hasImage = !hasVideo && !!imagemUrl;
  const showFallback = !hasVideo && !hasImage;

  return (
    <figure
      className={`relative overflow-hidden rounded-2xl border bg-background/60 ${className}`}
      aria-label={ariaLabel ?? (hideCaption ? "Sinal em Libras" : `Sinal em Libras: ${palavra}`)}
    >
      <div className="relative aspect-video w-full bg-gradient-to-b from-secondary/40 to-background/60">
        {hasVideo && (
          <video
            ref={ref}
            src={videoUrl!}
            autoPlay={autoPlay}
            loop={loop}
            muted
            playsInline
            controls={controls}
            preload="metadata"
            onError={() => setErrored(true)}
            className="h-full w-full object-contain"
            aria-label={`Demonstração do sinal ${palavra} em Libras`}
          />
        )}
        {hasImage && (
          <img
            src={imagemUrl!}
            alt={`Configuração de mão do sinal ${palavra} em Libras`}
            loading="lazy"
            className="h-full w-full object-contain"
          />
        )}
        {showFallback && (
          <div className="grid h-full w-full place-items-center p-4">
            {fallback ?? (
              <div className="text-center">
                <div className="mx-auto grid h-20 w-20 place-items-center rounded-full gradient-primary shadow-glow">
                  <Hand className="h-9 w-9 text-primary-foreground" />
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">Sem vídeo cadastrado</p>
              </div>
            )}
            <button
              type="button"
              onClick={() => translateToVLibras(palavra)}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full border bg-card/90 px-3 py-1.5 text-xs font-medium backdrop-blur hover:bg-accent"
              aria-label={`Reproduzir ${palavra} com o avatar VLibras`}
            >
              <Volume2 className="h-3.5 w-3.5 text-primary" /> Sinalizar com VLibras
            </button>
          </div>
        )}

        {/* indicador de reprodução */}
        {hasVideo && (
          <span className="pointer-events-none absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[10px] font-medium text-foreground/80 backdrop-blur">
            <Play className="h-3 w-3 text-primary" /> Vídeo em Libras
          </span>
        )}
      </div>

      {(!hideCaption || (!hideDescription && descricao)) && (
        <figcaption className="border-t bg-card/60 px-3 py-2">
          {!hideCaption && (
            <p className="font-display text-sm font-semibold leading-tight">{palavra}</p>
          )}
          {!hideDescription && descricao && (
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{descricao}</p>
          )}
        </figcaption>
      )}
    </figure>
  );
}
