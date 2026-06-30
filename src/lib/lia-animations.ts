/**
 * Lia Procedural Animations
 * -------------------------
 * Registro de animações simuladas (placeholders) que funcionam HOJE sem
 * depender de arquivos `.glb` de animação. O <Lia3DStage /> consome este
 * registry via pub/sub e aplica as transformações em:
 *
 *   • rig real (quando bones com nomes conhecidos forem encontrados no GLB)
 *   • placeholder 3D (cabeça, corpo, braço direito articulado)
 *
 * Quando os GLBs reais de animação chegarem, é só registrar `glbUrl` em
 * `ANIMATIONS[name]` — o stage prioriza o GLB se ele existir, senão cai
 * de volta para a função procedural. Mesma API pública `playAnimation()`.
 */

export type AnimationName = "Idle" | "Ola" | "TudoBem" | (string & {});

/**
 * Amostra de pose normalizada em um instante `t ∈ [0, 1]` da animação.
 * Todas as rotações em radianos. Campos opcionais — só preencha o que
 * a animação realmente mexe (o resto é interpolado a partir de Idle).
 */
export interface AnimationSample {
  /** Sutil sobe-e-desce do corpo (m) */
  bodyPosY?: number;
  /** Yaw do corpo */
  bodyRotY?: number;
  /** Ombro direito: rotZ controla "levantar o braço" (0=baixo, ~2.2=alto) */
  rightArmRotZ?: number;
  /** Ombro direito: rotX controla "frente/trás" do braço */
  rightArmRotX?: number;
  /** Cotovelo direito: rotX/rotY para o aceno */
  rightForearmRotX?: number;
  rightForearmRotY?: number;
  /** Ombro esquerdo: espelho do direito */
  leftArmRotZ?: number;
  leftArmRotX?: number;
  /** Cabeça */
  headRotX?: number;
  headRotY?: number;
  headRotZ?: number;
  /** Texto opcional para o balão durante a animação */
  caption?: string;
}

export interface ProceduralAnimation {
  name: string;
  /** Duração da animação completa em ms */
  durationMs: number;
  /** Se `true`, repete; se `false`, ao terminar volta para `Idle` */
  loop?: boolean;
  /** Caminho futuro para a versão GLB; quando existir, tem prioridade */
  glbUrl?: string;
  /** Amostragem procedural de pose em `t ∈ [0,1]` */
  sample: (t: number) => AnimationSample;
  /** Legenda padrão a mostrar no balão (PT-BR) */
  defaultCaption?: string;
}

/* ──────────────────────────────────────────────────────────────
 * Helpers
 * ────────────────────────────────────────────────────────────── */
const TAU = Math.PI * 2;
const ease = (t: number) => t * t * (3 - 2 * t); // smoothstep

/* ──────────────────────────────────────────────────────────────
 * Catálogo
 * ────────────────────────────────────────────────────────────── */
export const ANIMATIONS: Record<string, ProceduralAnimation> = {
  /** Respiração contínua + leve oscilação. Estado neutro. */
  Idle: {
    name: "Idle",
    durationMs: 4000,
    loop: true,
    glbUrl: "/animations/idle.glb",
    sample: (t) => {
      const phase = t * TAU;
      return {
        bodyPosY: Math.sin(phase) * 0.012,
        bodyRotY: Math.sin(phase * 0.5) * 0.04,
        headRotY: Math.sin(phase * 0.7) * 0.05,
        headRotX: Math.sin(phase) * 0.02,
        rightArmRotZ: 0,
        leftArmRotZ: 0,
      };
    },
  },

  /**
   * "Olá": levantar a mão direita e acenar lateralmente 3x.
   * Não repete; ao terminar, o stage volta sozinho para Idle.
   */
  Ola: {
    name: "Ola",
    durationMs: 2200,
    loop: false,
    glbUrl: "/animations/ola.glb",
    defaultCaption: "Olá! 👋",
    sample: (t) => {
      // 0.0 - 0.25: levanta o braço
      // 0.25 - 0.80: acena
      // 0.80 - 1.00: abaixa
      let armUp = 0;
      if (t < 0.25) armUp = ease(t / 0.25);
      else if (t < 0.8) armUp = 1;
      else armUp = 1 - ease((t - 0.8) / 0.2);

      const waveActive = t > 0.25 && t < 0.8 ? 1 : 0;
      const waveT = (t - 0.25) / 0.55;
      const wave = waveActive * Math.sin(waveT * TAU * 3) * 0.6;

      return {
        rightArmRotZ: armUp * 2.1, // braço estendido para cima/lateral
        rightArmRotX: -armUp * 0.3,
        rightForearmRotY: wave,
        rightForearmRotX: -armUp * 0.4,
        headRotY: armUp * 0.1,
        headRotZ: armUp * 0.05,
        bodyRotY: Math.sin(t * TAU * 0.5) * 0.03,
      };
    },
  },

  /**
   * "Tudo Bem?": gesto de cumprimento com a mão direita semi-erguida,
   * leve aceno de cabeça (afirmativo) e movimento do antebraço.
   */
  TudoBem: {
    name: "TudoBem",
    durationMs: 2000,
    loop: false,
    glbUrl: "/animations/tudo-bem.glb",
    defaultCaption: "Tudo bem?",
    sample: (t) => {
      let armUp = 0;
      if (t < 0.2) armUp = ease(t / 0.2);
      else if (t < 0.85) armUp = 1;
      else armUp = 1 - ease((t - 0.85) / 0.15);

      const phase = t * TAU * 2;
      const nod = Math.sin(t * TAU * 1.5) * 0.18; // cabeça assentindo

      return {
        rightArmRotZ: armUp * 1.1, // braço a meia altura, frente
        rightArmRotX: -armUp * 0.7,
        rightForearmRotX: -armUp * 1.0 + Math.sin(phase) * 0.15,
        rightForearmRotY: Math.sin(phase) * 0.1,
        leftArmRotZ: armUp * 0.15,
        headRotX: nod,
        bodyPosY: Math.sin(t * TAU) * 0.01,
      };
    },
  },
};

export function getAnimation(name: string): ProceduralAnimation | null {
  return ANIMATIONS[name] ?? null;
}

/* ──────────────────────────────────────────────────────────────
 * Bus pub/sub — independente de `subscribeLia` (que é por gloss).
 * Aqui o canal é por NOME DE ANIMAÇÃO.
 * ────────────────────────────────────────────────────────────── */
export interface AnimationEvent {
  name: string;
  animation: ProceduralAnimation | null;
  caption?: string;
  /** Timestamp `performance.now()` em que a animação foi disparada */
  startedAt: number;
}

type Listener = (evt: AnimationEvent) => void;
const listeners = new Set<Listener>();

export function subscribeAnimation(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * API pública — executa uma animação na Lia.
 *
 *   playAnimation("Ola")
 *   playAnimation("TudoBem")
 *   playAnimation("Idle")        // volta ao estado neutro
 *
 * Retorna uma Promise que resolve quando a animação termina (útil para
 * encadear: `await playAnimation("Ola"); await playAnimation("TudoBem")`).
 *
 * Quando o GLB real existir em `animation.glbUrl`, o <Lia3DStage /> usa ele
 * automaticamente. Caso contrário, executa a função `sample()` procedural.
 * Os call-sites NÃO mudam.
 */
export function playAnimation(name: AnimationName, opts: { caption?: string } = {}): Promise<void> {
  const animation = getAnimation(name);
  const caption = opts.caption ?? animation?.defaultCaption;
  const evt: AnimationEvent = {
    name,
    animation,
    caption,
    startedAt: typeof performance !== "undefined" ? performance.now() : Date.now(),
  };
  listeners.forEach((l) => l(evt));
  const duration = animation?.durationMs ?? 800;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/** Volta para o estado neutro imediatamente. */
export function stopAnimation(): Promise<void> {
  return playAnimation("Idle");
}
