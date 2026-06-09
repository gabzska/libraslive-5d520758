import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Trophy, Flame, BookMarked, Sparkles, ChevronRight, Check, X, Volume2,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { AlphabetBanner } from "@/components/AlphabetBanner";
import { VLibrasPlayer } from "@/components/VLibrasPlayer";
import { supabase } from "@/integrations/supabase/client";
import { translateToVLibras } from "@/lib/vlibras";

export const Route = createFileRoute("/aprender")({
  head: () => ({
    meta: [
      { title: "Aprender Libras — LibrasLive AI" },
      { name: "description", content: "Estude o alfabeto manual, faça quiz interativo e explore o vocabulário de Libras com avatar sinalizando cada palavra." },
      { property: "og:title", content: "Aprender Libras — LibrasLive AI" },
      { property: "og:description", content: "Alfabeto, quiz e vocabulário de Libras com avatar VLibras." },
    ],
  }),
  component: AprenderPage,
});

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const STORAGE_KEY = "libraslive_progress_v1";

interface Progress { acertos: number; erros: number; streak: number; learned: string[]; quizzes: number }

function loadProgress(): Progress {
  if (typeof window === "undefined") return { acertos: 0, erros: 0, streak: 0, learned: [], quizzes: 0 };
  try {
    return { acertos: 0, erros: 0, streak: 0, learned: [], quizzes: 0, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") };
  } catch {
    return { acertos: 0, erros: 0, streak: 0, learned: [], quizzes: 0 };
  }
}
function saveProgress(p: Progress) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch { /* ignore */ }
}

type Tab = "alfabeto" | "quiz" | "sinais";

function AprenderPage() {
  const [tab, setTab] = useState<Tab>("alfabeto");
  const [progress, setProgress] = useState<Progress>({ acertos: 0, erros: 0, streak: 0, learned: [], quizzes: 0 });
  useEffect(() => { setProgress(loadProgress()); }, []);
  const update = (p: Partial<Progress>) => {
    setProgress((cur) => {
      const next = { ...cur, ...p };
      saveProgress(next);
      return next;
    });
  };
  const level = Math.floor(progress.acertos / 20) + 1;

  return (
    <main className="min-h-dvh">
      <AppNav />
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" /> Modo Educação
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Aprenda Libras no seu ritmo</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Treine o alfabeto manual, faça quizzes e explore o vocabulário com o avatar sinalizando cada palavra.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Trophy} label="Acertos" value={progress.acertos} />
          <Stat icon={Flame} label="Sequência" value={progress.streak} />
          <Stat icon={BookMarked} label="Aprendidos" value={progress.learned.length} />
          <Stat icon={Sparkles} label="Nível" value={level} />
        </div>

        {/* Tabs */}
        <div className="mb-5 flex gap-2 overflow-x-auto">
          {([
            { id: "alfabeto", label: "Alfabeto" },
            { id: "quiz", label: "Quiz" },
            { id: "sinais", label: "Sinais comuns" },
          ] as { id: Tab; label: string }[]).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${
                tab === t.id ? "bg-primary text-primary-foreground shadow-glow" : "border bg-card/60 text-muted-foreground hover:bg-accent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "alfabeto" && <AlphabetBanner />}
        {tab === "quiz" && <Quiz onAnswer={(ok) => update({
          acertos: progress.acertos + (ok ? 1 : 0),
          erros: progress.erros + (ok ? 0 : 1),
          streak: ok ? progress.streak + 1 : 0,
          quizzes: progress.quizzes + 1,
        })} />}
        {tab === "sinais" && <SignsLibrary
          learned={progress.learned}
          onLearned={(slug) => {
            if (progress.learned.includes(slug)) return;
            update({ learned: [...progress.learned, slug] });
          }}
        />}
      </section>
    </main>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card/70 p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-display text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function pickQuestion() {
  const correct = LETTERS[Math.floor(Math.random() * LETTERS.length)];
  const pool = LETTERS.filter((l) => l !== correct);
  const opts = [correct];
  while (opts.length < 4) {
    const p = pool[Math.floor(Math.random() * pool.length)];
    if (!opts.includes(p)) opts.push(p);
  }
  return { correct, options: opts.sort(() => Math.random() - 0.5) };
}

function Quiz({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const [q, setQ] = useState(pickQuestion);
  const [picked, setPicked] = useState<string | null>(null);
  const next = () => { setQ(pickQuestion()); setPicked(null); };

  // import HandGlyph from AlphabetBanner is internal; render simple letter card
  return (
    <div className="rounded-3xl border bg-card/80 p-6 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Quiz do alfabeto</p>
      <h2 className="mt-1 font-display text-xl font-semibold">Qual letra a mão está representando?</h2>

      <div className="mt-5 grid place-items-center rounded-2xl border bg-background/60 p-6">
        <LetterGlyph letter={q.correct} />
        <p className="mt-2 text-xs text-muted-foreground">Observe a configuração e escolha abaixo.</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.options.map((opt) => {
          const isPicked = picked === opt;
          const correct = picked && opt === q.correct;
          const wrong = picked && isPicked && opt !== q.correct;
          return (
            <button
              key={opt}
              disabled={!!picked}
              onClick={() => {
                setPicked(opt);
                onAnswer(opt === q.correct);
              }}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-lg font-bold transition ${
                correct ? "border-primary bg-primary/15 text-primary"
                : wrong ? "border-destructive bg-destructive/10 text-destructive"
                : "bg-card hover:bg-accent"
              }`}
            >
              {opt}
              {correct && <Check className="h-4 w-4" />}
              {wrong && <X className="h-4 w-4" />}
            </button>
          );
        })}
      </div>

      {picked && (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm">
            {picked === q.correct ? (
              <span className="text-primary">Correto! É a letra {q.correct}.</span>
            ) : (
              <span className="text-destructive">A letra correta era {q.correct}.</span>
            )}
          </p>
          <button
            onClick={next}
            className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
          >
            Próxima <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function LetterGlyph({ letter }: { letter: string }) {
  // Reuses AlphabetBanner styling via preview link; simple display fallback
  return (
    <div className="grid h-40 w-40 place-items-center rounded-full bg-primary/10 text-primary">
      <span className="font-display text-7xl font-bold">{letter}</span>
    </div>
  );
}

interface SignRow {
  id: string; palavra: string; slug: string; descricao: string | null;
  sinonimos: string[] | null; categoria_id: string | null;
}
interface CatRow { id: string; slug: string; nome: string; ordem: number }

function SignsLibrary({ learned, onLearned }: { learned: string[]; onLearned: (slug: string) => void }) {
  const [catId, setCatId] = useState<string | "todas">("todas");
  const [selected, setSelected] = useState<SignRow | null>(null);
  const [search, setSearch] = useState("");

  const { data: cats } = useQuery({
    queryKey: ["categorias"],
    queryFn: async () => {
      const { data } = await supabase.from("categorias").select("id,slug,nome,ordem").order("ordem");
      return (data ?? []) as CatRow[];
    },
  });

  const { data: signs, isLoading } = useQuery({
    queryKey: ["sinais", catId, search],
    queryFn: async () => {
      let q = supabase.from("sinais").select("id,palavra,slug,descricao,sinonimos,categoria_id").eq("aprovado", true).order("palavra").limit(500);
      if (catId !== "todas") q = q.eq("categoria_id", catId);
      if (search.trim()) q = q.ilike("palavra", `%${search.trim()}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data as SignRow[];
    },
  });

  const playerText = selected?.palavra ?? "";

  const grid = useMemo(() => signs ?? [], [signs]);

  return (
    <div className="grid gap-5 md:grid-cols-5">
      <div className="md:col-span-3">
        <div className="rounded-3xl border bg-card/80 p-5 shadow-card">
          <div className="flex flex-wrap items-center gap-2">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar sinal..."
              className="flex-1 min-w-[180px] rounded-full border bg-background/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <select
              value={catId}
              onChange={(e) => setCatId(e.target.value as string)}
              className="rounded-full border bg-background/60 px-4 py-2 text-sm"
            >
              <option value="todas">Todas as categorias</option>
              {cats?.map((c) => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {isLoading && <p className="col-span-full text-sm text-muted-foreground">Carregando…</p>}
            {!isLoading && grid.length === 0 && <p className="col-span-full text-sm text-muted-foreground">Nenhum sinal encontrado.</p>}
            {grid.map((s) => {
              const isLearned = learned.includes(s.slug);
              const isSel = selected?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => { setSelected(s); translateToVLibras(s.palavra); }}
                  className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-3 text-left text-sm transition ${
                    isSel ? "border-primary bg-primary/10" : "bg-card hover:bg-accent"
                  }`}
                >
                  <span className="font-medium">{s.palavra}</span>
                  {isLearned && <Check className="h-4 w-4 text-primary" />}
                </button>
              );
            })}
          </div>
        </div>

        {selected && (
          <div className="mt-5 rounded-3xl border bg-card/80 p-5 shadow-card">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Detalhes</p>
                <h3 className="font-display text-2xl font-bold">{selected.palavra}</h3>
                {selected.descricao && <p className="mt-1 text-sm text-muted-foreground">{selected.descricao}</p>}
                {selected.sinonimos && selected.sinonimos.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Sinônimos: <span className="text-foreground">{selected.sinonimos.join(", ")}</span>
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => translateToVLibras(selected.palavra)}
                  className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent"
                >
                  <Volume2 className="h-3.5 w-3.5 text-primary" /> Sinalizar
                </button>
                <button
                  onClick={() => onLearned(selected.slug)}
                  className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-3 py-1.5 text-xs font-medium text-primary-foreground shadow-glow"
                >
                  <Check className="h-3.5 w-3.5" /> Marcar como aprendido
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <VLibrasPlayer text={playerText} hint="Clique em um sinal para ver o avatar VLibras executando." />
      </div>
    </div>
  );
}
