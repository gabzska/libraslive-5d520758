import { cn } from "@/lib/utils";
import {
  Accessibility,
  Brain,
  Hand,
  Heart,
  Languages,
  MessageCircle,
  Sparkles,
  Zap,
} from "lucide-react";

interface Lia3DStageProps {
  modelUrl?: string;
  className?: string;
  enableControls?: boolean;
  background?: string | null;
}

/**
 * <Lia3DStage /> — Elemento visual profissional da hero.
 *
 * O modelo 3D da personagem Lia foi removido para transmitir maior
 * qualidade de produto em apresentações. O espaço é ocupado por um
 * gradiente moderno, formas abstratas suaves e ícones minimalistas
 * que representam Libras, IA e comunicação — mantendo o mesmo tamanho
 * e proporção da seção anterior.
 */
export function Lia3DStage({
  className,
  background,
}: Lia3DStageProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-3xl border border-primary/10 bg-card/40 backdrop-blur-sm",
        className
      )}
      style={{ background: background ?? undefined }}
      aria-label="Visual da inteligência artificial de acessibilidade em Libras"
    >
      {/* Gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-background opacity-80" />

      {/* Animated abstract orbs */}
      <div
        aria-hidden
        className="absolute -left-1/4 -top-1/4 h-3/4 w-3/4 rounded-full bg-primary/20 blur-3xl animate-[float-soft_8s_ease-in-out_infinite]"
      />
      <div
        aria-hidden
        className="absolute -right-1/4 bottom-0 h-2/3 w-2/3 rounded-full bg-[oklch(0.72_0.18_280)]/20 blur-3xl animate-[float-soft_10s_ease-in-out_infinite_reverse]"
      />
      <div
        aria-hidden
        className="absolute left-1/3 top-1/3 h-1/2 w-1/2 rounded-full bg-primary/10 blur-2xl animate-[float-soft_12s_ease-in-out_infinite]"
      />

      {/* Central icon cluster */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          {/* Outer rings */}
          <div
            aria-hidden
            className="absolute inset-0 -m-8 rounded-full border border-primary/20 animate-[spin_20s_linear_infinite]"
          />
          <div
            aria-hidden
            className="absolute inset-0 -m-12 rounded-full border border-dashed border-primary/15 animate-[spin_30s_linear_infinite_reverse]"
          />

          {/* Core accessibility icon */}
          <div className="relative grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-primary to-[oklch(0.72_0.18_280)] shadow-glow animate-[lia-breathe_4s_ease-in-out_infinite]">
            <Accessibility className="h-10 w-10 text-primary-foreground" />
          </div>

          {/* Floating minimal icons */}
          <div
            aria-hidden
            className="absolute -left-16 -top-8 rounded-2xl border bg-card/80 p-2.5 shadow-card backdrop-blur animate-[float-soft_5s_ease-in-out_infinite]"
          >
            <Hand className="h-5 w-5 text-primary" />
          </div>
          <div
            aria-hidden
            className="absolute -right-14 top-2 rounded-2xl border bg-card/80 p-2.5 shadow-card backdrop-blur animate-[float-soft_6s_ease-in-out_infinite_0.5s]"
          >
            <Languages className="h-5 w-5 text-primary" />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-6 -left-10 rounded-2xl border bg-card/80 p-2.5 shadow-card backdrop-blur animate-[float-soft_7s_ease-in-out_infinite_1s]"
          >
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div
            aria-hidden
            className="absolute -bottom-4 -right-12 rounded-2xl border bg-card/80 p-2.5 shadow-card backdrop-blur animate-[float-soft_5.5s_ease-in-out_infinite_1.5s]"
          >
            <Heart className="h-5 w-5 text-primary" />
          </div>
          <div
            aria-hidden
            className="absolute -top-14 left-1/2 -translate-x-1/2 rounded-2xl border bg-card/80 p-2 shadow-card backdrop-blur animate-[float-soft_6.5s_ease-in-out_infinite_2s]"
          >
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div
            aria-hidden
            className="absolute -right-20 bottom-2 rounded-2xl border bg-card/80 p-2 shadow-card backdrop-blur animate-[float-soft_7.5s_ease-in-out_infinite_2.5s]"
          >
            <MessageCircle className="h-4 w-4 text-primary" />
          </div>
        </div>
      </div>

      {/* Bottom tech label */}
      <div className="absolute inset-x-0 bottom-4 flex justify-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/80 px-3 py-1 text-[10px] text-muted-foreground backdrop-blur">
          <Zap className="h-3 w-3 text-primary" /> IA · Libras · Acessibilidade
        </span>
      </div>
    </div>
  );
}
