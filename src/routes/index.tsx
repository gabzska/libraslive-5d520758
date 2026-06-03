import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Mic, MicOff, Copy, Trash2, Moon, Sun, Hand, Sparkles, Volume2, Check } from "lucide-react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { translateToVLibras } from "@/lib/vlibras";
import { VLibrasWidget } from "@/components/VLibrasWidget";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LibrasLive AI — Voz para Libras em tempo real" },
      { name: "description", content: "Fale ao microfone e veja a tradução em Libras em tempo real com avatar VLibras. Acessibilidade para todos." },
    ],
  }),
  component: Index,
});

interface HistoryItem { id: string; text: string; at: number }

function Index() {
  const [dark, setDark] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { listening, interim, finalText, supported, error, start, stop } = useSpeechRecognition({
    lang: "pt-BR",
    onFinal: (text) => {
      translateToVLibras(text);
      setHistory((h) => [{ id: crypto.randomUUID(), text, at: Date.now() }, ...h].slice(0, 30));
    },
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const displayText = useMemo(() => {
    if (interim) return interim;
    if (finalText) return finalText;
    return "";
  }, [interim, finalText]);

  const copy = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <main className="min-h-dvh">
      <VLibrasWidget />

      {/* NAV */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
            <Hand className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-lg font-bold tracking-tight">LibrasLive <span className="text-primary">AI</span></p>
            <p className="text-[11px] text-muted-foreground">Comunicação acessível em tempo real</p>
          </div>
        </div>
        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Alternar modo escuro"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/70 backdrop-blur transition hover:bg-accent"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </header>

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pt-4 pb-10 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Powered by VLibras + Web Speech API
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
          Sua voz traduzida para{" "}
          <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.72_0.18_280)] bg-clip-text text-transparent">
            Libras
          </span>{" "}
          em tempo real
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-balance text-sm text-muted-foreground sm:text-base">
          Fale ao microfone e veja a transcrição e o avatar de Libras sinalizando instantaneamente.
          Pensado para escolas, hospitais, universidades e órgãos públicos.
        </p>
      </section>

      {/* MAIN GRID */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-12 md:grid-cols-5">
        {/* Avatar card */}
        <div className="md:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-card backdrop-blur">
            <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
            <div className="relative">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Avatar de Libras</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Tradução visual</h2>

              <div className="mt-5 grid place-items-center rounded-2xl border bg-gradient-to-b from-secondary/60 to-background/60 px-4 py-10">
                <div className="float-soft grid h-40 w-40 place-items-center rounded-full gradient-primary shadow-glow">
                  <Hand className="h-16 w-16 text-primary-foreground" />
                </div>
                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Toque no botão <span className="font-medium text-foreground">VLibras</span> no canto inferior direito para abrir o avatar oficial e ver a sinalização.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Controls + transcript */}
        <div className="md:col-span-3">
          <div className="relative overflow-hidden rounded-3xl border bg-card/80 p-6 shadow-card backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Transcrição</p>
                <h2 className="mt-1 font-display text-xl font-semibold">Fale agora</h2>
              </div>
              <div className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs ${listening ? "border-primary/40 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                <span className={`h-2 w-2 rounded-full ${listening ? "bg-primary mic-pulse" : "bg-muted-foreground/50"}`} />
                {listening ? "Microfone ativo" : "Microfone parado"}
              </div>
            </div>

            <div className="mt-5 min-h-[160px] rounded-2xl border bg-background/60 p-5 text-lg leading-relaxed">
              {displayText ? (
                <p className={interim && !finalText ? "text-muted-foreground" : "text-foreground"}>
                  {displayText}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  {supported
                    ? "Sua fala aparecerá aqui. Pressione “Iniciar” e comece a falar em português."
                    : "Seu navegador não suporta reconhecimento de voz. Use o Chrome ou Edge no desktop ou Android."}
                </p>
              )}
            </div>

            {error && (
              <p className="mt-3 text-sm text-destructive">Erro: {error}. Verifique a permissão do microfone.</p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              {!listening ? (
                <button
                  onClick={start}
                  disabled={!supported}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-6 py-3 font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-50"
                >
                  <Mic className="h-4 w-4" /> Iniciar gravação
                </button>
              ) : (
                <button
                  onClick={stop}
                  className="inline-flex items-center gap-2 rounded-full bg-destructive px-6 py-3 font-medium text-destructive-foreground shadow-card transition hover:brightness-110"
                >
                  <MicOff className="h-4 w-4" /> Parar gravação
                </button>
              )}

              <button
                onClick={() => finalText && copy(finalText, "current")}
                disabled={!finalText}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
              >
                {copiedId === "current" ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                {copiedId === "current" ? "Copiado" : "Copiar texto"}
              </button>

              <button
                onClick={() => finalText && translateToVLibras(finalText)}
                disabled={!finalText}
                className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-3 text-sm font-medium transition hover:bg-accent disabled:opacity-50"
              >
                <Volume2 className="h-4 w-4 text-primary" /> Re-sinalizar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* HISTORY */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Histórico</p>
              <h2 className="mt-1 font-display text-xl font-semibold">Últimas frases</h2>
            </div>
            {history.length > 0 && (
              <button
                onClick={() => setHistory([])}
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-accent"
              >
                <Trash2 className="h-3.5 w-3.5" /> Limpar
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">Suas frases reconhecidas aparecerão aqui.</p>
          ) : (
            <ul className="mt-5 space-y-3">
              {history.map((h) => (
                <li key={h.id} className="group flex items-start gap-3 rounded-2xl border bg-background/60 p-4">
                  <div className="grid h-8 w-8 flex-none place-items-center rounded-full bg-primary/15 text-primary">
                    <Hand className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm leading-relaxed">{h.text}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {new Date(h.at).toLocaleTimeString("pt-BR")}
                    </p>
                  </div>
                  <div className="flex flex-none items-center gap-1.5 opacity-0 transition group-hover:opacity-100">
                    <button
                      onClick={() => translateToVLibras(h.text)}
                      className="rounded-full border bg-card p-2 hover:bg-accent"
                      aria-label="Sinalizar novamente"
                    >
                      <Volume2 className="h-3.5 w-3.5 text-primary" />
                    </button>
                    <button
                      onClick={() => copy(h.text, h.id)}
                      className="rounded-full border bg-card p-2 hover:bg-accent"
                      aria-label="Copiar"
                    >
                      {copiedId === h.id ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t bg-card/40 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-muted-foreground">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <p className="font-display font-semibold text-foreground">LibrasLive AI</p>
              <p className="text-xs">Construído com acessibilidade no centro — em conformidade com a LBI (Lei 13.146/2015).</p>
            </div>
            <p className="text-xs">
              Avatar oficial fornecido por <a className="text-primary hover:underline" href="https://www.gov.br/governodigital/pt-br/vlibras" target="_blank" rel="noreferrer">VLibras / Governo Federal</a>.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
