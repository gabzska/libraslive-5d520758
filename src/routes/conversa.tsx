import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Camera, CameraOff, Mic, MicOff, Volume2, Hand, ArrowLeft, Sparkles,
  Languages, Brain, Loader2, Check, Pencil, Activity, Sun,
} from "lucide-react";
import { useHolisticRecognition, type GlossEvent } from "@/hooks/use-holistic-recognition";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { translateToVLibras } from "@/lib/vlibras";
import { speak } from "@/lib/tts";
import { reconstructSentence } from "@/lib/libras.functions";
import { AlphabetBanner } from "@/components/AlphabetBanner";

export const Route = createFileRoute("/conversa")({
  head: () => ({
    meta: [
      { title: "Modo Conversa — LibrasLive AI" },
      { name: "description", content: "Tradução bidirecional em tempo real com IA contextual entre voz e Libras." },
    ],
  }),
  component: Conversa,
});

interface Entry {
  id: string;
  from: "sign" | "voice";
  text: string;
  glosses?: string[];
  confidence?: number;
  alternatives?: string[];
  at: number;
}

const LEARN_KEY = "libraslive_corrections_v1";
type Corrections = Record<string, string>;
function loadCorrections(): Corrections {
  try { return JSON.parse(localStorage.getItem(LEARN_KEY) || "{}"); } catch { return {}; }
}
function saveCorrection(glossKey: string, sentence: string) {
  const c = loadCorrections(); c[glossKey] = sentence;
  localStorage.setItem(LEARN_KEY, JSON.stringify(c));
}

function Conversa() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [lowLight, setLowLight] = useState(true);
  const [transcript, setTranscript] = useState<Entry[]>([]);

  // Gloss buffer + debounce
  const bufferRef = useRef<GlossEvent[]>([]);
  const flushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [buffer, setBuffer] = useState<GlossEvent[]>([]);
  const [translating, setTranslating] = useState(false);
  const reconstruct = useServerFn(reconstructSentence);

  const flush = useCallback(async () => {
    const items = bufferRef.current;
    if (!items.length) return;
    const rawGlosses = items.map((i) => i.gloss);
    // Agrupa letras consecutivas (A–Z) em [SOLETRADO:PALAVRA]
    const glosses: string[] = [];
    let spellBuf = "";
    const flushSpell = () => { if (spellBuf) { glosses.push(`[SOLETRADO:${spellBuf}]`); spellBuf = ""; } };
    for (const g of rawGlosses) {
      if (/^[A-Z]$/.test(g)) spellBuf += g;
      else { flushSpell(); glosses.push(g); }
    }
    flushSpell();
    const key = glosses.join("|");
    bufferRef.current = []; setBuffer([]);

    // Aprendizado: se já temos correção para esta sequência, use-a direto
    const learned = loadCorrections()[key];
    if (learned) {
      const entry: Entry = {
        id: crypto.randomUUID(), from: "sign", text: learned, glosses,
        confidence: 1, at: Date.now(),
      };
      setTranscript((t) => [entry, ...t].slice(0, 60));
      if (autoSpeak) speak(learned);
      return;
    }

    setTranslating(true);
    try {
      const context = transcript.slice(0, 8).map((e) => e.text).reverse();
      const out = await reconstruct({ data: { glosses, context } });
      const entry: Entry = {
        id: crypto.randomUUID(), from: "sign", text: out.sentence, glosses,
        confidence: out.confidence, alternatives: out.alternatives, at: Date.now(),
      };
      setTranscript((t) => [entry, ...t].slice(0, 60));
      if (autoSpeak) speak(out.sentence);
    } catch (e: any) {
      const entry: Entry = {
        id: crypto.randomUUID(), from: "sign",
        text: glosses.join(" ").toLowerCase() + "  (IA indisponível: " + (e?.message ?? "erro") + ")",
        glosses, confidence: 0.2, at: Date.now(),
      };
      setTranscript((t) => [entry, ...t].slice(0, 60));
    } finally {
      setTranslating(false);
    }
  }, [autoSpeak, reconstruct, transcript]);

  const scheduleFlush = useCallback(() => {
    if (flushTimer.current) clearTimeout(flushTimer.current);
    flushTimer.current = setTimeout(() => { void flush(); }, 950); // ≤ 1s
  }, [flush]);

  const sign = useHolisticRecognition({
    videoRef, canvasRef, lowLightBoost: lowLight,
    onGloss: (g) => {
      bufferRef.current = [...bufferRef.current, g].slice(-20);
      setBuffer([...bufferRef.current]);
      scheduleFlush();
    },
  });

  const voice = useSpeechRecognition({
    lang: "pt-BR",
    onFinal: (text) => {
      setTranscript((t) => [{ id: crypto.randomUUID(), from: "voice" as const, text, at: Date.now() }, ...t].slice(0, 60));
      translateToVLibras(text);
    },
  });

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

  // edição inline para aprendizado contínuo
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const startEdit = (e: Entry) => { setEditingId(e.id); setDraft(e.text); };
  const confirmEdit = (e: Entry) => {
    if (!draft.trim()) return;
    if (e.glosses?.length) saveCorrection(e.glosses.join("|"), draft.trim());
    setTranscript((t) => t.map((x) => (x.id === e.id ? { ...x, text: draft.trim(), confidence: 1 } : x)));
    setEditingId(null);
  };

  return (
    <main className="min-h-dvh">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Voltar
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
            <Languages className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight">Modo <span className="text-primary">Conversa</span></p>
            <p className="text-[11px] text-muted-foreground">Holistic + IA contextual</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Mãos · Rosto · Postura · LLM
        </span>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-8">
        <h1 className="text-balance text-center text-3xl font-bold sm:text-4xl">
          Libras → <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.72_0.18_280)] bg-clip-text text-transparent">Português natural</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          A câmera captura mãos, expressões e postura. Os sinais formam glosas; um modelo de linguagem
          reconstrói a frase em português brasileiro com contexto, gramática e pontuação.
        </p>
      </section>

      {(() => {
        const activeLetter =
          sign.current && /^[A-Z]$/.test(sign.current.gloss) ? sign.current.gloss : null;
        const spelledWord = buffer
          .map((g) => g.gloss)
          .filter((g) => /^[A-Z]$/.test(g))
          .join("");
        return <AlphabetBanner activeLetter={activeLetter} spelledWord={spelledWord} />;
      })()}

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 md:grid-cols-2">

        {/* SIGN → TEXT */}
        <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-card backdrop-blur">
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Libras → Texto</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Visão holística + IA</h2>
            </div>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${sign.active ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${sign.active ? "bg-primary mic-pulse" : "bg-muted-foreground/50"}`} />
              {sign.active ? `${sign.fps} fps` : "Câmera parada"}
            </div>
          </div>

          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border bg-black">
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
            {!sign.active && (
              <div className="absolute inset-0 grid place-items-center text-center text-sm text-white/80">
                <div>
                  <Hand className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-2">Toque em <span className="font-medium text-primary">Ativar câmera</span> e sinalize</p>
                </div>
              </div>
            )}
            {sign.current && (
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">
                <span className="font-medium">{sign.current.gloss}</span>
                <span className="ml-2 text-white/70">{Math.round(sign.current.confidence * 100)}%</span>
              </div>
            )}
            {translating && (
              <div className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-primary/85 px-3 py-1.5 text-xs text-primary-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> Reconstruindo frase…
              </div>
            )}
          </div>

          {/* Buffer de glosas */}
          <div className="mt-3 min-h-[40px] rounded-2xl border bg-background/60 px-3 py-2">
            <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Glosas no buffer</p>
            {buffer.length ? (
              <div className="mt-1 flex flex-wrap gap-1.5">
                {buffer.map((g, i) => (
                  <span key={i} className="rounded-full bg-primary/12 px-2 py-0.5 text-[11px] font-medium text-primary">
                    {g.gloss}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">Aguardando sinais…</p>
            )}
          </div>

          {sign.error && <p className="mt-3 text-sm text-destructive">Erro: {sign.error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!sign.active ? (
              <button onClick={sign.start} disabled={sign.loading}
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60">
                <Camera className="h-4 w-4" /> {sign.loading ? "Carregando…" : "Ativar câmera"}
              </button>
            ) : (
              <button onClick={sign.stop}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition hover:brightness-110">
                <CameraOff className="h-4 w-4" /> Parar câmera
              </button>
            )}
            <button onClick={() => void flush()} disabled={!buffer.length || translating}
              className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm transition hover:bg-accent disabled:opacity-50">
              <Brain className="h-4 w-4 text-primary" /> Traduzir agora
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm">
              <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="accent-[oklch(0.62_0.21_295)]" />
              <Volume2 className="h-4 w-4 text-primary" /> Falar tradução
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm">
              <input type="checkbox" checked={lowLight} onChange={(e) => setLowLight(e.target.checked)} className="accent-[oklch(0.62_0.21_295)]" />
              <Sun className="h-4 w-4 text-primary" /> Boost p/ pouca luz
            </label>
          </div>

          <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Activity className="h-3 w-3 text-primary" />
            MediaPipe Holistic (mãos + face + pose) · LLM gemini-3-flash · Latência alvo ≤ 1s
          </p>
        </div>

        {/* VOICE → SIGN */}
        <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-card backdrop-blur">
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Voz → Libras</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Microfone + avatar VLibras</h2>
            </div>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${voice.listening ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${voice.listening ? "bg-primary mic-pulse" : "bg-muted-foreground/50"}`} />
              {voice.listening ? "Ouvindo" : "Microfone parado"}
            </div>
          </div>

          <div className="mt-4 min-h-[210px] rounded-2xl border bg-background/60 p-5 text-lg leading-relaxed">
            {voice.interim || voice.finalText ? (
              <p className={voice.interim && !voice.finalText ? "text-muted-foreground" : "text-foreground"}>
                {voice.interim || voice.finalText}
              </p>
            ) : (
              <p className="text-muted-foreground">
                {voice.supported
                  ? "Fale em português. A frase reconhecida vai automaticamente para o avatar VLibras."
                  : "Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge."}
              </p>
            )}
          </div>

          {voice.error && <p className="mt-3 text-sm text-destructive">Erro: {voice.error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!voice.listening ? (
              <button onClick={voice.start} disabled={!voice.supported}
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50">
                <Mic className="h-4 w-4" /> Iniciar microfone
              </button>
            ) : (
              <button onClick={voice.stop}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition hover:brightness-110">
                <MicOff className="h-4 w-4" /> Parar microfone
              </button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Use o botão VLibras no canto inferior direito para ver o avatar sinalizando.
          </p>
        </div>
      </section>

      {/* TRANSCRIPT */}
      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Diálogo</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Histórico — com aprendizado contínuo</h2>
              <p className="mt-1 text-xs text-muted-foreground">Corrija uma frase e a IA passará a usar sua correção sempre que a mesma sequência de sinais voltar.</p>
            </div>
            {transcript.length > 0 && (
              <button onClick={() => setTranscript([])} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent">
                Limpar
              </button>
            )}
          </div>

          {transcript.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">A conversa aparecerá aqui.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {transcript.map((e) => (
                <li key={e.id} className={`rounded-2xl border p-4 ${e.from === "sign" ? "bg-primary/5" : "bg-background/60"}`}>
                  <div className="flex items-start gap-3">
                    <div className={`grid h-9 w-9 flex-none place-items-center rounded-full ${e.from === "sign" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                      {e.from === "sign" ? <Hand className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                          {e.from === "sign" ? "Libras → PT" : "Voz"}
                        </span>
                        {typeof e.confidence === "number" && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${e.confidence >= 0.75 ? "bg-primary/15 text-primary" : e.confidence >= 0.4 ? "bg-amber-500/15 text-amber-600" : "bg-destructive/15 text-destructive"}`}>
                            {Math.round(e.confidence * 100)}% confiança
                          </span>
                        )}
                        <span className="text-[11px] text-muted-foreground">{new Date(e.at).toLocaleTimeString("pt-BR")}</span>
                      </div>
                      {editingId === e.id ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <input value={draft} onChange={(ev) => setDraft(ev.target.value)}
                            className="flex-1 min-w-[200px] rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
                          <button onClick={() => confirmEdit(e)} className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs text-primary-foreground">
                            <Check className="h-3.5 w-3.5" /> Salvar
                          </button>
                        </div>
                      ) : (
                        <p className="mt-1 text-sm leading-relaxed">{e.text}</p>
                      )}
                      {e.glosses?.length ? (
                        <p className="mt-1 text-[11px] text-muted-foreground">Glosas: {e.glosses.join(" · ")}</p>
                      ) : null}
                      {e.alternatives?.length ? (
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {e.alternatives.map((a, i) => (
                            <button key={i} onClick={() => { setTranscript((t) => t.map((x) => x.id === e.id ? { ...x, text: a } : x)); if (e.glosses?.length) saveCorrection(e.glosses.join("|"), a); if (autoSpeak) speak(a); }}
                              className="rounded-full border bg-card px-2 py-0.5 text-[10px] text-muted-foreground hover:bg-accent">
                              {a}
                            </button>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <button onClick={() => (e.from === "sign" ? speak(e.text) : translateToVLibras(e.text))}
                        className="rounded-full border bg-card p-2 hover:bg-accent" aria-label="Reproduzir">
                        {e.from === "sign" ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <Hand className="h-3.5 w-3.5 text-primary" />}
                      </button>
                      {e.from === "sign" && (
                        <button onClick={() => startEdit(e)} className="rounded-full border bg-card p-2 hover:bg-accent" aria-label="Editar">
                          <Pencil className="h-3.5 w-3.5 text-primary" />
                        </button>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
