import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  GraduationCap, Trophy, Flame, BookMarked, Sparkles, ChevronRight, Check, X, Volume2,
  Medal, Crown, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { AppNav } from "@/components/AppNav";
import { AlphabetBanner } from "@/components/AlphabetBanner";
import { VLibrasPlayer } from "@/components/VLibrasPlayer";
import { SignVideo } from "@/components/SignVideo";
import { supabase } from "@/integrations/supabase/client";
import { translateToVLibras } from "@/lib/vlibras";
import { listAlfabeto, type Sinal } from "@/services/signal-library";
import {
  type GamificationState, load as loadGam, applyEvent, levelProgress, levelFromXp,
  MEDALS, syncRanking, fetchLeaderboard, save as saveGam,
} from "@/services/gamification";

export const Route = createFileRoute("/aprender")({
  head: () => ({
    meta: [
      { title: "Aprender Libras — LibrasLive AI" },
      { name: "description", content: "Aprenda Libras com gamificação: XP, níveis, sequência diária, medalhas e ranking nacional." },
      { property: "og:title", content: "Aprender Libras — LibrasLive AI" },
      { property: "og:description", content: "Alfabeto, quiz, vocabulário e ranking de Libras com avatar VLibras." },
    ],
  }),
  component: AprenderPage,
});

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

type Tab = "alfabeto" | "quiz" | "sinais" | "ranking";

function AprenderPage() {
  const [tab, setTab] = useState<Tab>("alfabeto");
  const [state, setState] = useState<GamificationState>(() => loadGam());
  useEffect(() => { setState(loadGam()); }, []);

  const award = useCallback((fonte: Parameters<typeof applyEvent>[1], extra?: Parameters<typeof applyEvent>[2]) => {
    setState((cur) => {
      const { state: next, gainedXp, newMedals } = applyEvent(cur, fonte, extra);
      if (gainedXp > 0) toast.success(`+${gainedXp} XP`, { description: fonteLabel(fonte) });
      newMedals.forEach((id) => {
        const m = MEDALS.find((x) => x.id === id);
        if (m) toast(`🏅 Medalha desbloqueada`, { description: `${m.icone} ${m.nome} — ${m.descricao}` });
      });
      return next;
    });
  }, []);

  const lp = useMemo(() => levelProgress(state.xp), [state.xp]);

  return (
    <main className="min-h-dvh">
      <AppNav />
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <GraduationCap className="h-3.5 w-3.5 text-primary" /> LibrasLive Learn
          </span>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Aprenda Libras com gamificação</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Ganhe XP, suba de nível, mantenha sua sequência diária e dispute o ranking nacional do LibrasLive.
          </p>
        </div>

        {/* Hero gamification */}
        <div className="mb-5 grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2 rounded-3xl border bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                  <Crown className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground">Nível {lp.level}</p>
                  <p className="font-display text-2xl font-bold">{state.xp.toLocaleString("pt-BR")} XP</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Próximo nível</p>
                <p className="text-sm font-semibold">{lp.current}/{lp.total} XP</p>
              </div>
            </div>
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-background/60">
              <div
                className="h-full gradient-primary transition-all"
                style={{ width: `${Math.min(100, (lp.current / Math.max(1, lp.total)) * 100)}%` }}
              />
            </div>
          </div>
          <div className="rounded-3xl border bg-card/80 p-5 shadow-card">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-orange-500/15 text-orange-500">
                <Flame className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">Sequência diária</p>
                <p className="font-display text-2xl font-bold">{state.streakAtual} dia{state.streakAtual === 1 ? "" : "s"}</p>
                <p className="text-xs text-muted-foreground">Recorde: {state.streakRecorde}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat icon={Trophy} label="Acertos" value={state.acertos} />
          <Stat icon={Zap} label="Combo" value={state.combo} />
          <Stat icon={BookMarked} label="Aprendidos" value={state.learned.length} />
          <Stat icon={Medal} label="Medalhas" value={state.medalhas.length} />
        </div>

        {/* Medals strip */}
        <MedalsStrip state={state} />

        {/* Tabs */}
        <div className="mb-5 mt-5 flex gap-2 overflow-x-auto">
          {([
            { id: "alfabeto", label: "Alfabeto" },
            { id: "quiz", label: "Quiz" },
            { id: "sinais", label: "Sinais comuns" },
            { id: "ranking", label: "Ranking" },
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
        {tab === "quiz" && <Quiz onAnswer={(ok) => award(ok ? "quiz_acerto" : "quiz_erro")} />}
        {tab === "sinais" && (
          <SignsLibrary
            learned={state.learned}
            onLearned={(slug) => award("sinal_aprendido", { slug })}
          />
        )}
        {tab === "ranking" && <Ranking state={state} setState={setState} />}
      </section>
    </main>
  );
}

function fonteLabel(f: Parameters<typeof applyEvent>[1]) {
  switch (f) {
    case "quiz_acerto": return "Resposta correta no quiz";
    case "quiz_erro": return "Tentativa registrada";
    case "sinal_aprendido": return "Novo sinal aprendido";
    case "streak_bonus": return "Bônus de sequência";
    case "primeira_aula": return "Primeira aula concluída";
  }
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

function MedalsStrip({ state }: { state: GamificationState }) {
  return (
    <div className="rounded-3xl border bg-card/70 p-4">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Medalhas</p>
        <p className="text-xs text-muted-foreground">{state.medalhas.length}/{MEDALS.length}</p>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {MEDALS.map((m) => {
          const unlocked = state.medalhas.includes(m.id);
          return (
            <div
              key={m.id}
              title={`${m.nome} — ${m.descricao}`}
              className={`min-w-[110px] rounded-2xl border px-3 py-2 text-center transition ${
                unlocked ? "border-primary/50 bg-primary/10" : "bg-background/40 opacity-50"
              }`}
            >
              <div className="text-2xl">{m.icone}</div>
              <p className="mt-1 text-[11px] font-semibold leading-tight">{m.nome}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{m.descricao}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface QuizQuestion { correct: Sinal; options: string[] }

function buildQuestion(pool: Sinal[], previousId?: string): QuizQuestion | null {
  if (pool.length < 4) return null;
  const candidates = pool.length > 4 && previousId
    ? pool.filter((s) => s.id !== previousId)
    : pool;
  const correct = candidates[Math.floor(Math.random() * candidates.length)];
  const distractors = shuffle(pool.filter((s) => s.id !== correct.id)).slice(0, 3);
  const options = shuffle([correct.palavra, ...distractors.map((d) => d.palavra)]);
  return { correct, options };
}

function Quiz({ onAnswer }: { onAnswer: (ok: boolean) => void }) {
  const { data: alfabeto, isLoading } = useQuery({
    queryKey: ["alfabeto"],
    queryFn: listAlfabeto,
    staleTime: 5 * 60_000,
  });

  const pool = useMemo(() => alfabeto ?? [], [alfabeto]);
  const [q, setQ] = useState<QuizQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    if (pool.length >= 4 && !q) setQ(buildQuestion(pool));
  }, [pool, q]);

  const next = () => { setQ(buildQuestion(pool, q?.correct.id)); setPicked(null); };

  if (isLoading || !q) {
    return (
      <div className="rounded-3xl border bg-card/80 p-6 shadow-card">
        <div className="h-6 w-40 animate-pulse rounded bg-muted" />
        <div className="mt-4 aspect-video w-full animate-pulse rounded-2xl bg-muted" />
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const answered = picked !== null;
  const isCorrect = answered && picked === q.correct.palavra;

  return (
    <div className="rounded-3xl border bg-card/80 p-6 shadow-card">
      <p className="text-xs font-medium uppercase tracking-wider text-primary">Quiz do alfabeto</p>
      <h2 className="mt-1 font-display text-xl font-semibold">Qual é esta letra?</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Observe o sinal em Libras e escolha a letra correspondente. A resposta só aparece após sua tentativa.
      </p>

      <div className="mt-5">
        <SignVideo
          palavra={q.correct.palavra}
          videoUrl={q.correct.video_url}
          imagemUrl={q.correct.imagem_url}
          descricao={q.correct.descricao}
          hideCaption={!answered}
          hideDescription={!answered}
          ariaLabel="Sinal a ser identificado"
          fallback={<QuizHandFallback letter={q.correct.palavra} />}
        />
      </div>

      <div role="radiogroup" aria-label="Alternativas" className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {q.options.map((opt) => {
          const isPicked = picked === opt;
          const correctOpt = answered && opt === q.correct.palavra;
          const wrongOpt = answered && isPicked && opt !== q.correct.palavra;
          return (
            <button
              key={opt}
              role="radio"
              aria-checked={isPicked}
              disabled={answered}
              onClick={() => { setPicked(opt); onAnswer(opt === q.correct.palavra); }}
              className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-lg font-bold transition ${
                correctOpt ? "border-primary bg-primary/15 text-primary"
                : wrongOpt ? "border-destructive bg-destructive/10 text-destructive"
                : "bg-card hover:bg-accent"
              }`}
            >
              {opt}
              {correctOpt && <Check className="h-4 w-4" aria-hidden />}
              {wrongOpt && <X className="h-4 w-4" aria-hidden />}
            </button>
          );
        })}
      </div>

      {answered && (
        <div
          role="status"
          aria-live="polite"
          className={`mt-5 flex flex-wrap items-center justify-between gap-2 rounded-2xl border p-3 ${
            isCorrect ? "border-primary/40 bg-primary/10" : "border-destructive/40 bg-destructive/10"
          }`}
        >
          <p className="text-sm">
            {isCorrect ? (
              <span className="font-medium text-primary">✓ Correto! É a letra {q.correct.palavra}.</span>
            ) : (
              <span className="font-medium text-destructive">✗ Você marcou {picked}. A letra correta era {q.correct.palavra}.</span>
            )}
            {q.correct.descricao && (
              <span className="ml-2 block text-xs text-muted-foreground sm:inline">{q.correct.descricao}</span>
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

function QuizHandFallback({ letter }: { letter: string }) {
  // Fallback neutro — NÃO revela a letra antes da resposta.
  return (
    <div className="text-center">
      <div className="mx-auto grid h-24 w-24 place-items-center rounded-full gradient-primary shadow-glow">
        <span className="font-display text-3xl font-bold text-primary-foreground">?</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        Vídeo do sinal indisponível — toque para visualizar no avatar VLibras.
      </p>
      <button
        type="button"
        onClick={() => translateToVLibras(letter)}
        className="mt-2 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent"
      >
        <Volume2 className="h-3.5 w-3.5 text-primary" /> Reproduzir no VLibras
      </button>
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
                  <Check className="h-3.5 w-3.5" /> Marcar como aprendido (+15 XP)
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

function Ranking({ state, setState }: { state: GamificationState; setState: React.Dispatch<React.SetStateAction<GamificationState>> }) {
  const [nick, setNick] = useState(state.apelido ?? "");
  const [syncing, setSyncing] = useState(false);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["ranking_publico"],
    queryFn: () => fetchLeaderboard(50),
    refetchOnWindowFocus: false,
  });

  const handleSync = async () => {
    const trimmed = nick.trim();
    if (!/^[A-Za-z0-9_-]{3,20}$/.test(trimmed)) {
      toast.error("Apelido inválido", { description: "Use 3 a 20 caracteres: letras, números, _ ou -." });
      return;
    }
    setSyncing(true);
    try {
      const next = { ...state, apelido: trimmed, rankingSynced: true };
      saveGam(next);
      setState(next);
      await syncRanking(next);
      toast.success("Pontuação enviada ao ranking nacional!");
      refetch();
    } catch (e) {
      toast.error("Não foi possível enviar", { description: e instanceof Error ? e.message : String(e) });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="grid gap-5 md:grid-cols-5">
      <div className="md:col-span-2">
        <div className="rounded-3xl border bg-card/80 p-5 shadow-card">
          <p className="text-xs font-medium uppercase tracking-wider text-primary">Sua participação</p>
          <h3 className="mt-1 font-display text-xl font-bold">Entrar no ranking</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha um apelido público para registrar seu XP no ranking nacional do LibrasLive.
          </p>
          <div className="mt-4 space-y-2">
            <input
              value={nick}
              onChange={(e) => setNick(e.target.value)}
              placeholder="seu_apelido"
              maxLength={20}
              className="w-full rounded-full border bg-background/60 px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              onClick={handleSync}
              disabled={syncing}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow disabled:opacity-60"
            >
              {syncing ? "Enviando…" : state.apelido ? "Atualizar pontuação" : "Entrar no ranking"}
            </button>
          </div>
          <div className="mt-4 rounded-2xl border bg-background/40 p-3 text-xs text-muted-foreground">
            <p>XP atual: <span className="font-semibold text-foreground">{state.xp}</span></p>
            <p>Nível: <span className="font-semibold text-foreground">{levelFromXp(state.xp)}</span></p>
            <p>Medalhas: <span className="font-semibold text-foreground">{state.medalhas.length}</span></p>
          </div>
        </div>
      </div>

      <div className="md:col-span-3">
        <div className="rounded-3xl border bg-card/80 p-5 shadow-card">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold">Top do Brasil</h3>
            <button onClick={() => refetch()} className="text-xs text-muted-foreground hover:text-foreground">Atualizar</button>
          </div>
          {isLoading && <p className="text-sm text-muted-foreground">Carregando…</p>}
          {!isLoading && (data ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">Ainda sem registros — seja o primeiro!</p>
          )}
          <ol className="space-y-2">
            {(data ?? []).map((row, i) => {
              const isMe = row.apelido === state.apelido;
              return (
                <li
                  key={row.apelido}
                  className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2 text-sm ${
                    isMe ? "border-primary bg-primary/10" : "bg-background/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid h-8 w-8 place-items-center rounded-full bg-card font-bold">
                      {i + 1}
                    </span>
                    <div>
                      <p className="font-semibold">{row.apelido} {isMe && <span className="text-xs text-primary">(você)</span>}</p>
                      <p className="text-xs text-muted-foreground">Nível {row.nivel} · 🔥 {row.streak_recorde} · 🏅 {row.medalhas}</p>
                    </div>
                  </div>
                  <span className="font-display text-lg font-bold">{row.xp}<span className="ml-1 text-xs text-muted-foreground">XP</span></span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </div>
  );
}
