import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Hand, Mic, Languages, GraduationCap, Stethoscope, BookOpen, Library, ArrowRight, Code2 } from "lucide-react";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { AppNav } from "@/components/AppNav";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LibrasLive AI — Ecossistema de acessibilidade em Libras" },
      { name: "description", content: "Plataforma modular de tradução bidirecional Libras ↔ Português em tempo real, biblioteca de sinais, aprendizagem, educação e saúde acessível." },
      { property: "og:title", content: "LibrasLive AI — Ecossistema de acessibilidade em Libras" },
      { property: "og:description", content: "Tradução em tempo real, biblioteca de sinais, módulos educacional e hospitalar e API pública para integrações." },
    ],
  }),
  component: Index,
});

const MODULES = [
  {
    to: "/conversa" as const,
    icon: Hand,
    tag: "Módulo 1 · Núcleo",
    title: "Tradução em tempo real",
    desc: "Câmera reconhece sinais e voz reconhece português. Tradução bidirecional com IA contextual.",
    cta: "Abrir conversa",
    accent: true,
  },
  {
    to: "/traduzir" as const,
    icon: Languages,
    tag: "Módulo 1 · PT → Libras",
    title: "Texto e voz para Libras",
    desc: "Digite ou fale em português e veja o avatar VLibras sinalizar com fallback de soletração.",
    cta: "Traduzir agora",
  },
  {
    to: "/aprender" as const,
    icon: GraduationCap,
    tag: "Módulo 3 · Aprendizagem",
    title: "Aprender Libras",
    desc: "Lições do alfabeto, quiz com correção por câmera e estatísticas de evolução.",
    cta: "Começar a aprender",
  },
  {
    to: "/educacao" as const,
    icon: BookOpen,
    tag: "Módulo 4 · Educacional",
    title: "Aulas acessíveis",
    desc: "Crie e compartilhe conteúdos didáticos traduzidos em Libras com link público.",
    cta: "Explorar aulas",
  },
  {
    to: "/hospital" as const,
    icon: Stethoscope,
    tag: "Módulo 5 · Saúde",
    title: "Comunicação clínica",
    desc: "Frases médicas essenciais, emergência e diálogo bidirecional paciente ↔ profissional.",
    cta: "Abrir modo hospital",
  },
  {
    to: "/aprender" as const,
    icon: Library,
    tag: "Módulo 2 · Biblioteca",
    title: "Biblioteca de sinais",
    desc: "Banco colaborativo com busca por palavra, categoria e o alfabeto manual completo.",
    cta: "Pesquisar sinais",
  },
] as const;

function Index() {
  return (
    <main className="min-h-dvh">
      <VLibrasWidget />
      <AppNav />

      {/* HERO */}
      <section className="mx-auto max-w-6xl px-5 pt-10 pb-6 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> Ecossistema modular · Libras ↔ Português
        </span>
        <h1 className="mx-auto mt-5 max-w-3xl text-balance text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
          Acessibilidade em Libras como{" "}
          <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.72_0.18_280)] bg-clip-text text-transparent">
            ecossistema
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-sm text-muted-foreground sm:text-base">
          Tradução bidirecional em tempo real no centro. Em volta, módulos para biblioteca de sinais, aprendizagem,
          educação e saúde — todos prontos para escolas, hospitais, universidades e órgãos públicos.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Link to="/conversa" className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110">
            <Mic className="h-4 w-4" /> Começar tradução
          </Link>
          <Link to="/educacao" className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent">
            <BookOpen className="h-4 w-4 text-primary" /> Ver aulas acessíveis
          </Link>
        </div>
      </section>

      {/* MODULES GRID */}
      <section className="mx-auto max-w-6xl px-5 pb-10">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link
                key={m.title + m.to}
                to={m.to}
                className={`group relative overflow-hidden rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur transition hover:border-primary/50 hover:bg-card ${m.accent ? "ring-1 ring-primary/30" : ""}`}
              >
                {m.accent && (
                  <div className="absolute inset-x-0 -top-20 h-40 bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
                )}
                <div className="relative">
                  <div className="flex items-center justify-between">
                    <div className="grid h-11 w-11 place-items-center rounded-2xl gradient-primary shadow-glow">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-primary">{m.tag}</span>
                  </div>
                  <h2 className="mt-4 font-display text-lg font-semibold">{m.title}</h2>
                  <p className="mt-1.5 text-sm text-muted-foreground">{m.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                    {m.cta} <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* API + ARQUITETURA */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-primary">
                <Code2 className="h-4 w-4" /> Arquitetura modular & API pública
              </div>
              <h2 className="mt-2 font-display text-2xl font-bold">Pronto para integrar com qualquer aplicação</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                O LibrasLive expõe endpoints REST públicos para tradução de glosas, busca de sinais, frases hospitalares e
                aulas acessíveis — sem chave, com CORS aberto. Cada módulo é um serviço independente, permitindo evolução
                contínua sem reconstruir o sistema.
              </p>
            </div>
            <div className="w-full max-w-md rounded-2xl border bg-background/60 p-4 font-mono text-xs text-muted-foreground">
              <p className="text-primary">GET /api/public/signs?q=agua</p>
              <p>GET /api/public/hospital-phrases?categoria=emergencia</p>
              <p>GET /api/public/aulas</p>
              <p>POST /api/public/translate</p>
              <p className="ml-3 text-foreground/80">{`{ "glosses": ["EU","QUERER","ÁGUA"] }`}</p>
            </div>
          </div>
          <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2 lg:grid-cols-4">
            <li className="rounded-xl border bg-background/40 px-3 py-2"><span className="text-foreground">Core Translation Engine</span> · IA contextual + VLibras</li>
            <li className="rounded-xl border bg-background/40 px-3 py-2"><span className="text-foreground">Signal Library Service</span> · banco colaborativo de sinais</li>
            <li className="rounded-xl border bg-background/40 px-3 py-2"><span className="text-foreground">Learning Service</span> · lições, quiz e progresso</li>
            <li className="rounded-xl border bg-background/40 px-3 py-2"><span className="text-foreground">Education + Health</span> · aulas e comunicação clínica</li>
          </ul>
        </div>
      </section>

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
