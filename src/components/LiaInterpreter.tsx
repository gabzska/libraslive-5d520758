import { useEffect, useState } from "react";
import liaAsset from "@/assets/lia-mascot.png.asset.json";
import { subscribeLia, type LiaState, type SignDefinition } from "@/lib/lia-sign-library";
import { cn } from "@/lib/utils";

interface LiaInterpreterProps {
  state?: LiaState;
  /** Mensagem fixa do balão (sobrepõe o último playSign) */
  message?: string;
  /** Tamanho do retrato */
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  /** Mostrar balão de fala */
  showBubble?: boolean;
  className?: string;
  /** Posição do balão em relação ao retrato */
  bubbleSide?: "right" | "left" | "top" | "bottom";
}

const SIZE_MAP: Record<NonNullable<LiaInterpreterProps["size"]>, string> = {
  xs: "h-12 w-12",
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-48 w-48",
  xl: "h-72 w-72",
};

/**
 * <LiaInterpreter /> — Mascote oficial e intérprete virtual do LibrasLive.
 *
 * Hoje: retrato 2D da Lia com micro-animações (respiração, piscar, halo)
 * + balão de fala que reage a `playSign(gloss)`.
 *
 * Amanhã: mesma API; quando <Lia3DStage /> estiver carregado, a Lia 3D
 * assume os sinais e este componente continua disponível para vazios,
 * loaders e marca.
 */
export function LiaInterpreter({
  state = "idle",
  message,
  size = "md",
  showBubble = true,
  className,
  bubbleSide = "right",
}: LiaInterpreterProps) {
  const [liveSign, setLiveSign] = useState<{ sign: SignDefinition | null; text?: string; gloss: string } | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    return subscribeLia((event) => {
      setLiveSign(event);
      setSigning(true);
      clearTimeout(timer);
      timer = setTimeout(() => setSigning(false), event.sign?.durationMs ?? 900);
    });
  }, []);

  const effectiveState: LiaState = signing ? "signing" : state;
  const bubbleText =
    message ??
    liveSign?.text ??
    liveSign?.sign?.label ??
    (liveSign?.gloss && liveSign.gloss);

  return (
    <div className={cn("relative inline-flex items-center gap-4", bubbleSide === "left" && "flex-row-reverse", className)}>
      <div className="relative">
        {/* Halo / glow por estado */}
        <div
          className={cn(
            "absolute inset-0 -m-3 rounded-full blur-2xl transition-opacity duration-500",
            effectiveState === "listening" && "bg-primary/40 opacity-100 animate-pulse",
            effectiveState === "thinking" && "bg-[oklch(0.72_0.18_280)]/40 opacity-100 animate-pulse",
            effectiveState === "signing" && "bg-primary/50 opacity-100",
            effectiveState === "idle" && "bg-primary/20 opacity-70",
          )}
          aria-hidden
        />

        {/* Retrato com respiração */}
        <div
          className={cn(
            "relative grid place-items-center overflow-hidden rounded-full border-2 border-primary/30 bg-gradient-to-b from-[oklch(0.96_0.04_300)] to-[oklch(0.88_0.08_290)] shadow-glow",
            SIZE_MAP[size],
            "animate-[lia-breathe_4s_ease-in-out_infinite]",
            effectiveState === "signing" && "animate-[lia-sign_0.6s_ease-in-out_infinite]",
          )}
        >
          <img
            src={liaAsset.url}
            alt="Lia, intérprete virtual de Libras do LibrasLive"
            className="h-[115%] w-[115%] object-cover object-top select-none pointer-events-none"
            draggable={false}
          />
          {/* Camada de piscar */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[oklch(0.92_0.04_290)] opacity-0 animate-[lia-blink_5s_ease-in-out_infinite]"
          />
        </div>

        {/* Pontinho de status */}
        <span
          aria-hidden
          className={cn(
            "absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-background",
            effectiveState === "idle" && "bg-emerald-400",
            effectiveState === "listening" && "bg-rose-400 animate-pulse",
            effectiveState === "thinking" && "bg-amber-400 animate-pulse",
            effectiveState === "signing" && "bg-primary animate-pulse",
          )}
        />
      </div>

      {showBubble && (bubbleText || effectiveState !== "idle") && (
        <div
          className={cn(
            "relative max-w-xs animate-fade-in rounded-2xl border bg-card/95 px-4 py-2.5 text-sm shadow-card backdrop-blur",
            "before:absolute before:top-1/2 before:-translate-y-1/2 before:h-3 before:w-3 before:rotate-45 before:border before:bg-card/95",
            bubbleSide === "right" && "before:-left-1.5 before:border-r-0 before:border-t-0",
            bubbleSide === "left" && "before:-right-1.5 before:border-l-0 before:border-b-0",
          )}
        >
          {effectiveState === "thinking" && !bubbleText ? (
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" />
            </span>
          ) : effectiveState === "listening" && !bubbleText ? (
            <span className="text-muted-foreground">Estou ouvindo…</span>
          ) : (
            <>
              <p className="font-medium leading-snug">{bubbleText}</p>
              {liveSign?.sign?.description && signing && (
                <p className="mt-0.5 text-xs text-muted-foreground">{liveSign.sign.description}</p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
