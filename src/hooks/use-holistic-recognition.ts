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

/* ---------------- Vocabulary (heurística expandida) ----------------
 * Usa orientação da palma + trajetória do pulso + expressão facial para
 * desambiguar sinais visualmente parecidos (EU/VOCÊ, OLÁ/TCHAU, FUTURO/PASSADO).
 */
interface SignCtx {
  hands: LM[][];
  handedness: string[];
  pose: LM[] | null;
  face: LM[] | null;
  palmFacing: "in" | "out" | "up" | "down";
  motion: "still" | "left" | "right" | "up" | "down" | "forward" | "back";
  browRaised: boolean;
  mouthOpen: boolean;
}

/** Orientação da palma via produto vetorial pulso→indicador × pulso→mindinho. */
function palmOrientation(h: LM[]): SignCtx["palmFacing"] {
  const a = { x: h[5].x - h[0].x, y: h[5].y - h[0].y, z: h[5].z - h[0].z };
  const b = { x: h[17].x - h[0].x, y: h[17].y - h[0].y, z: h[17].z - h[0].z };
  const n = {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
  const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
  if (az >= ax && az >= ay) return n.z > 0 ? "in" : "out";
  if (ay >= ax) return n.y > 0 ? "down" : "up";
  return n.x > 0 ? "in" : "out";
}

function recognize(c: SignCtx): { gloss: string; confidence: number } | null {
  if (!c.hands.length) return null;
  const h = c.hands[0];
  const ext = fingersExtended(h);
  const [thumb, idx, mid, ring, pinky] = ext;
  const up = ext.filter(Boolean).length;
  const palmUp = c.palmFacing === "up";
  const palmIn = c.palmFacing === "in";
  const palmOut = c.palmFacing === "out";

  const chin = c.pose?.[10] ?? c.pose?.[0] ?? null;
  const handNearMouth = chin ? dist(h[9], chin) < 0.18 : false;
  const handHigh = h[9].y < 0.35;
  const handLow = h[9].y > 0.7;
  const movingSide = c.motion === "left" || c.motion === "right";
  const still = c.motion === "still";

  const cands: { gloss: string; confidence: number }[] = [];

  // Saudações: OLÁ/TCHAU exigem aceno lateral
  if (up >= 4 && palmOut && handHigh) cands.push({ gloss: "OLÁ", confidence: movingSide ? 0.95 : 0.7 });
  if (up >= 4 && handNearMouth && c.motion === "forward") cands.push({ gloss: "OBRIGADO", confidence: 0.9 });
  if (up >= 4 && palmIn && handHigh && movingSide) cands.push({ gloss: "TCHAU", confidence: 0.86 });
  if (up >= 4 && palmUp && handLow) cands.push({ gloss: "POR-FAVOR", confidence: 0.72 });

  if (idx && mid && !ring && !pinky && !thumb) cands.push({ gloss: "NÃO", confidence: movingSide ? 0.9 : 0.76 });
  if (thumb && !idx && !mid && !ring && !pinky) cands.push({ gloss: "TUDO-BEM", confidence: 0.85 });

  // Pronomes desambiguados por orientação da palma
  if (idx && !mid && !ring && !pinky && !thumb && palmIn) cands.push({ gloss: "EU", confidence: 0.92 });
  if (idx && !mid && !ring && !pinky && !thumb && palmOut) cands.push({ gloss: "VOCÊ", confidence: 0.9 });
  if (c.hands.length > 1 && idx && !mid && !ring && !pinky && !still) cands.push({ gloss: "NÓS", confidence: 0.74 });

  if (thumb && idx && !mid && !ring && pinky) cands.push({ gloss: "AMOR", confidence: 0.9 });
  if (idx && mid && !ring && !pinky && thumb) cands.push({ gloss: "PAZ", confidence: 0.78 });
  if (up >= 4 && palmUp && handHigh && c.hands.length > 1) cands.push({ gloss: "FELIZ", confidence: 0.76 });
  if (up <= 1 && handLow) cands.push({ gloss: "TRISTE", confidence: 0.72 });
  if (up >= 4 && handNearMouth && !palmOut) cands.push({ gloss: "COMER", confidence: 0.8 });
  if (thumb && pinky && !idx && !mid && !ring && handNearMouth) cands.push({ gloss: "BEBER", confidence: 0.8 });
  if (idx && mid && ring && !pinky && handNearMouth) cands.push({ gloss: "FALAR", confidence: 0.74 });
  if (up >= 4 && c.hands.length > 1 && palmUp) cands.push({ gloss: "GOSTAR", confidence: 0.7 });
  if (idx && !mid && !ring && !pinky && handHigh) cands.push({ gloss: "PENSAR", confidence: 0.72 });
  if (up >= 4 && c.hands.length > 1 && !palmOut) cands.push({ gloss: "ESTUDAR", confidence: 0.7 });
  if (idx && mid && !ring && !pinky && c.hands.length > 1) cands.push({ gloss: "TRABALHAR", confidence: 0.68 });
  if (up >= 3 && c.hands.length > 1 && handHigh) cands.push({ gloss: "APRENDER", confidence: 0.66 });

  // Tempo desambiguado por trajetória
  if (idx && !mid && !ring && !pinky && c.motion === "forward") cands.push({ gloss: "FUTURO", confidence: 0.84 });
  if (idx && !mid && !ring && !pinky && c.motion === "back") cands.push({ gloss: "PASSADO", confidence: 0.84 });
  if (up >= 4 && palmUp && Math.abs(h[9].y - 0.5) < 0.1 && still) cands.push({ gloss: "HOJE", confidence: 0.7 });

  if (up >= 4 && c.hands.length > 1 && handHigh && palmUp) cands.push({ gloss: "CASA", confidence: 0.66 });
  if (idx && mid && ring && pinky && !thumb && c.hands.length > 1) cands.push({ gloss: "ESCOLA", confidence: 0.66 });
  if (idx && mid && ring && pinky && !thumb && handNearMouth) cands.push({ gloss: "MEDICINA", confidence: 0.64 });
  if (idx && !mid && !ring && !pinky && handLow) cands.push({ gloss: "ÁGUA", confidence: 0.65 });

  // Perguntas: sobrancelha levantada dá grande boost
  if (c.hands.length > 1 && dist(c.hands[0][9], c.hands[1][9]) < 0.1) {
    cands.push({ gloss: "O-QUE", confidence: c.browRaised ? 0.9 : 0.6 });
  }

  if (!cands.length) return null;
  cands.sort((a, b) => b.confidence - a.confidence);
  const top = cands[0];

  if (c.handedness.length > 1) top.confidence = Math.min(1, top.confidence + 0.04);
  if (c.face && c.face.length) top.confidence = Math.min(1, top.confidence + 0.03);
  if (c.browRaised && /^(O-QUE|COMO|POR-QUE|QUANDO)$/.test(top.gloss)) {
    top.confidence = Math.min(1, top.confidence + 0.06);
  }
  if (c.mouthOpen && top.gloss === "NÃO") top.confidence = Math.min(1, top.confidence + 0.05);

  // Penalidade por ambiguidade: 2º candidato muito próximo reduz confiança
  if (cands[1] && cands[1].confidence > top.confidence - 0.05) {
    top.confidence = Math.max(0.3, top.confidence - 0.1);
  }
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
  const wristTrailRef = useRef<{ x: number; y: number; z: number; at: number }[]>([]);
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
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
        selfieMode: true,
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
        // Boost adaptativo: amostra brilho a cada 500ms; quanto mais escuro, mais forte o filtro
        if (lowLightBoost) {
          const now0 = performance.now();
          if (now0 - brightSampleRef.current.at > 500) {
            try {
              const tmp = document.createElement("canvas");
              tmp.width = 16; tmp.height = 12;
              tmp.getContext("2d")?.drawImage(res.image, 0, 0, 16, 12);
              const d = tmp.getContext("2d")!.getImageData(0, 0, 16, 12).data;
              let s = 0; for (let i = 0; i < d.length; i += 4) s += (d[i] + d[i + 1] + d[i + 2]) / 3;
              brightSampleRef.current = { at: now0, v: s / (d.length / 4) / 255 };
            } catch { /* ignore */ }
          }
          const v = brightSampleRef.current.v; // 0=escuro 1=claro
          const b = v < 0.35 ? 1.45 : v < 0.55 ? 1.25 : 1.1;
          const c0 = v < 0.35 ? 1.35 : v < 0.55 ? 1.2 : 1.08;
          ctx.filter = `brightness(${b}) contrast(${c0}) saturate(1.05)`;
        }
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
          // Trajetória do pulso (últimos ~500ms)
          const wrist = hands[0][0];
          const tNow = performance.now();
          wristTrailRef.current.push({ x: wrist.x, y: wrist.y, z: wrist.z, at: tNow });
          wristTrailRef.current = wristTrailRef.current.filter((p) => tNow - p.at < 500);
          let motion: SignCtx["motion"] = "still";
          if (wristTrailRef.current.length >= 3) {
            const first = wristTrailRef.current[0];
            const last = wristTrailRef.current[wristTrailRef.current.length - 1];
            const dx = last.x - first.x, dy = last.y - first.y, dz = last.z - first.z;
            const ax = Math.abs(dx), ay = Math.abs(dy), az = Math.abs(dz);
            const THR = 0.04;
            if (Math.max(ax, ay, az) > THR) {
              if (ax >= ay && ax >= az) motion = dx > 0 ? "right" : "left";
              else if (ay >= az) motion = dy > 0 ? "down" : "up";
              else motion = dz > 0 ? "back" : "forward";
            }
          }
          // Orientação da palma
          const palmFacing = palmOrientation(hands[0]);
          // Expressão facial (sobrancelhas, boca) — landmarks padrão do MediaPipe
          let browRaised = false, mouthOpen = false;
          const face = res.faceLandmarks as LM[] | undefined;
          if (face && face.length > 400) {
            // distância sobrancelha esquerda (70) → olho (159), normalizada pela altura do rosto
            const faceH = Math.abs(face[10].y - face[152].y) || 1;
            const browGap = Math.abs(face[70].y - face[159].y) / faceH;
            browRaised = browGap > 0.085;
            const mouthGap = Math.abs(face[13].y - face[14].y) / faceH;
            mouthOpen = mouthGap > 0.05;
          }

          const r =
            recognize({
              hands, handedness,
              pose: res.poseLandmarks ?? null,
              face: res.faceLandmarks ?? null,
              palmFacing, motion, browRaised, mouthOpen,
            }) ??
            recognizeLetter(hands[0]);


          if (r) {
            // Voto temporal: mantém últimos 5 frames, exige maioria para emitir
            const vote = voteRef.current;
            vote.push(r);
            if (vote.length > 5) vote.shift();
            const counts: Record<string, { n: number; sum: number }> = {};
            for (const v of vote) {
              counts[v.gloss] = counts[v.gloss] || { n: 0, sum: 0 };
              counts[v.gloss].n++; counts[v.gloss].sum += v.confidence;
            }
            const top = Object.entries(counts).sort((a, b) => b[1].n - a[1].n)[0];
            if (!top) { ctx.restore(); return; }
            const [best, info] = top;
            const ratio = info.n / vote.length;
            const avgConf = info.sum / info.n;
            // confiança final ponderada pela estabilidade temporal
            const stableConf = Math.min(1, avgConf * (0.6 + 0.4 * ratio));
            const ev: GlossEvent = { gloss: best, confidence: stableConf, at: Date.now() };
            setCurrent(ev);
            // Limiar: precisa de pelo menos 3/5 frames coerentes e confiança ≥ 0.55
            const fastSign = info.n >= 2 && avgConf >= 0.78; // sinais rápidos com alta confiança
            const stableSign = info.n >= 3 && stableConf >= 0.55;
            if (stableSign || fastSign) {
              const debounce = /^[A-Z]$/.test(best) ? 450 : 700; // letras podem repetir mais rápido
              if (best !== lastEmitRef.current.gloss || Date.now() - lastEmitRef.current.at > debounce) {
                lastEmitRef.current = { gloss: best, at: Date.now() };
                onGlossRef.current?.(ev);
              }
            }
          } else {
            voteRef.current = [];
          }
        } else {
          voteRef.current = [];
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
