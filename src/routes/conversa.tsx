import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Mic, MicOff, Volume2, Hand, ArrowLeft, Sparkles, Languages } from "lucide-react";
import { useHandSignRecognition } from "@/hooks/use-hand-sign-recognition";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { translateToVLibras } from "@/lib/vlibras";
import { speak } from "@/lib/tts";

export const Route = createFileRoute("/conversa")({
  head: () => ({
    meta: [
      { title: "Modo Conversa — LibrasLive AI" },
      { name: "description", content: "Tradução bidirecional em tempo real entre voz e Libras com câmera e microfone." },
    ],
  }),
  component: Conversa,
});

interface Entry { id: string; from: "sign" | "voice"; text: string; confidence?: number; at: number }

function Conversa() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [autoSpeak, setAutoSpeak] = useState(true);
  const [transcript, setTranscript] = useState<Entry[]>([]);

  const pushEntry = (e: Omit<Entry, "id" | "at">) =>
    setTranscript((t) => [{ ...e, id: crypto.randomUUID(), at: Date.now() }, ...t].slice(0, 40));

  const sign = useHandSignRecognition({
    videoRef,
    canvasRef,
    onSign: (s) => {
      pushEntry({ from: "sign", text: s.label, confidence: s.confidence });
      if (autoSpeak) speak(s.label);
    },
  });

  const voice = useSpeechRecognition({
    lang: "pt-BR",
    onFinal: (text) => {
      pushEntry({ from: "voice", text });
      translateToVLibras(text);
    },
  });

  useEffect(() => () => { try { window.speechSynthesis?.cancel(); } catch { /* ignore */ } }, []);

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
            <p className="text-[11px] text-muted-foreground">Tradução bidirecional em tempo real</p>
          </div>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> MediaPipe + VLibras
        </span>
      </header>

      <section className="mx-auto max-w-7xl px-5 pb-10">
        <h1 className="text-balance text-center text-3xl font-bold sm:text-4xl">
          Surdos e ouvintes <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.72_0.18_280)] bg-clip-text text-transparent">conversando</span> juntos
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">
          A câmera reconhece sinais de Libras e converte para voz; o microfone capta a fala e o avatar VLibras responde sinalizando.
        </p>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 pb-10 md:grid-cols-2">
        {/* SIGN -> TEXT */}
        <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-5 shadow-card backdrop-blur">
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
          <div className="relative flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Libras → Texto</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Câmera + visão computacional</h2>
            </div>
            <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${sign.active ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
              <span className={`h-2 w-2 rounded-full ${sign.active ? "bg-primary mic-pulse" : "bg-muted-foreground/50"}`} />
              {sign.active ? "Câmera ativa" : "Câmera parada"}
            </div>
          </div>

          <div className="relative mt-4 aspect-[4/3] overflow-hidden rounded-2xl border bg-black">
            <video ref={videoRef} className="hidden" playsInline muted />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full object-cover" />
            {!sign.active && (
              <div className="absolute inset-0 grid place-items-center text-center text-sm text-white/80">
                <div>
                  <Hand className="mx-auto h-10 w-10 text-primary" />
                  <p className="mt-2">Toque em <span className="font-medium text-primary">Ativar câmera</span> e sinalize na frente da tela</p>
                </div>
              </div>
            )}
            {sign.current && (
              <div className="absolute left-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-xs text-white backdrop-blur">
                <span className="font-medium text-primary-foreground">{sign.current.label}</span>
                <span className="ml-2 text-white/70">{Math.round(sign.current.confidence * 100)}%</span>
              </div>
            )}
          </div>

          {sign.error && <p className="mt-3 text-sm text-destructive">Erro: {sign.error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!sign.active ? (
              <button
                onClick={sign.start}
                disabled={sign.loading}
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
              >
                <Camera className="h-4 w-4" /> {sign.loading ? "Carregando..." : "Ativar câmera"}
              </button>
            ) : (
              <button
                onClick={sign.stop}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition hover:brightness-110"
              >
                <CameraOff className="h-4 w-4" /> Parar câmera
              </button>
            )}
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm">
              <input type="checkbox" checked={autoSpeak} onChange={(e) => setAutoSpeak(e.target.checked)} className="accent-[oklch(0.62_0.21_295)]" />
              <Volume2 className="h-4 w-4 text-primary" /> Falar sinais
            </label>
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Vocabulário demo: Olá, Sim, Não, Eu, Você, Amor, Obrigado, Tudo bem, Paz. Em produção, o modelo é expandido com dataset próprio.
          </p>
        </div>

        {/* VOICE -> SIGN */}
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
                  ? "Fale em português. A frase reconhecida vai automaticamente para o avatar VLibras no canto da tela."
                  : "Seu navegador não suporta reconhecimento de voz. Use Chrome ou Edge."}
              </p>
            )}
          </div>

          {voice.error && <p className="mt-3 text-sm text-destructive">Erro: {voice.error}</p>}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            {!voice.listening ? (
              <button
                onClick={voice.start}
                disabled={!voice.supported}
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
              >
                <Mic className="h-4 w-4" /> Iniciar microfone
              </button>
            ) : (
              <button
                onClick={voice.stop}
                className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-2.5 text-sm font-medium text-destructive-foreground transition hover:brightness-110"
              >
                <MicOff className="h-4 w-4" /> Parar microfone
              </button>
            )}
          </div>

          <p className="mt-3 text-[11px] text-muted-foreground">
            Use o botão VLibras (canto inferior direito) para abrir o avatar oficial e ver a sinalização.
          </p>
        </div>
      </section>

      {/* TRANSCRIPT */}
      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Diálogo</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Histórico da conversa</h2>
            </div>
            {transcript.length > 0 && (
              <button onClick={() => setTranscript([])} className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent">
                Limpar
              </button>
            )}
          </div>

          {transcript.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">A conversa aparecerá aqui — fala de um lado, sinais do outro.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {transcript.map((e) => (
                <li
                  key={e.id}
                  className={`flex items-start gap-3 rounded-2xl border p-4 ${e.from === "sign" ? "bg-primary/5" : "bg-background/60"}`}
                >
                  <div className={`grid h-9 w-9 flex-none place-items-center rounded-full ${e.from === "sign" ? "bg-primary/15 text-primary" : "bg-secondary text-secondary-foreground"}`}>
                    {e.from === "sign" ? <Hand className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                        {e.from === "sign" ? "Libras" : "Voz"}
                      </span>
                      {typeof e.confidence === "number" && (
                        <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-medium text-primary">
                          {Math.round(e.confidence * 100)}% confiança
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">{new Date(e.at).toLocaleTimeString("pt-BR")}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{e.text}</p>
                  </div>
                  <button
                    onClick={() => (e.from === "sign" ? speak(e.text) : translateToVLibras(e.text))}
                    className="rounded-full border bg-card p-2 hover:bg-accent"
                    aria-label="Reproduzir"
                  >
                    {e.from === "sign" ? <Volume2 className="h-3.5 w-3.5 text-primary" /> : <Hand className="h-3.5 w-3.5 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}
