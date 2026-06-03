import { useCallback, useEffect, useRef, useState } from "react";

type SR = typeof window extends { SpeechRecognition: infer T } ? T : any;

interface UseSpeechOptions {
  lang?: string;
  onFinal?: (text: string) => void;
}

export function useSpeechRecognition({ lang = "pt-BR", onFinal }: UseSpeechOptions = {}) {
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");
  const [supported, setSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<any>(null);
  const onFinalRef = useRef(onFinal);
  onFinalRef.current = onFinal;

  useEffect(() => {
    const SR: any =
      (typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition));
    if (!SR) {
      setSupported(false);
      return;
    }
    const rec = new SR();
    rec.lang = lang;
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (event: any) => {
      let interimStr = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const transcript = res[0].transcript;
        if (res.isFinal) {
          const clean = transcript.trim();
          if (clean) {
            setFinalText(clean);
            onFinalRef.current?.(clean);
          }
        } else {
          interimStr += transcript;
        }
      }
      setInterim(interimStr);
    };
    rec.onerror = (e: any) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(e.error || "Erro no reconhecimento");
    };
    rec.onend = () => {
      // Auto-restart while user wants to listen
      if (recRef.current?.__active) {
        try { rec.start(); } catch { /* ignore */ }
      } else {
        setListening(false);
      }
    };
    recRef.current = rec;
    return () => {
      try { rec.stop(); } catch { /* ignore */ }
      recRef.current = null;
    };
  }, [lang]);

  const start = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    setError(null);
    setInterim("");
    rec.__active = true;
    try { rec.start(); setListening(true); } catch { /* already started */ }
  }, []);

  const stop = useCallback(() => {
    const rec = recRef.current;
    if (!rec) return;
    rec.__active = false;
    try { rec.stop(); } catch { /* ignore */ }
    setListening(false);
    setInterim("");
  }, []);

  return { listening, interim, finalText, supported, error, start, stop };
}
