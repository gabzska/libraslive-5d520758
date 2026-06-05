import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen, ChevronDown, ChevronUp, GraduationCap, Hand, Search,
  Sparkles, X,
} from "lucide-react";

/**
 * Banner interativo do Alfabeto Manual de Libras.
 * - Lista A–Z com ilustração estilizada do sinal (SVG)
 * - Expansível / recolhível, mobile-first
 * - Destaca a letra reconhecida ao vivo (prop `activeLetter`)
 * - Mostra a palavra sendo soletrada (prop `spelledWord`)
 * - Modo "Aprender Alfabeto" com flashcards e dicas
 */

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

// Dicas curtas sobre o posicionamento da mão (alfabeto manual brasileiro)
const HINTS: Record<string, string> = {
  A: "Mão fechada, polegar ao lado dos dedos.",
  B: "Mão aberta, dedos juntos e estendidos, polegar dobrado sobre a palma.",
  C: "Mão em forma de C, dedos curvados.",
  D: "Indicador estendido para cima; demais dedos tocam o polegar formando um O.",
  E: "Dedos dobrados tocando o polegar; punho fechado parcialmente.",
  F: "Indicador e polegar formam um círculo; outros três dedos estendidos.",
  G: "Indicador e polegar estendidos paralelos, lateralmente.",
  H: "Indicador e médio estendidos juntos, lateralmente.",
  I: "Mindinho estendido para cima; demais dedos fechados.",
  J: "Mindinho estendido desenhando um “J” no ar.",
  K: "Indicador para cima, médio para o lado, polegar entre eles.",
  L: "Polegar e indicador estendidos formando um L.",
  M: "Três dedos (indicador, médio, anelar) sobre o polegar.",
  N: "Dois dedos (indicador, médio) sobre o polegar.",
  O: "Todos os dedos curvados tocando o polegar — forma de O.",
  P: "Como o K, porém apontando para baixo.",
  Q: "Como o G, porém apontando para baixo.",
  R: "Indicador e médio cruzados, estendidos.",
  S: "Punho fechado, polegar sobre os dedos.",
  T: "Punho fechado, polegar entre indicador e médio.",
  U: "Indicador e médio estendidos juntos, para cima.",
  V: "Indicador e médio estendidos formando V.",
  W: "Indicador, médio e anelar estendidos.",
  X: "Indicador dobrado em gancho; demais fechados.",
  Y: "Polegar e mindinho estendidos (hang-loose).",
  Z: "Indicador desenha um “Z” no ar.",
};

// Ilustração SVG estilizada da mão para cada letra.
// Mantém-se simples e legível dentro de 64×64, na identidade lilás/branco.
function HandGlyph({ letter, size = 64 }: { letter: string; size?: number }) {
  // Padrão base: palma arredondada + dedos representados por barras
  // Variamos quais dedos estão estendidos para sugerir cada letra.
  const fingersExtended: Record<string, boolean[]> = {
    // [polegar, indicador, médio, anelar, mindinho]
    A: [true, false, false, false, false],
    B: [false, true, true, true, true],
    C: [true, true, true, true, true], // curvados
    D: [true, true, false, false, false],
    E: [false, false, false, false, false],
    F: [false, false, true, true, true],
    G: [true, true, false, false, false],
    H: [false, true, true, false, false],
    I: [false, false, false, false, true],
    J: [false, false, false, false, true],
    K: [true, true, true, false, false],
    L: [true, true, false, false, false],
    M: [true, true, true, true, false],
    N: [true, true, true, false, false],
    O: [true, true, true, true, true], // todos curvados em círculo
    P: [true, true, true, false, false],
    Q: [true, true, false, false, false],
    R: [false, true, true, false, false],
    S: [false, false, false, false, false],
    T: [false, true, false, false, false],
    U: [false, true, true, false, false],
    V: [false, true, true, false, false],
    W: [false, true, true, true, false],
    X: [false, true, false, false, false],
    Y: [true, false, false, false, true],
    Z: [false, true, false, false, false],
  };

  const ext = fingersExtended[letter] ?? [false, false, false, false, false];
  const curved = letter === "C" || letter === "O";
  const cx = 32;
  const palmY = 44;

  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden>
      <defs>
        <linearGradient id={`g-${letter}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.72 0.18 295)" />
          <stop offset="100%" stopColor="oklch(0.55 0.22 295)" />
        </linearGradient>
      </defs>
      {/* palma */}
      <rect x={20} y={palmY - 6} width={24} height={16} rx={7}
        fill={`url(#g-${letter})`} opacity={0.95} />
      {/* dedos: indicador, médio, anelar, mindinho */}
      {[0, 1, 2, 3].map((i) => {
        const isExt = ext[i + 1];
        const x = 22 + i * 5.5;
        const h = isExt ? (curved ? 14 : 20) : 6;
        const y = palmY - 6 - h;
        return (
          <rect key={i} x={x} y={y} width={4} height={h} rx={2}
            fill={`url(#g-${letter})`}
            transform={curved && isExt ? `rotate(${(i - 1.5) * 6} ${x + 2} ${palmY - 6})` : undefined}
          />
        );
      })}
      {/* polegar */}
      {ext[0] && (
        <rect x={letter === "Y" ? 12 : 16} y={palmY - 2} width={4} height={letter === "L" || letter === "Y" ? 16 : 10}
          rx={2} fill={`url(#g-${letter})`}
          transform={`rotate(${letter === "L" || letter === "Y" ? -40 : -20} 18 ${palmY})`} />
      )}
      {/* contorno sutil */}
      <rect x={20} y={palmY - 6} width={24} height={16} rx={7}
        fill="none" stroke="oklch(0.35 0.12 295 / 0.25)" strokeWidth={0.5} />
      {/* letra discreta */}
      <text x={cx} y={60} textAnchor="middle"
        fontFamily="Plus Jakarta Sans, Inter, sans-serif" fontWeight={700}
        fontSize={9} fill="oklch(0.35 0.12 295 / 0.7)">
        {letter}
      </text>
    </svg>
  );
}

interface Props {
  /** Letra atualmente reconhecida pela câmera (A–Z). */
  activeLetter?: string | null;
  /** Palavra sendo soletrada (sequência de letras). */
  spelledWord?: string;
  /** Iniciar recolhido em telas pequenas. */
  defaultOpen?: boolean;
}

export function AlphabetBanner({ activeLetter, spelledWord = "", defaultOpen = true }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [query, setQuery] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [learnMode, setLearnMode] = useState(false);
  const [quizIdx, setQuizIdx] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return LETTERS;
    return LETTERS.filter((l) => l.includes(q));
  }, [query]);

  // auto-scroll para a letra ativa
  useEffect(() => {
    if (activeLetter && activeRef.current && open) {
      activeRef.current.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  }, [activeLetter, open]);

  const quizLetter = LETTERS[quizIdx];

  return (
    <section
      aria-label="Alfabeto manual de Libras"
      className="mx-auto w-full max-w-7xl px-5 pb-6"
    >
      <div className="relative overflow-hidden rounded-3xl border bg-card/80 shadow-card backdrop-blur">
        <div className="absolute inset-x-0 -top-24 h-40 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />

        {/* Cabeçalho */}
        <header className="relative flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="leading-tight">
              <p className="font-display text-base font-bold tracking-tight sm:text-lg">
                Alfabeto Manual <span className="text-primary">de Libras</span>
              </p>
              <p className="text-[11px] text-muted-foreground">
                Consulta rápida · Treinamento · Destaque em tempo real
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => { setLearnMode((v) => !v); setShowAnswer(false); }}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
                learnMode ? "border-primary/40 bg-primary/15 text-primary" : "bg-card hover:bg-accent"
              }`}
              aria-pressed={learnMode}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {learnMode ? "Sair do treino" : "Aprender alfabeto"}
            </button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent"
              aria-expanded={open}
              aria-controls="alphabet-body"
            >
              {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
              {open ? "Recolher" : "Expandir"}
            </button>
          </div>
        </header>

        {/* Palavra soletrada + letra ativa */}
        <div className="relative flex flex-wrap items-center gap-3 border-t border-border/70 bg-background/40 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Soletrando
          </div>
          <div className="min-h-[28px] flex-1 truncate font-display text-lg font-semibold tracking-wider text-foreground">
            {spelledWord ? spelledWord.toUpperCase() : <span className="text-muted-foreground">—</span>}
          </div>
          {activeLetter && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground shadow-glow">
              <Hand className="h-3.5 w-3.5" /> Letra atual: {activeLetter.toUpperCase()}
            </span>
          )}
        </div>

        {/* Corpo expansível */}
        <div
          id="alphabet-body"
          className={`grid transition-[grid-template-rows] duration-300 ease-out ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
        >
          <div className="overflow-hidden">
            {!learnMode ? (
              <div className="p-4 sm:p-5">
                {/* Busca */}
                <label className="mb-3 flex items-center gap-2 rounded-full border bg-background/70 px-3 py-2 text-sm focus-within:ring-2 focus-within:ring-primary/40">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value.slice(0, 1))}
                    placeholder="Buscar letra (A–Z)…"
                    className="w-full bg-transparent outline-none placeholder:text-muted-foreground"
                    aria-label="Buscar letra"
                  />
                </label>

                {/* Grade A–Z */}
                <div className="grid grid-cols-6 gap-2 sm:grid-cols-9 md:grid-cols-13 lg:grid-cols-13">
                  {filtered.map((l) => {
                    const isActive = activeLetter?.toUpperCase() === l;
                    return (
                      <button
                        key={l}
                        ref={isActive ? activeRef : undefined}
                        onMouseEnter={() => setPreview(l)}
                        onFocus={() => setPreview(l)}
                        onClick={() => setPreview(l)}
                        className={`group relative flex flex-col items-center rounded-2xl border p-2 transition ${
                          isActive
                            ? "border-primary bg-primary/15 shadow-glow scale-[1.04]"
                            : "bg-card hover:bg-accent hover:-translate-y-0.5"
                        }`}
                        aria-label={`Letra ${l}`}
                      >
                        <HandGlyph letter={l} size={48} />
                        <span className={`mt-0.5 text-[11px] font-bold ${isActive ? "text-primary" : "text-foreground"}`}>
                          {l}
                        </span>
                        {isActive && (
                          <span className="absolute -top-1 right-1 h-2 w-2 rounded-full bg-primary mic-pulse" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {filtered.length === 0 && (
                  <p className="mt-4 text-center text-sm text-muted-foreground">
                    Nenhuma letra encontrada para “{query}”.
                  </p>
                )}
              </div>
            ) : (
              /* Modo Aprender */
              <div className="p-4 sm:p-5">
                <div className="grid gap-4 md:grid-cols-[auto_1fr]">
                  <div className="grid place-items-center rounded-3xl border bg-background/60 p-4">
                    <HandGlyph letter={quizLetter} size={140} />
                    <p className="mt-2 font-display text-2xl font-bold text-primary">
                      {showAnswer ? quizLetter : "?"}
                    </p>
                  </div>
                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wider text-primary">Flashcard {quizIdx + 1} / 26</p>
                      <h3 className="mt-1 font-display text-lg font-semibold">Qual letra é esta?</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {showAnswer
                          ? HINTS[quizLetter]
                          : "Observe a posição da mão e revele a resposta quando estiver pronto."}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setShowAnswer((v) => !v)}
                        className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
                      >
                        {showAnswer ? "Esconder dica" : "Revelar"}
                      </button>
                      <button
                        onClick={() => { setQuizIdx((i) => (i - 1 + 26) % 26); setShowAnswer(false); }}
                        className="rounded-full border bg-card px-3 py-2 text-sm hover:bg-accent"
                      >
                        ← Anterior
                      </button>
                      <button
                        onClick={() => { setQuizIdx((i) => (i + 1) % 26); setShowAnswer(false); }}
                        className="rounded-full border bg-card px-3 py-2 text-sm hover:bg-accent"
                      >
                        Próxima →
                      </button>
                      <button
                        onClick={() => { setQuizIdx(Math.floor(Math.random() * 26)); setShowAnswer(false); }}
                        className="rounded-full border bg-card px-3 py-2 text-sm hover:bg-accent"
                      >
                        Aleatória
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Pré-visualização ampliada */}
        {preview && !learnMode && (
          <div
            className="absolute inset-0 z-10 grid place-items-center bg-background/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setPreview(null)}
            role="dialog"
            aria-label={`Sinal da letra ${preview}`}
          >
            <div
              className="relative w-[min(92vw,360px)] rounded-3xl border bg-card p-5 shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="absolute right-3 top-3 rounded-full border bg-background p-1.5 hover:bg-accent"
                onClick={() => setPreview(null)}
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
              <div className="grid place-items-center">
                <div className="float-soft">
                  <HandGlyph letter={preview} size={200} />
                </div>
                <p className="mt-2 font-display text-4xl font-bold text-primary">{preview}</p>
                <p className="mt-3 text-center text-sm leading-relaxed text-muted-foreground">
                  {HINTS[preview]}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
