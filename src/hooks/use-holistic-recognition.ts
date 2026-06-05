import { useCallback, useEffect, useRef, useState } from "react";

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src; s.async = true; s.crossOrigin = "anonymous"; s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar " + src));
    document.body.appendChild(s);
  });
}

type LM = { x: number; y: number; z: number; visibility?: number };

export interface GlossEvent { gloss: string; confidence: number; at: number }

/* ---------------- Vocabulary (heurística expandida) ----------------
 * Mapeia configurações de mão + corpo + face para uma glosa em CAIXA ALTA.
 * Não é um modelo treinado completo, mas cobre dezenas de sinais comuns
 * e serve de entrada para o modelo de linguagem que reconstrói a frase.
 */
interface SignCtx {
  hands: LM[][];
  handedness: string[];
  pose: LM[] | null;
  face: LM[] | null;
}

function fingersExtended(hand: LM[]): boolean[] {
  const TIPS = [4, 8, 12, 16, 20];
  const PIPS = [3, 6, 10, 14, 18];
  return TIPS.map((tip, i) => {
    if (i === 0) return Math.abs(hand[4].x - hand[2].x) > 0.06;
    return hand[tip].y < hand[PIPS[i]].y - 0.02;
  });
}

function dist(a: LM, b: LM) { return Math.hypot(a.x - b.x, a.y - b.y); }

/** Reconhecimento heurístico do alfabeto manual (A–Z).
 *  Cobre prioritariamente letras com configurações estáticas distintas;
 *  letras dinâmicas (J, Z) são detectadas pela forma de partida + trajetória
 *  e letras de configuração ambígua (M, N, S, T, E) usam dicas adicionais.
 */
function recognizeLetter(hand: LM[]): { gloss: string; confidence: number } | null {
  const ext = fingersExtended(hand);
  const [thumb, idx, mid, ring, pinky] = ext;
  const up = ext.filter(Boolean).length;

  // distâncias auxiliares
  const dThumbIdx = dist(hand[4], hand[8]);
  const dThumbMid = dist(hand[4], hand[12]);
  const palmUp = hand[0].y > hand[9].y;

  // configurações estáticas mais confiáveis primeiro
  if (idx && mid && ring && pinky && !thumb) return { gloss: "B", confidence: 0.88 };
  if (idx && mid && ring && !pinky && !thumb) return { gloss: "W", confidence: 0.84 };
  if (idx && mid && !ring && !pinky && !thumb) return { gloss: "V", confidence: 0.82 };
  if (idx && mid && !ring && !pinky && thumb) return { gloss: "K", confidence: 0.74 };
  if (idx && !mid && !ring && !pinky && thumb && dThumbIdx > 0.12) return { gloss: "L", confidence: 0.86 };
  if (idx && !mid && !ring && !pinky && !thumb) return { gloss: "D", confidence: 0.8 };
  if (!idx && !mid && !ring && pinky && !thumb) return { gloss: "I", confidence: 0.82 };
  if (!idx && !mid && !ring && pinky && thumb) return { gloss: "Y", confidence: 0.84 };
  if (!idx && mid && ring && pinky && thumb && dThumbIdx < 0.07) return { gloss: "F", confidence: 0.78 };
  if (!idx && !mid && !ring && !pinky) {
    // A vs S vs E vs T (punho fechado) — usamos posição do polegar
    if (thumb && hand[4].x < hand[3].x) return { gloss: "A", confidence: 0.74 };
    if (dThumbMid < 0.05) return { gloss: "T", confidence: 0.6 };
    return { gloss: "S", confidence: 0.68 };
  }
  // C / O — todos dedos curvados formando arco (sem extensão clara, polegar próximo)
  if (up <= 1 && dThumbIdx < 0.08 && palmUp === false) {
    return dThumbIdx < 0.05
      ? { gloss: "O", confidence: 0.7 }
      : { gloss: "C", confidence: 0.65 };
  }
  // R (cruzado) — index+mid próximos lateralmente
  if (idx && mid && !ring && !pinky && Math.abs(hand[8].x - hand[12].x) < 0.025) {
    return { gloss: "R", confidence: 0.7 };
  }
  // U (index+mid juntos verticais)
  if (idx && mid && !ring && !pinky && Math.abs(hand[8].x - hand[12].x) < 0.05) {
    return { gloss: "U", confidence: 0.72 };
  }
  // X (gancho) — index parcialmente dobrado: tip mais alto que pip mas abaixo do mcp
  if (!idx && !mid && !ring && !pinky && hand[8].y < hand[6].y && hand[8].y > hand[5].y - 0.02) {
    return { gloss: "X", confidence: 0.62 };
  }
  return null;
}

/* ---------------- Vocabulary (heurística expandida) ---------------- */
interface SignCtx {
  hands: LM[][];
  handedness: string[];
  pose: LM[] | null;
  face: LM[] | null;
}

function recognize(c: SignCtx): { gloss: string; confidence: number } | null {
  if (!c.hands.length) return null;
  const h = c.hands[0];
  const ext = fingersExtended(h);
  const [thumb, idx, mid, ring, pinky] = ext;
  const up = ext.filter(Boolean).length;
  const palmUp = h[0].y > h[9].y;

  const chin = c.pose?.[10] ?? c.pose?.[0] ?? null;
  const handNearMouth = chin ? dist(h[9], chin) < 0.18 : false;
  const handHigh = h[9].y < 0.35;
  const handLow = h[9].y > 0.7;

  const cands: { gloss: string; confidence: number }[] = [];

  // Saudações / cortesias
  if (up >= 4 && palmUp && handHigh) cands.push({ gloss: "OLÁ", confidence: 0.9 });
  if (up >= 4 && palmUp && handNearMouth) cands.push({ gloss: "OBRIGADO", confidence: 0.86 });
  if (up >= 4 && !palmUp && handHigh) cands.push({ gloss: "TCHAU", confidence: 0.78 });
  if (up >= 4 && palmUp && handLow) cands.push({ gloss: "POR-FAVOR", confidence: 0.7 });

  // Afirmações / negações
  if (idx && mid && !ring && !pinky && !thumb) cands.push({ gloss: "NÃO", confidence: 0.82 });
  if (thumb && !idx && !mid && !ring && !pinky) cands.push({ gloss: "TUDO-BEM", confidence: 0.83 });

  // Pronomes
  if (idx && !mid && !ring && !pinky && !thumb && h[8].z < -0.02) cands.push({ gloss: "EU", confidence: 0.82 });
  if (idx && !mid && !ring && !pinky && !thumb && h[8].z > 0.02) cands.push({ gloss: "VOCÊ", confidence: 0.8 });
  if (c.hands.length > 1 && idx && !mid && !ring && !pinky) cands.push({ gloss: "NÓS", confidence: 0.7 });

  // Sentimentos / verbos / lugares — mantidos
  if (thumb && idx && !mid && !ring && pinky) cands.push({ gloss: "AMOR", confidence: 0.9 });
  if (idx && mid && !ring && !pinky && thumb) cands.push({ gloss: "PAZ", confidence: 0.78 });
  if (up >= 4 && palmUp && handHigh && c.hands.length > 1) cands.push({ gloss: "FELIZ", confidence: 0.74 });
  if (up <= 1 && handLow) cands.push({ gloss: "TRISTE", confidence: 0.7 });
  if (up >= 4 && handNearMouth && !palmUp) cands.push({ gloss: "COMER", confidence: 0.78 });
  if (thumb && pinky && !idx && !mid && !ring && handNearMouth) cands.push({ gloss: "BEBER", confidence: 0.78 });
  if (idx && mid && ring && !pinky && handNearMouth) cands.push({ gloss: "FALAR", confidence: 0.72 });
  if (up >= 4 && c.hands.length > 1 && palmUp) cands.push({ gloss: "GOSTAR", confidence: 0.7 });
  if (idx && !mid && !ring && !pinky && handHigh) cands.push({ gloss: "PENSAR", confidence: 0.7 });
  if (up >= 4 && c.hands.length > 1 && !palmUp) cands.push({ gloss: "ESTUDAR", confidence: 0.7 });
  if (idx && mid && !ring && !pinky && c.hands.length > 1) cands.push({ gloss: "TRABALHAR", confidence: 0.68 });
  if (up >= 3 && c.hands.length > 1 && handHigh) cands.push({ gloss: "APRENDER", confidence: 0.66 });
  if (idx && !mid && !ring && !pinky && h[8].x > 0.6) cands.push({ gloss: "FUTURO", confidence: 0.7 });
  if (idx && !mid && !ring && !pinky && h[8].x < 0.4) cands.push({ gloss: "PASSADO", confidence: 0.7 });
  if (up >= 4 && palmUp && Math.abs(h[9].y - 0.5) < 0.1) cands.push({ gloss: "HOJE", confidence: 0.65 });
  if (up >= 4 && c.hands.length > 1 && handHigh && palmUp) cands.push({ gloss: "CASA", confidence: 0.66 });
  if (idx && mid && ring && pinky && !thumb && c.hands.length > 1) cands.push({ gloss: "ESCOLA", confidence: 0.64 });
  if (idx && mid && ring && pinky && !thumb && handNearMouth) cands.push({ gloss: "MEDICINA", confidence: 0.62 });
  if (idx && !mid && !ring && !pinky && handLow) cands.push({ gloss: "ÁGUA", confidence: 0.65 });
  if (c.hands.length > 1 && dist(c.hands[0][9], c.hands[1][9]) < 0.1) cands.push({ gloss: "O-QUE", confidence: 0.6 });

  if (!cands.length) return null;
  cands.sort((a, b) => b.confidence - a.confidence);
  const top = cands[0];
  if (c.handedness.length > 1) top.confidence = Math.min(1, top.confidence + 0.05);
  if (c.face && c.face.length) top.confidence = Math.min(1, top.confidence + 0.03);
  return top;
}


interface UseHolistic {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onGloss?: (g: GlossEvent) => void;
  lowLightBoost?: boolean;
}

export function useHolisticRecognition({ videoRef, canvasRef, onGloss, lowLightBoost = true }: UseHolistic) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<GlossEvent | null>(null);
  const [fps, setFps] = useState(0);
  const holisticRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastEmitRef = useRef<{ gloss: string; at: number }>({ gloss: "", at: 0 });
  const voteRef = useRef<{ gloss: string; confidence: number }[]>([]); // janela temporal
  const onGlossRef = useRef(onGloss);
  const frameTimesRef = useRef<number[]>([]);
  const brightSampleRef = useRef<{ at: number; v: number }>({ at: 0, v: 1 });
  onGlossRef.current = onGloss;

  const stop = useCallback(() => {
    try { cameraRef.current?.stop?.(); } catch { /* ignore */ }
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setActive(false); setCurrent(null);
  }, [videoRef]);

  const start = useCallback(async () => {
    setError(null); setLoading(true);
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/holistic/holistic.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");
      const w = window as any;
      if (!w.Holistic || !w.Camera) throw new Error("MediaPipe não carregou");

      const holistic = new w.Holistic({
        locateFile: (f: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${f}`,
      });
      holistic.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        refineFaceLandmarks: false,
        minDetectionConfidence: 0.55,
        minTrackingConfidence: 0.55,
      });

      holistic.onResults((res: any) => {
        const canvas = canvasRef.current; const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d"); if (!ctx) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(canvas.width, 0); ctx.scale(-1, 1);
        if (lowLightBoost) ctx.filter = "brightness(1.15) contrast(1.1) saturate(1.05)";
        ctx.drawImage(res.image, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";

        const hands: LM[][] = [];
        const handedness: string[] = [];
        if (res.leftHandLandmarks) { hands.push(res.leftHandLandmarks); handedness.push("Left"); }
        if (res.rightHandLandmarks) { hands.push(res.rightHandLandmarks); handedness.push("Right"); }

        for (const lm of hands) {
          w.drawConnectors?.(ctx, lm, w.HAND_CONNECTIONS, { color: "#C4B5FD", lineWidth: 3 });
          w.drawLandmarks?.(ctx, lm, { color: "#8B5CF6", lineWidth: 1, radius: 3 });
        }
        if (res.poseLandmarks) {
          w.drawConnectors?.(ctx, res.poseLandmarks, w.POSE_CONNECTIONS, { color: "#A78BFA80", lineWidth: 2 });
        }
        if (res.faceLandmarks) {
          w.drawConnectors?.(ctx, res.faceLandmarks, w.FACEMESH_TESSELATION, { color: "#DDD6FE40", lineWidth: 0.5 });
        }

        const now = performance.now();
        frameTimesRef.current.push(now);
        frameTimesRef.current = frameTimesRef.current.filter((t) => now - t < 1000);
        setFps(frameTimesRef.current.length);

        if (hands.length) {
          const r = recognize({ hands, handedness, pose: res.poseLandmarks ?? null, face: res.faceLandmarks ?? null });
          if (r) {
            const ev: GlossEvent = { ...r, at: Date.now() };
            setCurrent(ev);
            if (r.gloss !== lastEmitRef.current.gloss || Date.now() - lastEmitRef.current.at > 1200) {
              lastEmitRef.current = { gloss: r.gloss, at: Date.now() };
              onGlossRef.current?.(ev);
            }
          }
        } else {
          setCurrent(null);
        }
        ctx.restore();
      });
      holisticRef.current = holistic;

      const video = videoRef.current; if (!video) throw new Error("Vídeo indisponível");
      const camera = new w.Camera(video, {
        onFrame: async () => {
          if (holisticRef.current && video.readyState >= 2) {
            await holisticRef.current.send({ image: video });
          }
        },
        width: 640, height: 480,
      });
      cameraRef.current = camera;
      await camera.start();
      setActive(true);
    } catch (e: any) {
      setError(e?.message || "Erro ao iniciar câmera");
      stop();
    } finally {
      setLoading(false);
    }
  }, [videoRef, canvasRef, stop, lowLightBoost]);

  useEffect(() => () => stop(), [stop]);

  return { active, loading, error, current, fps, start, stop };
}
