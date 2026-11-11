import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowLeft, Search, Library, Tag, Hand, Video, X, Volume2 } from "lucide-react";
import { SignVideo } from "@/components/SignVideo";
import { listCategorias, listSinais, type Sinal } from "@/services/signal-library";
import { translateToVLibras } from "@/lib/vlibras";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca de Sinais — LibrasLive" },
      { name: "description", content: "Catálogo público de sinais em Libras com vídeos demonstrativos, imagens, descrição do movimento, sinônimos e busca por palavra ou categoria." },
      { property: "og:title", content: "Biblioteca de Sinais — LibrasLive" },
      { property: "og:description", content: "Assista aos vídeos dos sinais em Libras. Banco colaborativo, acessível e expansível." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
  const [selected, setSelected] = useState<Sinal | null>(null);
  const [onlyVideo, setOnlyVideo] = useState(false);

  const categorias = useQuery({ queryKey: ["categorias"], queryFn: listCategorias });
  const sinais = useQuery({
    queryKey: ["sinais", cat, q],
    queryFn: () => listSinais({ categoria: cat ?? undefined, q: q || undefined, limit: 300 }),
  });

  const items = sinais.data ?? [];
  const filtered = useMemo(() => {
    const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const needle = normalize(q);
    return items.filter((s) => !onlyVideo || !!s.video_url).filter((s) => !q ||
      normalize(s.palavra ?? "").includes(needle) ||
      normalize(s.descricao ?? "").includes(needle) ||
      (Array.isArray(s.sinonimos) && s.sinonimos.some((t) => normalize(t).includes(needle)))
    ).sort((a, b) => Number(!!b.video_url) - Number(!!a.video_url) || a.palavra.localeCompare(b.palavra, "pt-BR"));
  }, [items, q, onlyVideo]);

  const withVideo = filtered.filter((s) => s.video_url).length;

  return (
    <main className="w-full">
      <div className="mx-auto max-w-6xl px-5 pt-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Início
        </Link>
        <Link to="/biblioteca/admin" className="ml-3 inline-flex items-center gap-1.5 rounded-full border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-accent">
          Editar mídia
        </Link>

        <header className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Library className="h-3.5 w-3.5 text-primary" /> Biblioteca de Sinais
            </span>
            <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Aprenda Libras com <span className="text-primary">vídeos reais</span>
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Sinais com vídeos demonstrativos aparecem primeiro. A disponibilidade de mídia e a origem variam por sinal.
            </p>
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {sinais.isLoading ? "Carregando…" : (
              <>
                <p className="font-medium text-foreground">{filtered.length} sinais</p>
                <p>{withVideo} com vídeo</p>
              </>
            )}
          </div>
        </header>

        <div className="mt-6 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar palavra, descrição ou sinônimo…"
              aria-label="Pesquisar sinais"
              className="w-full rounded-full border bg-card/70 py-2.5 pl-9 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Categorias">
          <CategoryChip active={cat === null} onClick={() => setCat(null)} label="Todas" />
          {(categorias.data ?? []).map((c: any) => (
            <CategoryChip key={c.id} active={cat === c.id} onClick={() => setCat(c.id)} label={c.nome} />
          ))}
        </div>
        <label className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm">
          <input type="checkbox" checked={onlyVideo} onChange={(event) => setOnlyVideo(event.target.checked)} className="accent-primary" />
          Apenas sinais com vídeo
        </label>
        {(sinais.isError || categorias.isError) && <div role="alert" className="mt-4 text-sm text-destructive">Não foi possível carregar os sinais ou categorias. <Button variant="outline" onClick={() => { void sinais.refetch(); void categorias.refetch(); }}>Tentar novamente</Button></div>}

        <section className="mt-8 pb-16">
          {sinais.isLoading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border bg-card/50" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border bg-card/50 p-10 text-center">
              <Library className="mx-auto h-8 w-8 text-muted-foreground" />
              <p className="mt-3 font-medium">Nenhum sinal encontrado</p>
              <p className="mt-1 text-sm text-muted-foreground">Ajuste a busca ou escolha outra categoria.</p>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((s) => (
                <li key={s.id}>
                  <button
                    onClick={() => setSelected(s)}
                    className="group block w-full overflow-hidden rounded-2xl border bg-card/70 text-left shadow-card backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-glow"
                    aria-label={`Abrir vídeo do sinal ${s.palavra}`}
                  >
                    <SignVideo
                      palavra={s.palavra}
                      videoUrl={s.video_url}
                      imagemUrl={s.imagem_url}
                      descricao={s.descricao}
                      controls={false}
                      autoPlay={false}
                      loop={false}
                      hideCaption
                      hideDescription
                      className="rounded-none border-0"
                    />
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-display text-base font-semibold leading-tight">{s.palavra}</h3>
                        {s.video_url ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2 py-0.5 text-[10px] font-medium text-primary">
                            <Video className="h-3 w-3" /> Vídeo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            <Hand className="h-3 w-3" /> VLibras
                          </span>
                        )}
                      </div>
                      {s.descricao && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{s.descricao}</p>
                      )}
                      <p className="mt-2 break-words text-[11px] text-muted-foreground">Origem: {s.fonte || s.origem || "Não informada"}</p>
                      {Array.isArray(s.sinonimos) && s.sinonimos.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {s.sinonimos.slice(0, 3).map((t) => (
                            <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {selected && <SignModal sinal={selected} onClose={() => setSelected(null)} />}
    </main>
  );
}

function CategoryChip({ active, onClick, label }: { active: boolean; onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      role="tab"
      aria-selected={active}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition ${
        active ? "bg-primary text-primary-foreground shadow-glow" : "bg-card hover:bg-accent"
      }`}
    >
      <Tag className="h-3 w-3" /> {label}
    </button>
  );
}

function SignModal({ sinal, onClose }: { sinal: Sinal; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Detalhes do sinal ${sinal.palavra}`}
      className="fixed inset-0 z-50 grid place-items-center bg-background/80 p-4 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl overflow-hidden rounded-3xl border bg-card shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full border bg-background p-1.5 hover:bg-accent"
        >
          <X className="h-4 w-4" />
        </button>

        <SignVideo
          palavra={sinal.palavra}
          videoUrl={sinal.video_url}
          imagemUrl={sinal.imagem_url}
          descricao={sinal.descricao}
          hideCaption
          hideDescription
          autoPlay
          loop
          controls
          className="rounded-none border-0 border-b"
        />

        <div className="p-5">
          <h2 className="font-display text-2xl font-bold">{sinal.palavra}</h2>
          <p className="mt-2 break-words text-xs text-muted-foreground">Origem: {sinal.fonte || sinal.origem || "Não informada"}</p>
          <p className="mt-1 text-xs text-muted-foreground">Revisão por pessoa fluente: não documentada neste catálogo.</p>
          {sinal.descricao && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{sinal.descricao}</p>
          )}
          {Array.isArray(sinal.sinonimos) && sinal.sinonimos.length > 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Sinônimos: <span className="text-foreground">{sinal.sinonimos.join(", ")}</span>
            </p>
          )}
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              onClick={() => translateToVLibras(sinal.palavra)}
              className="inline-flex items-center gap-1.5 rounded-full gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-glow"
            >
              <Volume2 className="h-4 w-4" /> Reproduzir no VLibras
            </button>
            {sinal.video_url && (
              <a
                href={sinal.video_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent"
              >
                <Video className="h-4 w-4 text-primary" /> Abrir vídeo
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
