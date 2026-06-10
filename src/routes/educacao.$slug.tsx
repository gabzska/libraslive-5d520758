import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, BookOpen, Share2, Check, Volume2 } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { VLibrasPlayer } from "@/components/VLibrasPlayer";
import { getAulaBySlug, type Aula } from "@/services/education";

export const Route = createFileRoute("/educacao/$slug")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Aula acessível — LibrasLive" },
      { name: "description", content: "Conteúdo didático traduzido para Libras com avatar VLibras." },
    ],
  }),
  errorComponent: ({ error }) => (
    <main className="min-h-dvh">
      <AppNav />
      <div className="mx-auto max-w-2xl px-5 py-10 text-center">
        <h1 className="text-2xl font-bold">Aula indisponível</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <Link to="/educacao" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar ao catálogo</Link>
      </div>
    </main>
  ),
  notFoundComponent: () => (
    <main className="min-h-dvh">
      <AppNav />
      <div className="mx-auto max-w-2xl px-5 py-10 text-center">
        <h1 className="text-2xl font-bold">Aula não encontrada</h1>
        <Link to="/educacao" className="mt-4 inline-block text-sm text-primary hover:underline">← Voltar ao catálogo</Link>
      </div>
    </main>
  ),
  component: AulaPage,
});

function AulaPage() {
  const { slug } = Route.useParams();
  const [aula, setAula] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [trecho, setTrecho] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const a = await getAulaBySlug(slug);
        if (!mounted) return;
        if (!a) throw notFound();
        setAula(a);
        setTrecho(a.texto_pt.slice(0, 400));
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [slug]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  if (loading) {
    return (
      <main className="min-h-dvh">
        <AppNav />
        <div className="mx-auto max-w-3xl px-5 py-10 text-sm text-muted-foreground">Carregando aula…</div>
      </main>
    );
  }
  if (!aula) return null;

  // Partir o texto em parágrafos para sinalização incremental
  const paragrafos = aula.texto_pt
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean);

  return (
    <main className="min-h-dvh">
      <VLibrasWidget />
      <AppNav />

      <section className="mx-auto max-w-6xl px-5 pt-6 pb-10">
        <Link to="/educacao" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-3.5 w-3.5" /> Catálogo
        </Link>
        <div className="mt-3 flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary">
          <BookOpen className="h-3.5 w-3.5" />
          {aula.disciplina || "Geral"} {aula.nivel ? `· ${aula.nivel}` : ""}
        </div>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{aula.titulo}</h1>
          <button onClick={copyLink}
            className="inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent">
            {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Share2 className="h-3.5 w-3.5" />}
            {copied ? "Link copiado" : "Compartilhar"}
          </button>
        </div>
        {aula.descricao && <p className="mt-2 text-sm text-muted-foreground">{aula.descricao}</p>}
        <p className="mt-1 text-xs text-muted-foreground">{aula.autor_nome || "Anônimo"} · {new Date(aula.created_at).toLocaleDateString("pt-BR")}</p>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 pb-16 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur">
            <p className="text-xs font-medium uppercase tracking-wider text-primary">Conteúdo</p>
            <h2 className="mt-1 font-display text-lg font-semibold">Toque num parágrafo para sinalizar</h2>
            <div className="mt-4 space-y-2">
              {paragrafos.map((p, i) => {
                const ativo = trecho === p;
                return (
                  <button key={i} onClick={() => setTrecho(p)}
                    className={`group flex w-full items-start gap-3 rounded-2xl border bg-background/60 p-4 text-left transition hover:border-primary/40 ${ativo ? "border-primary/60 bg-primary/5" : ""}`}>
                    <Volume2 className={`mt-0.5 h-4 w-4 flex-none ${ativo ? "text-primary" : "text-muted-foreground"}`} />
                    <p className="text-sm leading-relaxed">{p}</p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="sticky top-24">
            <VLibrasPlayer text={trecho} hint="O avatar VLibras sinaliza o parágrafo selecionado." />
          </div>
        </div>
      </section>
    </main>
  );
}
