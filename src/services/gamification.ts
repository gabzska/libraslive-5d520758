/**
 * Gamification Service
 * XP, níveis, sequência diária, medalhas e ranking global.
 * Persistência local (anônimo) + sincronização opcional com ranking_publico.
 */
import { supabase } from "@/integrations/supabase/client";

export const STORAGE_KEY = "libraslive_gamification_v1";

export interface XpEvent {
  fonte: "quiz_acerto" | "quiz_erro" | "sinal_aprendido" | "streak_bonus" | "primeira_aula";
  xp: number;
  at: number;
}

export interface GamificationState {
  xp: number;
  acertos: number;
  erros: number;
  quizzes: number;
  learned: string[];
  streakAtual: number;
  streakRecorde: number;
  lastActiveDate: string | null; // YYYY-MM-DD
  combo: number; // sequência de acertos consecutivos no quiz
  medalhas: string[];
  eventos: XpEvent[];
  apelido: string | null;
  rankingSynced: boolean;
}

export const INITIAL: GamificationState = {
  xp: 0,
  acertos: 0,
  erros: 0,
  quizzes: 0,
  learned: [],
  streakAtual: 0,
  streakRecorde: 0,
  lastActiveDate: null,
  combo: 0,
  medalhas: [],
  eventos: [],
  apelido: null,
  rankingSynced: false,
};

export const MEDALS: { id: string; nome: string; descricao: string; icone: string; check: (s: GamificationState) => boolean }[] = [
  { id: "primeiro_passo", nome: "Primeiro Passo", descricao: "Responda seu primeiro quiz", icone: "✨", check: (s) => s.quizzes >= 1 },
  { id: "estudante", nome: "Estudante", descricao: "10 acertos no quiz", icone: "📘", check: (s) => s.acertos >= 10 },
  { id: "dedicado", nome: "Dedicado", descricao: "25 acertos no quiz", icone: "🎯", check: (s) => s.acertos >= 25 },
  { id: "mestre_alfabeto", nome: "Mestre do Alfabeto", descricao: "50 acertos no quiz", icone: "🏆", check: (s) => s.acertos >= 50 },
  { id: "centena", nome: "Centena", descricao: "100 acertos no quiz", icone: "💯", check: (s) => s.acertos >= 100 },
  { id: "colecionador", nome: "Colecionador", descricao: "10 sinais aprendidos", icone: "📚", check: (s) => s.learned.length >= 10 },
  { id: "biblioteca", nome: "Biblioteca Viva", descricao: "30 sinais aprendidos", icone: "🗂️", check: (s) => s.learned.length >= 30 },
  { id: "constante", nome: "Constante", descricao: "Sequência de 3 dias", icone: "🔥", check: (s) => s.streakRecorde >= 3 },
  { id: "semana", nome: "Semana Cheia", descricao: "Sequência de 7 dias", icone: "🌟", check: (s) => s.streakRecorde >= 7 },
  { id: "combo5", nome: "Combo x5", descricao: "5 acertos seguidos no quiz", icone: "⚡", check: (s) => s.combo >= 5 },
];

// Nível: XP necessário cresce quadraticamente: nível n → 50 * n^2
export function xpForLevel(level: number) { return 50 * level * level; }
export function levelFromXp(xp: number) {
  let lvl = 1;
  while (xp >= xpForLevel(lvl + 1)) lvl++;
  return lvl;
}
export function levelProgress(xp: number) {
  const lvl = levelFromXp(xp);
  const cur = xpForLevel(lvl);
  const next = xpForLevel(lvl + 1);
  return { level: lvl, current: xp - cur, total: next - cur, next };
}

export function load(): GamificationState {
  if (typeof window === "undefined") return { ...INITIAL };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...INITIAL };
    return { ...INITIAL, ...JSON.parse(raw) };
  } catch { return { ...INITIAL }; }
}
export function save(s: GamificationState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

function today() { return new Date().toISOString().slice(0, 10); }
function daysBetween(a: string, b: string) {
  const da = new Date(a + "T00:00:00Z").getTime();
  const db = new Date(b + "T00:00:00Z").getTime();
  return Math.round((db - da) / 86400000);
}

function applyDailyStreak(s: GamificationState): GamificationState {
  const t = today();
  if (s.lastActiveDate === t) return s;
  let streakAtual = 1;
  if (s.lastActiveDate) {
    const diff = daysBetween(s.lastActiveDate, t);
    if (diff === 1) streakAtual = s.streakAtual + 1;
    else if (diff === 0) streakAtual = s.streakAtual;
    else streakAtual = 1;
  }
  return {
    ...s,
    streakAtual,
    streakRecorde: Math.max(s.streakRecorde, streakAtual),
    lastActiveDate: t,
  };
}

function recomputeMedals(s: GamificationState): GamificationState {
  const medalhas = MEDALS.filter((m) => m.check(s)).map((m) => m.id);
  return { ...s, medalhas };
}

export interface ApplyResult { state: GamificationState; gainedXp: number; newMedals: string[] }

export function applyEvent(prev: GamificationState, fonte: XpEvent["fonte"], extra?: { slug?: string; correct?: boolean }): ApplyResult {
  let s = applyDailyStreak(prev);
  let gained = 0;
  switch (fonte) {
    case "quiz_acerto": {
      const combo = s.combo + 1;
      gained = 10 + Math.min(combo, 10); // bônus por combo, até +10
      s = { ...s, acertos: s.acertos + 1, quizzes: s.quizzes + 1, combo };
      if (combo > 0 && combo % 5 === 0) gained += 25; // bônus a cada 5 seguidos
      break;
    }
    case "quiz_erro":
      gained = 2;
      s = { ...s, erros: s.erros + 1, quizzes: s.quizzes + 1, combo: 0 };
      break;
    case "sinal_aprendido": {
      const slug = extra?.slug;
      if (!slug || s.learned.includes(slug)) return { state: s, gainedXp: 0, newMedals: [] };
      gained = 15;
      s = { ...s, learned: [...s.learned, slug] };
      break;
    }
    case "streak_bonus":
      gained = 30;
      break;
    case "primeira_aula":
      gained = 5;
      break;
  }
  const beforeMedals = new Set(s.medalhas);
  s = { ...s, xp: s.xp + gained, eventos: [...s.eventos.slice(-49), { fonte, xp: gained, at: Date.now() }] };
  s = recomputeMedals(s);
  const newMedals = s.medalhas.filter((m) => !beforeMedals.has(m));
  save(s);
  return { state: s, gainedXp: gained, newMedals };
}

export async function syncRanking(s: GamificationState): Promise<void> {
  if (!s.apelido) return;
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  // Ranking exige conta: sem sessão, mantemos apenas o progresso local.
  if (!userId) return;
  const payload = {
    user_id: userId,
    apelido: s.apelido,
    xp: s.xp,
    nivel: levelFromXp(s.xp),
    streak_atual: s.streakAtual,
    streak_recorde: s.streakRecorde,
    medalhas: s.medalhas.length,
  };
  const { error } = await supabase
    .from("ranking_publico")
    .upsert(payload as never, { onConflict: "user_id" });
  if (error) throw error;
}

export async function fetchLeaderboard(limit = 20) {
  const { data, error } = await supabase
    .from("ranking_publico")
    .select("apelido,xp,nivel,streak_atual,streak_recorde,medalhas")
    .order("xp", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
