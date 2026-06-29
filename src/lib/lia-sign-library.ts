/**
 * Lia Sign Library
 * ----------------
 * Registry desacoplado de sinais (glosses) para a Lia executar.
 *
 * Hoje: cada sinal tem apenas um `label` + `description` (consumido pelo
 * <LiaInterpreter /> 2D, que mostra o gloss num balão animado).
 *
 * Amanhã: o mesmo registry vai apontar para um arquivo `.glb` de animação
 * por gloss (ex.: `/models/signs/OLA.glb`), e o <Lia3DStage /> vai tocar a
 * `AnimationAction` correspondente. A API pública `playSign(gloss)` não muda
 * — só a implementação interna do player.
 */

export type LiaState = "idle" | "listening" | "thinking" | "signing";

export interface SignDefinition {
  /** Gloss em maiúsculas, ex: "OLÁ" */
  gloss: string;
  /** Forma natural em PT-BR para exibição no balão */
  label: string;
  /** Descrição curta da execução do sinal (mão, movimento) */
  description?: string;
  /** Duração estimada da animação em ms (usada pelo player 2D) */
  durationMs?: number;
  /**
   * Caminho futuro para a animação 3D individual.
   * Quando definido E o avatar 3D estiver carregado, o player vai tocar
   * esta animação no rig em vez do fallback 2D.
   */
  animationUrl?: string;
}

/**
 * Biblioteca inicial — sementes do core. Expandir incrementalmente.
 * Mantida pequena de propósito: o source-of-truth de longo prazo é o
 * Signal Library Service (DB), este registry é apenas o catálogo
 * executável pela Lia.
 */
/**
 * Convenção: cada gloss aponta para um arquivo `.glb` em
 * `/public/animations/<gloss>.glb` (slug normalizado, sem acentos).
 * Quando o arquivo ainda não existe, o pipeline 3D ignora silenciosamente
 * e o balão 2D continua respondendo — sem quebrar nada.
 */
const anim = (slug: string) => `/animations/${slug}.glb`;

export const SIGN_LIBRARY: Record<string, SignDefinition> = {
  "OLÁ":      { gloss: "OLÁ",      label: "Olá",      description: "Mão aberta acena ao lado da cabeça",        durationMs: 1100, animationUrl: anim("ola") },
  "TCHAU":    { gloss: "TCHAU",    label: "Tchau",    description: "Mão aberta acena para fora",                 durationMs: 1100, animationUrl: anim("tchau") },
  "OBRIGADO": { gloss: "OBRIGADO", label: "Obrigado", description: "Mão do queixo para frente",                  durationMs: 1200, animationUrl: anim("obrigado") },
  "POR-FAVOR":{ gloss: "POR-FAVOR",label: "Por favor",description: "Mão circula sobre o peito",                  durationMs: 1200, animationUrl: anim("por-favor") },
  "SIM":      { gloss: "SIM",      label: "Sim",      description: "Punho fechado balança afirmativo",           durationMs: 800,  animationUrl: anim("sim") },
  "NÃO":      { gloss: "NÃO",      label: "Não",      description: "Indicador balança lateralmente",             durationMs: 800,  animationUrl: anim("nao") },
  "EU":       { gloss: "EU",       label: "Eu",       description: "Indicador aponta para o próprio peito",      durationMs: 700,  animationUrl: anim("eu") },
  "VOCÊ":     { gloss: "VOCÊ",     label: "Você",     description: "Indicador aponta para frente",               durationMs: 700,  animationUrl: anim("voce") },
  "AMOR":     { gloss: "AMOR",     label: "Amor",     description: "Mãos cruzadas sobre o peito",                durationMs: 1300, animationUrl: anim("amor") },
  "LIBRAS":   { gloss: "LIBRAS",   label: "Libras",   description: "Sinal das mãos rotacionando, símbolo da língua", durationMs: 1400, animationUrl: anim("libras") },
  "BRASIL":   { gloss: "BRASIL",   label: "Brasil",   description: "Mão em B com movimento característico",      durationMs: 1200, animationUrl: anim("brasil") },
  "AJUDA":    { gloss: "AJUDA",    label: "Ajuda",    description: "Punho fechado sobe na palma aberta",         durationMs: 1100, animationUrl: anim("ajuda") },
};

export function getSign(gloss: string): SignDefinition | null {
  if (!gloss) return null;
  const key = gloss.trim().toUpperCase();
  return SIGN_LIBRARY[key] ?? null;
}

/** Bus pub/sub leve para a Lia reagir globalmente a playSign() */
type Listener = (event: { gloss: string; sign: SignDefinition | null; text?: string }) => void;
const listeners = new Set<Listener>();

export function subscribeLia(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * API pública — executa um sinal pela Lia.
 *
 * @param gloss   Gloss em Libras (ex: "OLÁ", "OBRIGADO")
 * @param opts.text  Texto em português opcional (mostrado no balão)
 *
 * Hoje: dispara animação 2D no <LiaInterpreter />.
 * Amanhã: se o <Lia3DStage /> estiver montado E o sign tiver `animationUrl`,
 * a animação 3D é executada em vez do balão. Mesma chamada, sem refactor.
 */
export function playSign(gloss: string, opts: { text?: string } = {}): Promise<void> {
  const sign = getSign(gloss);
  const payload = { gloss: gloss.trim().toUpperCase(), sign, text: opts.text };
  listeners.forEach((l) => l(payload));
  const duration = sign?.durationMs ?? 900;
  return new Promise((resolve) => setTimeout(resolve, duration));
}

/** Executa uma sequência de glosses em ordem (ex: ["EU","QUERER","ÁGUA"]) */
export async function playSequence(glosses: string[], opts: { text?: string } = {}): Promise<void> {
  if (opts.text) {
    // Mostra a frase inteira no balão durante toda a sequência
    listeners.forEach((l) => l({ gloss: glosses.join(" "), sign: null, text: opts.text }));
  }
  for (const g of glosses) {
    await playSign(g);
  }
}
