import { useCallback, useEffect, useRef, useState } from "react";

// Load a script tag once
function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[data-src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.crossOrigin = "anonymous";
    s.dataset.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar " + src));
    document.body.appendChild(s);
  });
}

type Landmark = { x: number; y: number; z: number };

interface SignResult {
  label: string;
  confidence: number;
}

// Heuristic vocabulary: detect finger extension state + position
// Returns the best matching sign and confidence (0..1)
function recognize(handLandmarks: Landmark[][], handedness: string[]): SignResult | null {
  if (!handLandmarks.length) return null;
  const hand = handLandmarks[0];

  // Finger extended detection: tip y < pip y (camera mirrored, y grows downward)
  // For thumb use x distance from index MCP
  const TIPS = [4, 8, 12, 16, 20];
  const PIPS = [3, 6, 10, 14, 18];
  const extended = TIPS.map((tip, i) => {
    if (i === 0) {
      // thumb: compare distance from wrist
      const dx = Math.abs(hand[4].x - hand[2].x);
      return dx > 0.06;
    }
    return hand[tip].y < hand[PIPS[i]].y - 0.02;
  });
  const [thumb, index, middle, ring, pinky] = extended;
  const upCount = extended.filter(Boolean).length;

  // Hand orientation
  const palmUp = hand[0].y > hand[9].y; // wrist below middle MCP => hand pointing up

  const candidates: SignResult[] = [];

  // OLÁ — open hand, all fingers extended, palm up
  if (upCount >= 4 && palmUp) candidates.push({ label: "Olá", confidence: 0.9 });

  // SIM — closed fist
  if (upCount <= 1 && !index && !middle) candidates.push({ label: "Sim", confidence: 0.85 });

  // NÃO — index + middle extended (like "scissors"), others closed
  if (index && middle && !ring && !pinky) candidates.push({ label: "Não", confidence: 0.82 });

  // EU — only index pointing
  if (index && !middle && !ring && !pinky && !thumb) candidates.push({ label: "Eu", confidence: 0.8 });

  // AMOR — pinky + index + thumb (rock sign / I love you)
  if (thumb && index && !middle && !ring && pinky) candidates.push({ label: "Amor", confidence: 0.92 });

  // OBRIGADO — flat hand near chin (approx: open hand pointing up, near top of frame)
  if (upCount >= 4 && palmUp && hand[9].y < 0.35) candidates.push({ label: "Obrigado", confidence: 0.78 });

  // OK — thumb up only
  if (thumb && !index && !middle && !ring && !pinky) candidates.push({ label: "Tudo bem", confidence: 0.83 });

  // PAZ — index + middle up, thumb out
  if (index && middle && !ring && !pinky && thumb) candidates.push({ label: "Paz", confidence: 0.8 });

  // VOCÊ — index pointing forward (low z on tip)
  if (index && !middle && !ring && !pinky && hand[8].z < -0.05) candidates.push({ label: "Você", confidence: 0.75 });

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.confidence - a.confidence);
  const top = candidates[0];
  // Boost confidence slightly if both hands visible
  if (handedness.length > 1) top.confidence = Math.min(1, top.confidence + 0.05);
  return top;
}

interface UseHandSign {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSign?: (sign: SignResult) => void;
}

export function useHandSignRecognition({ videoRef, canvasRef, onSign }: UseHandSign) {
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<SignResult | null>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);
  const lastEmitRef = useRef<{ label: string; at: number }>({ label: "", at: 0 });
  const onSignRef = useRef(onSign);
  onSignRef.current = onSign;

  const stop = useCallback(() => {
    try { cameraRef.current?.stop?.(); } catch { /* ignore */ }
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    setActive(false);
    setCurrent(null);
  }, [videoRef]);

  const start = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js");

      const w = window as any;
      if (!w.Hands || !w.Camera) throw new Error("MediaPipe não carregou");

      const hands = new w.Hands({
        locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
      });
      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      hands.onResults((results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // mirror
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

        if (results.multiHandLandmarks?.length) {
          for (const lm of results.multiHandLandmarks) {
            w.drawConnectors?.(ctx, lm, w.HAND_CONNECTIONS, { color: "#C4B5FD", lineWidth: 3 });
            w.drawLandmarks?.(ctx, lm, { color: "#8B5CF6", lineWidth: 1, radius: 3 });
          }
          const handedness = (results.multiHandedness || []).map((h: any) => h.label);
          const sign = recognize(results.multiHandLandmarks, handedness);
          if (sign) {
            setCurrent(sign);
            const now = Date.now();
            if (sign.label !== lastEmitRef.current.label || now - lastEmitRef.current.at > 2500) {
              lastEmitRef.current = { label: sign.label, at: now };
              onSignRef.current?.(sign);
            }
          } else {
            setCurrent(null);
          }
        } else {
          setCurrent(null);
        }
        ctx.restore();
      });
      handsRef.current = hands;

      const video = videoRef.current;
      if (!video) throw new Error("Vídeo não disponível");

      const camera = new w.Camera(video, {
        onFrame: async () => {
          if (handsRef.current && video.readyState >= 2) {
            await handsRef.current.send({ image: video });
          }
        },
        width: 640,
        height: 480,
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
  }, [videoRef, canvasRef, stop]);

  useEffect(() => () => stop(), [stop]);

  return { active, loading, error, current, start, stop };
}
