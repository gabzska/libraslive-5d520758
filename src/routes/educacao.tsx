import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { BookOpen, Plus, Search, GraduationCap, Loader2, Share2, Check } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { createAula, listAulas, type Aula } from "@/services/education";

export const Route = createFileRoute("/educacao")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Área Educacional — LibrasLive" },
      { name: "description", content: "Catálogo de aulas acessíveis em Libras. Crie e compartilhe conteúdos didáticos traduzidos para a comunidade surda." },
    ],
  }),
  component: EducacaoPage,
});

function EducacaoPage() {
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [created, setCreated] = useState<Aula | null>(null);
  const [copied, setCopied] = useState(false);

  // form fields
  const [titulo, setTitulo] = useState("");
  const [disciplina, setDisciplina] = useState("");
  const [nivel, setNivel] = useState("");
  const [autor, setAutor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [texto, setTexto] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      setAulas(await listAulas({ q: q.trim() || undefined, limit: 60 }));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  const filtered = useMemo(() => aulas, [aulas]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !texto.trim()) return;
    setCreating(true);
    try {
      const aula = await createAula({
        titulo: titulo.trim(),
        texto_pt: texto.trim(),
        disciplina: disciplina.trim() || undefined,
        nivel: nivel.trim() || undefined,
        autor_nome: autor.trim() || undefined,
        descricao: descricao.trim() || undefined,
      });
      setCreated(aula);
      setTitulo(""); setDisciplina(""); setNivel(""); setAutor(""); setDescricao(""); setTexto("");
      await refresh();
    } catch (err) {
      console.error(err);
      alert("Não foi possível salvar a aula. Tente novamente.");
    } finally {
      setCreating(false);
    }
  }

  const shareUrl = (slug: string) =>
    typeof window === "undefined" ? `/educacao/${slug}` : `${window.location.origin}/educacao/${slug}`;

  async function copyLink(slug: string) {
    try {
      await navigator.clipboard.writeText(shareUrl(slug));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* ignore */ }
  }

  return (
    <main className="min-h-dvh">
      <VLibrasWidget />
      <AppNav />

      <section className="mx-auto max-w-6xl px-5 pt-8 pb-6">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <GraduationCap className="h-4 w-4 text-primary" /> Módulo Educacional
        </div>
        <h1 className="mt-2 text-3xl font-bold sm:text-4xl">Aulas acessíveis em Libras</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Cole o conteúdo didático e gere um link público para que estudantes surdos acompanhem o material com o avatar VLibras.
        </p>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110"
          >
            <Plus className="h-4 w-4" /> {showForm ? "Fechar formulário" : "Criar aula"}
          </button>
          <div className="ml-auto flex items-center gap-2 rounded-full border bg-card px-3 py-1.5">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && refresh()}
              placeholder="Buscar por título…"
              className="w-48 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </section>

      {showForm && (
        <section className="mx-auto max-w-6xl px-5 pb-6">
          <form onSubmit={submit} className="rounded-3xl border bg-card/80 p-6 shadow-card backdrop-blur">
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Título *</span>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required maxLength={140}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Disciplina</span>
                <input value={disciplina} onChange={(e) => setDisciplina(e.target.value)} maxLength={60}
                  placeholder="Matemática, História…"
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Nível</span>
                <input value={nivel} onChange={(e) => setNivel(e.target.value)} maxLength={40}
                  placeholder="Fundamental, Médio, Superior…"
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Autor</span>
                <input value={autor} onChange={(e) => setAutor(e.target.value)} maxLength={80}
                  placeholder="Seu nome ou da instituição"
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="md:col-span-2 text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Descrição curta</span>
                <input value={descricao} onChange={(e) => setDescricao(e.target.value)} maxLength={200}
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
              <label className="md:col-span-2 text-sm">
                <span className="mb-1 block text-xs font-medium text-muted-foreground">Conteúdo da aula (texto em português) *</span>
                <textarea value={texto} onChange={(e) => setTexto(e.target.value)} required rows={8}
                  placeholder="Cole o texto que será traduzido em Libras pelo avatar…"
                  className="w-full rounded-xl border bg-background/60 px-3 py-2 outline-none focus:border-primary" />
              </label>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="submit" disabled={creating}
                className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Publicar aula
              </button>
            </div>

            {created && (
              <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-sm font-medium text-primary">Aula publicada!</p>
                <p className="mt-1 text-xs text-muted-foreground">Compartilhe este link:</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <code className="break-all rounded-lg bg-card px-2 py-1 text-xs">{shareUrl(created.slug)}</code>
                  <button type="button" onClick={() => copyLink(created.slug)}
                    className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent">
                    {copied ? <Check className="h-3 w-3 text-primary" /> : <Share2 className="h-3 w-3" />}
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  <Link to="/educacao/$slug" params={{ slug: created.slug }}
                    className="rounded-full border bg-card px-3 py-1 text-xs hover:bg-accent">Abrir aula →</Link>
                </div>
              </div>
            )}
          </form>
        </section>
      )}

      <section className="mx-auto max-w-6xl px-5 pb-14">
        <h2 className="font-display text-lg font-semibold">Catálogo público</h2>
        {loading ? (
          <p className="mt-4 text-sm text-muted-foreground">Carregando aulas…</p>
        ) : filtered.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">Nenhuma aula publicada ainda. Seja a primeira pessoa a contribuir!</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((a) => (
              <li key={a.id}>
                <Link to="/educacao/$slug" params={{ slug: a.slug }}
                  className="block h-full rounded-2xl border bg-card/70 p-4 shadow-card transition hover:border-primary/40 hover:bg-card">
                  <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-primary">
                    <BookOpen className="h-3.5 w-3.5" />
                    {a.disciplina || "Geral"} {a.nivel ? `· ${a.nivel}` : ""}
                  </div>
                  <h3 className="mt-2 line-clamp-2 font-display text-base font-semibold">{a.titulo}</h3>
                  {a.descricao && <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{a.descricao}</p>}
                  <p className="mt-3 line-clamp-3 text-xs text-muted-foreground/80">{a.texto_pt}</p>
                  <p className="mt-3 text-[11px] text-muted-foreground">
                    {a.autor_nome || "Anônimo"} · {new Date(a.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
