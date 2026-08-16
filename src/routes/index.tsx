import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Hand,
  Mic,
  Languages,
  GraduationCap,
  Stethoscope,
  BookOpen,
  Library,
  ArrowRight,
  Code2,
  ShieldCheck,
  Zap,
  Globe2,
  Layers,
  Check,
} from "lucide-react";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { AppNav } from "@/components/AppNav";
import { NewsletterForm } from "@/components/NewsletterForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LibrasLive AI — Ecossistema de acessibilidade em Libras" },
      { name: "description", content: "Plataforma modular de tradução bidirecional Libras ↔ Português em tempo real, biblioteca de sinais, aprendizagem, educação e saúde acessível." },
      { property: "og:title", content: "LibrasLive AI — Ecossistema de acessibilidade em Libras" },
      { property: "og:description", content: "Tradução em tempo real, biblioteca de sinais, módulos educacional e hospitalar e API pública para integrações." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
    to: "/biblioteca" as const,
    icon: Library,
    tag: "Módulo 2 · Biblioteca",
    title: "Biblioteca de sinais",
    desc: "Banco colaborativo com busca por palavra, categoria, sinônimos e vídeo de demonstração.",
    cta: "Pesquisar sinais",
  },
] as const;

const STATS = [
  { value: "6", label: "Módulos integrados", hint: "Tradução, biblioteca, aprendizagem, educação e saúde" },
  { value: "A–Z", label: "Alfabeto manual", hint: "Reconhecimento e soletração completos" },
  { value: "≤ 1s", label: "Latência alvo", hint: "Pipeline otimizado de reconhecimento" },
  { value: "4", label: "Endpoints públicos", hint: "REST aberto para integrações" },
] as const;

const STEPS = [
  {
    icon: Mic,
    title: "Capture",
    desc: "Câmera e microfone captam sinais e fala simultaneamente, com feedback visual imediato.",
  },
  {
    icon: Layers,
    title: "Interprete",
    desc: "As glosas reconhecidas passam pela IA contextual que reconstrói frases naturais em português.",
  },
  {
    icon: Hand,
    title: "Sinalize",
    desc: "O avatar oficial VLibras devolve a resposta em Libras dentro da própria interface.",
  },
] as const;

const AUDIENCES = [
  { icon: GraduationCap, title: "Escolas e universidades", desc: "Aulas acessíveis, trilhas de aprendizagem e material compartilhável por link público." },
  { icon: Stethoscope, title: "Hospitais e clínicas", desc: "Frases clínicas, protocolo de emergência e diálogo bidirecional entre paciente e equipe." },
  { icon: Globe2, title: "Órgãos públicos", desc: "Atendimento em conformidade com a LBI, com avatar oficial do Governo Federal." },
  { icon: Code2, title: "Times de produto", desc: "API REST pública com CORS aberto para integrar Libras em qualquer aplicação." },
] as const;

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Conformidade LBI", desc: "Arquitetura orientada à Lei 13.146/2015 desde o primeiro componente." },
  { icon: Zap, title: "Desempenho real", desc: "Reconhecimento contínuo com voto temporal para reduzir falsos positivos." },
  { icon: Layers, title: "Modularidade", desc: "Cada serviço evolui de forma independente, sem reconstruir o sistema." },
] as const;

function Index() {
  return (
    <main className="min-h-dvh">
      <VLibrasWidget />
      <AppNav />

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-60" aria-hidden />
        <div
          className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-primary/20 blur-[130px] aurora"
          aria-hidden
        />
        <div className="section-shell relative pb-12 pt-14 text-center sm:pb-16 sm:pt-20">
          <span className="reveal inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/70 px-3.5 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Ecossistema modular · Libras ↔ Português
          </span>
          <h1 className="reveal mx-auto mt-6 max-w-4xl text-balance text-4xl font-extrabold leading-[1.03] tracking-tight sm:text-6xl md:text-[4.25rem]">
            Acessibilidade em Libras como{" "}
            <span className="text-gradient">ecossistema</span>
          </h1>
          <p className="reveal mx-auto mt-5 max-w-2xl text-balance text-sm leading-relaxed text-muted-foreground sm:text-lg">
            Tradução bidirecional em tempo real no centro. Em volta, módulos para biblioteca de sinais, aprendizagem,
            educação e saúde — todos prontos para escolas, hospitais, universidades e órgãos públicos.
          </p>
          <div className="reveal mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/conversa"
              className="inline-flex h-12 items-center gap-2 rounded-full gradient-primary px-6 text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-110 active:scale-[0.98]"
            >
              <Mic className="h-4 w-4" /> Começar tradução
            </Link>
            <Link
              to="/educacao"
              className="inline-flex h-12 items-center gap-2 rounded-full border border-border/80 bg-card/80 px-6 text-sm font-semibold backdrop-blur transition hover:border-primary/35 hover:bg-accent active:scale-[0.98]"
            >
              <BookOpen className="h-4 w-4 text-primary" /> Ver aulas acessíveis
            </Link>
          </div>

          <ul className="reveal mx-auto mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            {["Avatar oficial VLibras", "IA contextual", "API pública sem chave"].map((f) => (
              <li key={f} className="inline-flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-primary" /> {f}
              </li>
            ))}
          </ul>
        </div>

        {/* STATS BAND */}
        <div className="section-shell relative pb-4">
          <div className="card-glass grid grid-cols-2 divide-border/60 overflow-hidden md:grid-cols-4 md:divide-x">
            {STATS.map((s) => (
              <div key={s.label} className="p-5 text-center sm:p-6">
                <p className="stat-value text-gradient">{s.value}</p>
                <p className="mt-1 text-sm font-semibold">{s.label}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{s.hint}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MODULES GRID */}
      <section className="section-shell section-pad">
        <div className="mb-8 flex flex-col gap-3 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="eyebrow">Plataforma</p>
            <h2 className="section-title mt-2">Seis módulos, uma única experiência</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Cada módulo funciona sozinho e conversa com os demais — comece por onde a sua instituição precisa.
            </p>
          </div>
          <div className="hidden h-px flex-1 shimmer-line sm:block" aria-hidden />
        </div>

        <div className="grid gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            const accent = "accent" in m && m.accent;
            return (
              <Link
                key={m.title + m.to}
                to={m.to}
                className={`group relative overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-card backdrop-blur-xl card-lift ${
                  accent ? "ring-soft" : ""
                }`}
              >
                {accent && (
                  <div className="pointer-events-none absolute inset-x-0 -top-24 h-44 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
                )}
                <div className="relative flex h-full flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="text-right text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                      {m.tag}
                    </span>
                  </div>
                  <h3 className="mt-5 font-display text-lg font-bold tracking-tight">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                    {m.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section-shell pb-4">
        <div className="hairline mb-14" aria-hidden />
        <div className="mx-auto max-w-2xl text-center">
          <p className="eyebrow">Como funciona</p>
          <h2 className="section-title mt-2">Três passos, comunicação sem barreira</h2>
        </div>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <li key={s.title} className="group relative rounded-3xl border border-border/70 bg-card/60 p-6 backdrop-blur card-lift">
                <span className="absolute right-6 top-5 font-display text-4xl font-extrabold text-primary/12">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
              </li>
            );
          })}
        </ol>
      </section>

      {/* PARA QUEM */}
      <section className="section-shell section-pad">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center">
          <div>
            <p className="eyebrow">Para quem</p>
            <h2 className="section-title mt-2">Feito para instituições que precisam incluir todo mundo</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              O LibrasLive foi desenhado para operar em contextos reais de atendimento, ensino e serviço público,
              com o avatar oficial do Governo Federal e uma base semântica de sinais em evolução contínua.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {PRINCIPLES.map((p) => {
                const Icon = p.icon;
                return (
                  <div key={p.title} className="rounded-2xl border border-border/70 bg-card/60 p-4 backdrop-blur">
                    <Icon className="h-4 w-4 text-primary" />
                    <p className="mt-2 text-sm font-semibold">{p.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {AUDIENCES.map((a) => {
              const Icon = a.icon;
              return (
                <div key={a.title} className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-card backdrop-blur-xl card-lift">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold">{a.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* API + ARQUITETURA */}
      <section className="section-shell pb-16 sm:pb-20">
        <div className="card-glass p-6 md:p-10">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="max-w-xl">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                <Code2 className="h-4 w-4" /> Arquitetura modular & API pública
              </div>
              <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
                Pronto para integrar com qualquer aplicação
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                O LibrasLive expõe endpoints REST públicos para tradução de glosas, busca de sinais, frases hospitalares e
                aulas acessíveis — sem chave, com CORS aberto. Cada módulo é um serviço independente, permitindo evolução
                contínua sem reconstruir o sistema.
              </p>
              <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                <li className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5"><span className="font-semibold text-foreground">Core Translation Engine</span> · IA contextual + VLibras</li>
                <li className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5"><span className="font-semibold text-foreground">Signal Library Service</span> · banco colaborativo de sinais</li>
                <li className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5"><span className="font-semibold text-foreground">Learning Service</span> · lições, quiz e progresso</li>
                <li className="rounded-xl border border-border/70 bg-background/50 px-3 py-2.5"><span className="font-semibold text-foreground">Education + Health</span> · aulas e comunicação clínica</li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
              <div className="flex items-center gap-2 border-b border-border/70 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-primary/45" />
                <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
                <span className="ml-2 text-[11px] font-medium text-muted-foreground">api.libraslive · REST</span>
              </div>
              <div className="space-y-1.5 p-4 font-mono text-xs leading-relaxed text-muted-foreground">
                <p className="text-primary">GET /api/public/signs?q=agua</p>
                <p>GET /api/public/hospital-phrases?categoria=emergencia</p>
                <p>GET /api/public/aulas</p>
                <p>POST /api/public/translate</p>
                <p className="ml-3 text-foreground/80">{`{ "glosses": ["EU","QUERER","ÁGUA"] }`}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section-shell pb-16 sm:pb-24">
        <NewsletterForm />
      </section>

      <footer className="border-t border-border/70 bg-card/50 backdrop-blur-xl">
        <div className="section-shell py-12">
          <div className="grid gap-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary shadow-glow">
                  <Hand className="h-4 w-4 text-primary-foreground" />
                </div>
                <p className="font-display text-base font-bold text-foreground">
                  LibrasLive <span className="text-primary">AI</span>
                </p>
              </div>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Construído com acessibilidade no centro — em conformidade com a LBI (Lei 13.146/2015).
              </p>
            </div>
            <nav className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:grid-cols-3" aria-label="Links do rodapé">
              {MODULES.map((m) => (
                <Link key={"f" + m.to} to={m.to} className="text-muted-foreground transition hover:text-primary">
                  {m.title}
                </Link>
              ))}
            </nav>
          </div>
          <div className="hairline my-8" aria-hidden />
          <div className="flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} LibrasLive AI. Todos os direitos reservados.</p>
            <p>
              Avatar oficial fornecido por{" "}
              <a className="font-medium text-primary hover:underline" href="https://www.gov.br/governodigital/pt-br/vlibras" target="_blank" rel="noreferrer">
                VLibras / Governo Federal
              </a>
              .
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
