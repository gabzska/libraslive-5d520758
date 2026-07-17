import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Mic, MicOff, Send, Sparkles, Trash2, BookOpenText, Wand2, Check, Loader2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { VLibrasPlayer } from "@/components/VLibrasPlayer";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";
import { translateToGlosses, submitCorrection } from "@/lib/libras.functions";

export const Route = createFileRoute("/traduzir")({
  head: () => ({
    meta: [
      { title: "Traduzir Português para Libras — LibrasLive AI" },
      { name: "description", content: "Digite ou fale em português e veja a tradução automática para Libras com avatar VLibras e soletração do alfabeto manual quando necessário." },
      { property: "og:title", content: "Traduzir Português para Libras — LibrasLive AI" },
      { property: "og:description", content: "Tradução automática Português → Libras com avatar VLibras." },
    ],
  }),
  component: TraduzirPage,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface SignRow { palavra: string; slug: string; sinonimos: string[] | null }

function TraduzirPage() {
  const [text, setText] = useState("");
  const [history, setHistory] = useState<{ id: string; text: string; at: number }[]>([]);
  const [aiResult, setAiResult] = useState<{ glosses: string[]; intent: string; notes?: string; confidence: number } | null>(null);
  const [translating, setTranslating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [editingCorrection, setEditingCorrection] = useState(false);
  const [correctionText, setCorrectionText] = useState("");
  const [correctionStatus, setCorrectionStatus] = useState<"idle" | "saving" | "saved">("idle");

  const translateFn = useServerFn(translateToGlosses);
  const correctionFn = useServerFn(submitCorrection);

  const { listening, interim, finalText, supported, start, stop } = useSpeechRecognition({
    lang: "pt-BR",
    onFinal: (t) => setText((cur) => (cur ? cur + " " + t : t)),
  });

  const { data: signs } = useQuery({
    queryKey: ["signs-vocab"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sinais")
        .select("palavra,slug,sinonimos")
        .eq("aprovado", true)
        .limit(2000);
      if (error) throw error;
      return data as SignRow[];
    },
  });

  const vocab = useMemo(() => {
    const m = new Map<string, SignRow>();
    (signs ?? []).forEach((s) => {
      m.set(s.slug, s);
      m.set(slugify(s.palavra), s);
      (s.sinonimos ?? []).forEach((syn) => m.set(slugify(syn), s));
    });
    return m;
  }, [signs]);

  const tokens = useMemo(() => {
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.map((w) => {
      const key = slugify(w);
      const match = vocab.get(key);
      return { word: w, match, spell: !match && /^[a-zA-ZÀ-ÿ]+$/.test(w) };
    });
  }, [text, vocab]);

  useEffect(() => {
    if (interim) setText((cur) => cur); // keep textarea, interim shown separately
  }, [interim]);

  const submit = async () => {
    const clean = text.trim();
    if (!clean) return;
    setTranslating(true);
    setAiError(null);
    setAiResult(null);
    setEditingCorrection(false);
    setCorrectionStatus("idle");
    setHistory((h) => [{ id: crypto.randomUUID(), text: clean, at: Date.now() }, ...h].slice(0, 20));
    try {
      const out = await translateFn({ data: { text: clean } });
      setAiResult(out);
      setCorrectionText(out.glosses.join(" "));
      try {
        await supabase.from("historico_traducao").insert({
          direcao: "pt_libras",
          entrada: clean,
          saida: out.glosses.join(" "),
          confianca: out.confidence,
          contexto: { intent: out.intent, notes: out.notes, tokens: tokens.map((t) => ({ w: t.word, spell: !!t.spell })) },
        });
      } catch { /* ignore */ }
    } catch (e) {
      setAiError(e instanceof Error ? e.message : "Falha na tradução");
    } finally {
      setTranslating(false);
    }
  };

  const saveCorrection = async () => {
    if (!aiResult || !correctionText.trim()) return;
    setCorrectionStatus("saving");
    try {
      await correctionFn({
        data: {
          direcao: "pt_libras",
          entrada: text.trim(),
          saida_original: aiResult.glosses.join(" "),
          saida_corrigida: correctionText.trim().toUpperCase(),
          contexto: { intent: aiResult.intent },
        },
      });
      setCorrectionStatus("saved");
      setEditingCorrection(false);
      // Reflete correção localmente
      setAiResult({ ...aiResult, glosses: correctionText.trim().toUpperCase().split(/\s+/) });
    } catch {
      setCorrectionStatus("idle");
    }
  };

  return (
    <main className="min-h-dvh">
      <AppNav />
      <section className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Português → Libras
          </span>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">Digite ou fale, o avatar sinaliza</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Use o microfone ou escreva a frase. Palavras que não têm sinal próprio são soletradas pelo alfabeto manual automaticamente.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="rounded-3xl border bg-card/80 p-5 shadow-card backdrop-blur">
              <label htmlFor="frase" className="text-xs font-medium uppercase tracking-wider text-primary">Frase em português</label>
              <textarea
                id="frase"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Ex.: Olá, eu me chamo Maria e quero estudar medicina."
                className="mt-2 w-full resize-none rounded-2xl border bg-background/60 p-4 text-base outline-none focus:ring-2 focus:ring-ring"
                rows={4}
              />
              {interim && <p className="mt-2 text-xs italic text-muted-foreground">{interim}</p>}

              <div className="mt-4 flex flex-wrap gap-2">
                {!listening ? (
                  <button
                    onClick={start}
                    disabled={!supported}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4 text-primary" /> Ditar
                  </button>
                ) : (
                  <button
                    onClick={stop}
                    className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground"
                  >
                    <MicOff className="h-4 w-4" /> Parar ditado
                  </button>
                )}
                <button
                  onClick={submit}
                  disabled={!text.trim()}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Traduzir e salvar
                </button>
                <button
                  onClick={() => setText("")}
                  disabled={!text}
                  className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" /> Limpar
                </button>
              </div>

              {tokens.length > 0 && (
                <div className="mt-5 rounded-2xl border bg-background/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                    <BookOpenText className="h-3.5 w-3.5" /> Tokens reconhecidos
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {tokens.map((t, i) => (
                      <span
                        key={i}
                        className={
                          t.match
                            ? "rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary"
                            : t.spell
                              ? "rounded-full border border-dashed border-primary/40 px-2.5 py-1 text-xs text-muted-foreground"
                              : "rounded-full bg-muted px-2.5 py-1 text-xs text-muted-foreground"
                        }
                        title={t.match ? "Sinal próprio" : t.spell ? "Será soletrada" : "Palavra sem sinal"}
                      >
                        {t.word}
                        {t.spell && <span className="ml-1 text-[10px] uppercase">soletrar</span>}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {(translating || aiResult || aiError) && (
                <div className="mt-5 rounded-2xl border bg-background/50 p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-primary">
                    <Wand2 className="h-3.5 w-3.5" /> Tradução contextual em Libras
                  </p>
                  {translating && (
                    <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" /> Analisando frase e consultando dicionário…
                    </p>
                  )}
                  {aiError && !translating && (
                    <p className="mt-2 text-sm text-destructive">{aiError}</p>
                  )}
                  {aiResult && !translating && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {aiResult.glosses.map((g, i) => (
                          <span key={i} className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-semibold tracking-wider text-primary">
                            {g}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        <span>Intenção: <span className="text-foreground">{aiResult.intent}</span></span>
                        <span>Confiança: <span className={aiResult.confidence >= 0.8 ? "text-emerald-500" : aiResult.confidence >= 0.5 ? "text-amber-500" : "text-destructive"}>{Math.round(aiResult.confidence * 100)}%</span></span>
                        {aiResult.notes && <span className="w-full italic">{aiResult.notes}</span>}
                      </div>

                      {!editingCorrection ? (
                        <button
                          onClick={() => { setEditingCorrection(true); setCorrectionStatus("idle"); }}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Não ficou certo? Ensinar a Lia →
                        </button>
                      ) : (
                        <div className="rounded-xl border bg-card p-3">
                          <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                            Glosas corrigidas (separadas por espaço)
                          </label>
                          <input
                            value={correctionText}
                            onChange={(e) => setCorrectionText(e.target.value)}
                            className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                            placeholder="EU QUERER ÁGUA POR-FAVOR"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={saveCorrection}
                              disabled={correctionStatus === "saving" || !correctionText.trim()}
                              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground disabled:opacity-50"
                            >
                              {correctionStatus === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                              Salvar correção
                            </button>
                            <button
                              onClick={() => setEditingCorrection(false)}
                              className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                      {correctionStatus === "saved" && (
                        <p className="text-xs text-emerald-500">✓ Obrigado! A Lia vai aprender com sua correção.</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {finalText && (
                <p className="mt-3 text-xs text-muted-foreground">Última fala reconhecida: "{finalText}"</p>
              )}
            </div>

            {history.length > 0 && (
              <div className="mt-5 rounded-3xl border bg-card/70 p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Últimas traduções</p>
                  <button onClick={() => setHistory([])} className="text-xs text-muted-foreground hover:text-foreground">Limpar</button>
                </div>
                <ul className="mt-3 space-y-2">
                  {history.map((h) => (
                    <li key={h.id}>
                      <button
                        onClick={() => setText(h.text)}
                        className="w-full rounded-2xl border bg-background/60 p-3 text-left text-sm hover:bg-accent"
                      >
                        {h.text}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <VLibrasPlayer text={text} hint="O avatar oficial do VLibras fica embutido neste painel e sinaliza a frase digitada automaticamente." />
          </div>
        </div>
      </section>
    </main>
  );
}
