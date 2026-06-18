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
  /** "circle" = retrato circular (avatar). "portrait" = enquadramento retrato 3:4 mostrando torso e mãos. */
  variant?: "circle" | "portrait";
}

const SIZE_MAP: Record<NonNullable<LiaInterpreterProps["size"]>, string> = {
  xs: "h-12 w-12",
  sm: "h-20 w-20",
  md: "h-32 w-32",
  lg: "h-48 w-48",
  xl: "h-72 w-72",
};

const PORTRAIT_SIZE_MAP: Record<NonNullable<LiaInterpreterProps["size"]>, string> = {
  xs: "h-32 w-24",
  sm: "h-48 w-36",
  md: "h-72 w-56",
  lg: "h-96 w-72",
  xl: "h-[28rem] w-[22rem]",
};

/**
 * <LiaInterpreter /> — Intérprete virtual oficial do LibrasLive.
 *
 * Avatar humano realista (não mascote cartoon). Hoje renderiza um retrato 2D
 * com micro-movimentos sutis (respiração, leve balanço de tronco, piscar
 * natural, halo de estado). A API `playSign(gloss)` dispara movimentos extras
 * que simulam o ato de sinalizar. Quando um avatar 3D rigado estiver
 * disponível em <Lia3DStage />, esta camada 2D segue como fallback e marca.
 */
export function LiaInterpreter({
  state = "idle",
  message,
  size = "md",
  showBubble = true,
  className,
  bubbleSide = "right",
  variant = "circle",
}: LiaInterpreterProps) {
  const [liveSign, setLiveSign] = useState<{ sign: SignDefinition | null; text?: string; gloss: string } | null>(null);
  const [signing, setSigning] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    return subscribeLia((event) => {
      setLiveSign(event);
      setSigning(true);
      clearTimeout(timer);
      timer = setTimeout(() => setSigning(false), event.sign?.durationMs ?? 1100);
    });
  }, []);

  const effectiveState: LiaState = signing ? "signing" : state;
  const bubbleText =
    message ??
    liveSign?.text ??
    liveSign?.sign?.label ??
    (liveSign?.gloss && liveSign.gloss);

  const isPortrait = variant === "portrait";
  const frameSize = isPortrait ? PORTRAIT_SIZE_MAP[size] : SIZE_MAP[size];
  // Foco da imagem no rosto da Lia (figura ocupa lado direito do PNG original).
  const objectPosition = isPortrait ? "62% 22%" : "62% 18%";
  const imgScale = isPortrait ? "scale-[1.05]" : "scale-[2.1]";

  return (
    <div
      className={cn(
        "relative inline-flex items-center gap-4",
        bubbleSide === "left" && "flex-row-reverse",
        (bubbleSide === "top" || bubbleSide === "bottom") && "flex-col",
        bubbleSide === "top" && "flex-col-reverse",
        className,
      )}
    >
      <div className="relative">
        {/* Halo / glow por estado */}
        <div
          className={cn(
            "absolute inset-0 -m-4 rounded-[2.5rem] blur-3xl transition-opacity duration-500",
            "animate-[lia-halo_3.5s_ease-in-out_infinite]",
            effectiveState === "listening" && "bg-rose-400/40",
            effectiveState === "thinking" && "bg-amber-300/40",
            effectiveState === "signing" && "bg-primary/60",
            effectiveState === "idle" && "bg-primary/25",
          )}
          aria-hidden
        />

        {/* Sway sutil do tronco */}
        <div
          className={cn(
            "relative origin-bottom",
            "animate-[lia-sway_6s_ease-in-out_infinite]",
          )}
        >
          {/* Respiração */}
          <div
            className={cn(
              "relative overflow-hidden border-2 border-primary/30 bg-gradient-to-b from-[oklch(0.97_0.025_295)] to-[oklch(0.92_0.05_295)] shadow-glow",
              isPortrait ? "rounded-[2rem]" : "rounded-full",
              frameSize,
              "animate-[lia-breathe_4.5s_ease-in-out_infinite]",
              effectiveState === "signing" && "animate-[lia-sign_0.9s_ease-in-out_infinite]",
            )}
          >
            <img
              src={liaAsset.url}
              alt="Lia, intérprete virtual de Libras do LibrasLive"
              className={cn(
                "h-full w-full object-cover select-none pointer-events-none transition-transform duration-700",
                imgScale,
              )}
              style={{ objectPosition }}
              draggable={false}
            />
            {/* Camada de piscar natural */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[oklch(0.88_0.04_290)] mix-blend-multiply opacity-0 animate-[lia-blink_5.5s_ease-in-out_infinite]"
            />
            {/* Vinheta suave para integrar ao tema */}
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary/15 via-transparent to-transparent"
            />
          </div>
        </div>

        {/* Pontinho de status */}
        <span
          aria-hidden
          className={cn(
            "absolute bottom-2 right-2 h-3 w-3 rounded-full border-2 border-background shadow-sm",
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
