import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Library, Tag, Hand, Video } from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { listCategorias, listSinais } from "@/services/signal-library";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Sinais — LibrasLive" },
      { name: "description", content: "Catálogo público de sinais em Libras: busca por palavra, categoria, sinônimos, descrição e vídeo de demonstração." },
      { property: "og:title", content: "Biblioteca de Sinais — LibrasLive" },
      { property: "og:description", content: "Pesquise sinais de Libras por palavra, categoria e tags. Banco colaborativo e expansível." },
    ],
  }),
  component: Biblioteca,
  errorComponent: ({ error, reset }) => (
    <main className="mx-auto max-w-3xl px-5 py-16 text-center">
      <h1 className="font-display text-2xl font-bold">Não foi possível carregar a biblioteca</h1>
      <p className="mt-2 text-sm text-muted-foreground">{(error as Error)?.message}</p>
      <button onClick={reset} className="mt-4 rounded-full bg-primary px-4 py-2 text-sm text-primary-foreground">Tentar novamente</button>
    </main>
  ),
  notFoundComponent: () => <main className="p-10 text-center">Página não encontrada.</main>,
});

function Biblioteca() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listCategorias });
  const sinais = useQuery({
    queryKey: ["sinais", cat, q],
    queryFn: () => listSinais({ categoria: cat ?? undefined, q: q || undefined, limit: 300 }),
  });

  const items = sinais.data ?? [];
  const filteredByTag = useMemo(() => {
    if (!q) return items;
    const needle = q.toLowerCase();
    return items.filter((s: any) =>
      s.palavra?.toLowerCase().includes(needle) ||
      s.descricao?.toLowerCase().includes(needle) ||
      (Array.isArray(s.sinonimos) && s.sinonimos.some((t: string) => t.toLowerCase().includes(needle)))
    );
  }, [items, q]);

  return (
    <main className="min-h-dvh">
      <AppNav />
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Library className="h-3.5 w-3.5 text-primary" /> Módulo 2 · Biblioteca de Sinais
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Biblioteca de <span className="text-primary">Libras</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Banco colaborativo de sinais com nome, categoria, descrição, vídeo de demonstração, sinônimos e tags de pesquisa.
              Estrutura preparada para expansão contínua.
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {sinais.isLoading ? "Carregando…" : `${filteredByTag.length} sinais`}
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar palavra, descrição ou sinônimo…"
              className="w-full rounded-full border bg-card/70 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`rounded-full border px-3 py-1.5 text-xs ${cat === null ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
          >
            Todas
          </button>
          {(categorias.data ?? []).map((c: any) => (
            <button
              key={c.id}
              onClick={() => setCat(c.id)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${cat === c.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >
              <Tag className="h-3 w-3" /> {c.nome}
            </button>
          ))}
        </div>

        <section className="mt-8 pb-16">
          {sinais.isLoading ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="h-40 animate-pulse rounded-2xl border bg-card/50" />
              ))}
            </div>
          ) : filteredByTag.length === 0 ? (
            <div className="rounded-3xl border bg-card/50 p-10 text-center">
              <Library className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhum sinal encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou escolha outra categoria.</p>
            </div>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {filteredByTag.map((s: any) => (
                <li key={s.id} className="rounded-2xl border bg-card/70 p-4 shadow-card backdrop-blur transition hover:border-primary/40">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold">{s.palavra}</h3>
                    {typeof s.confianca === "number" && (
                      <span className="rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {Math.round(s.confianca * 100)}%
                      </span>
                    )}
                  </div>
                  {s.descricao && (
                    <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{s.descricao}</p>
                  )}
                  {Array.isArray(s.sinonimos) && s.sinonimos.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.sinonimos.slice(0, 4).map((t: string) => (
                        <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
                    {s.video_url ? (
                      <a href={s.video_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Video className="h-3 w-3" /> Demonstração
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-1"><Hand className="h-3 w-3" /> Sem vídeo ainda</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
