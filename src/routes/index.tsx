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
  MessagesSquare,
  Activity,
} from "lucide-react";
import { VLibrasWidget } from "@/components/VLibrasWidget";
import { PageShell, StatTile } from "@/components/PageShell";
import { NewsletterForm } from "@/components/NewsletterForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LibrasLive AI — Console de acessibilidade em Libras" },
      {
        name: "description",
        content:
          "Console modular de tradução bidirecional Libras ↔ Português em tempo real, com biblioteca de sinais, aprendizagem, educação e saúde acessível.",
      },
      { property: "og:title", content: "LibrasLive AI — Console de acessibilidade em Libras" },
      {
        property: "og:description",
        content: "Tradução em tempo real, biblioteca de sinais, módulos educacional e hospitalar e API pública.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const MODULES = [
  {
    to: "/conversa" as const,
    icon: MessagesSquare,
    tag: "Núcleo",
    title: "Tradução em tempo real",
    desc: "Câmera reconhece sinais e voz reconhece português, com IA contextual bidirecional.",
    cta: "Abrir conversa",
  },
  {
    to: "/traduzir" as const,
    icon: Languages,
    tag: "PT → Libras",
    title: "Texto e voz para Libras",
    desc: "Digite ou fale e veja o avatar oficial VLibras sinalizar com fallback de soletração.",
    cta: "Traduzir agora",
  },
  {
    to: "/aprender" as const,
    icon: GraduationCap,
    tag: "Aprendizagem",
    title: "Trilhas e quiz",
    desc: "Lições do alfabeto, correção por câmera e estatísticas de evolução.",
    cta: "Começar a aprender",
  },
  {
    to: "/biblioteca" as const,
    icon: Library,
    tag: "Biblioteca",
    title: "Banco de sinais",
    desc: "Busca por palavra, categoria, sinônimos e vídeo de demonstração.",
    cta: "Pesquisar sinais",
  },
  {
    to: "/educacao" as const,
    icon: BookOpen,
    tag: "Educacional",
    title: "Aulas acessíveis",
    desc: "Crie e compartilhe conteúdos didáticos traduzidos em Libras por link público.",
    cta: "Explorar aulas",
  },
  {
    to: "/hospital" as const,
    icon: Stethoscope,
    tag: "Saúde",
    title: "Comunicação clínica",
    desc: "Frases médicas essenciais, emergência e diálogo paciente ↔ profissional.",
    cta: "Abrir modo hospital",
  },
] as const;

const STEPS = [
  { icon: Mic, title: "Capture", desc: "Câmera e microfone captam sinais e fala com feedback visual imediato." },
  { icon: Layers, title: "Interprete", desc: "As glosas passam pela IA contextual que reconstrói frases naturais." },
  { icon: Hand, title: "Sinalize", desc: "O avatar oficial VLibras devolve a resposta em Libras na interface." },
] as const;

const AUDIENCES = [
  { icon: GraduationCap, title: "Escolas e universidades", desc: "Aulas acessíveis e trilhas compartilháveis por link público." },
  { icon: Stethoscope, title: "Hospitais e clínicas", desc: "Frases clínicas, emergência e diálogo bidirecional." },
  { icon: Globe2, title: "Órgãos públicos", desc: "Atendimento em conformidade com a LBI e avatar oficial." },
  { icon: Code2, title: "Times de produto", desc: "API REST pública com CORS aberto para qualquer aplicação." },
] as const;

const PRINCIPLES = [
  { icon: ShieldCheck, title: "Conformidade LBI", desc: "Arquitetura orientada à Lei 13.146/2015." },
  { icon: Zap, title: "Desempenho real", desc: "Voto temporal para reduzir falsos positivos." },
  { icon: Layers, title: "Modularidade", desc: "Cada serviço evolui de forma independente." },
] as const;

function Index() {
  return (
    <PageShell width="wide">
      <VLibrasWidget />

      {/* HERO / CONSOLE */}
      <section className="reveal relative overflow-hidden rounded-3xl border border-border/60 bg-card/60 shadow-card backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
        <div
          className="pointer-events-none absolute -left-24 -top-32 h-80 w-80 rounded-full bg-primary/25 blur-[110px] aurora"
          aria-hidden
        />
        <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-center">
          <div className="min-w-0">
            <span className="badge-soft">
              <Sparkles className="h-3.5 w-3.5" /> Ecossistema modular · Libras ↔ Português
            </span>
            <h1 className="mt-5 text-balance font-display text-[2.1rem] font-extrabold leading-[1.05] tracking-tight sm:text-5xl">
              Um console único para <span className="text-gradient">acessibilidade em Libras</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Tradução bidirecional em tempo real no centro. Em volta, módulos de biblioteca, aprendizagem, educação e
              saúde — prontos para escolas, hospitais, universidades e órgãos públicos.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/conversa" className="btn-primary h-12 px-6">
                <Mic className="h-4 w-4" /> Começar tradução
              </Link>
              <Link to="/traduzir" className="btn-secondary h-12 px-6">
                <Languages className="h-4 w-4 text-primary" /> Português para Libras
              </Link>
            </div>
          </div>

          {/* Painel de status */}
          <div className="min-w-0 rounded-2xl border border-border/70 bg-background/60 p-5 backdrop-blur">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <p className="truncate font-display text-sm font-bold">Estado da plataforma</p>
              <span className="badge-live shrink-0">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
                Operacional
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {[
                { label: "Pipeline de reconhecimento", value: "≤ 1s", icon: Activity },
                { label: "Avatar oficial VLibras", value: "Ativo", icon: Hand },
                { label: "Endpoints públicos", value: "4 REST", icon: Code2 },
              ].map((row) => {
                const Icon = row.icon;
                return (
                  <div
                    key={row.label}
                    className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-border/60 bg-card/60 px-3 py-2.5"
                  >
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary/12 text-primary">
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-xs text-muted-foreground">{row.label}</span>
                    <span className="shrink-0 text-xs font-bold">{row.value}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 h-px shimmer-line" aria-hidden />
            <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
              Reconhecimento contínuo com voto temporal, IA contextual e soletração completa A–Z.
            </p>
          </div>
        </div>
      </section>

      {/* MÉTRICAS */}
      <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile label="Módulos integrados" value="6" hint="Tradução, biblioteca, aprendizagem, educação e saúde" tone="primary" />
        <StatTile label="Alfabeto manual" value="A–Z" hint="Reconhecimento e soletração completos" />
        <StatTile label="Latência alvo" value="≤ 1s" hint="Pipeline otimizado de reconhecimento" tone="success" />
        <StatTile label="Endpoints públicos" value="4" hint="REST aberto, sem chave, com CORS" />
      </section>

      {/* MÓDULOS */}
      <section className="section-pad">
        <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="eyebrow">Plataforma</p>
            <h2 className="section-title mt-2">Seis módulos, uma única experiência</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground sm:text-right">
            Cada módulo funciona sozinho e conversa com os demais.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.to} to={m.to} className="group surface-interactive relative overflow-hidden p-6">
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-start gap-4">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/12 text-primary transition-transform duration-300 group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-[0.16em] text-primary">
                      {m.tag}
                    </span>
                    <span className="mt-1 block truncate font-display text-lg font-bold">{m.title}</span>
                  </span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{m.desc}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {m.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* COMO FUNCIONA + PRINCÍPIOS */}
      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Como funciona</p>
          <h2 className="section-title mt-2">Três passos, comunicação sem barreira</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <li key={s.title} className="relative rounded-2xl border border-border/60 bg-background/50 p-5">
                  <span className="absolute right-4 top-3 font-display text-3xl font-extrabold text-primary/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 font-display text-base font-bold">{s.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{s.desc}</p>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="panel p-6 sm:p-8">
          <p className="eyebrow">Princípios</p>
          <h2 className="section-title mt-2">Engenharia com propósito</h2>
          <div className="mt-6 space-y-3">
            {PRINCIPLES.map((p) => {
              const Icon = p.icon;
              return (
                <div
                  key={p.title}
                  className="grid grid-cols-[auto_minmax(0,1fr)] gap-3 rounded-2xl border border-border/60 bg-background/50 p-4"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/12 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-bold">{p.title}</span>
                    <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{p.desc}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* PÚBLICOS */}
      <section className="section-pad">
        <div className="mb-6">
          <p className="eyebrow">Para quem</p>
          <h2 className="section-title mt-2">Instituições que precisam incluir todo mundo</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {AUDIENCES.map((a) => {
            const Icon = a.icon;
            return (
              <div key={a.title} className="surface-interactive p-5">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/12 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-display text-base font-bold">{a.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* API */}
      <section className="card-glass p-6 sm:p-9">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
          <div className="min-w-0">
            <p className="eyebrow">Arquitetura modular & API pública</p>
            <h2 className="section-title mt-2">Pronto para integrar com qualquer aplicação</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              O LibrasLive expõe endpoints REST públicos para tradução de glosas, busca de sinais, frases hospitalares e
              aulas acessíveis — sem chave, com CORS aberto.
            </p>
            <ul className="mt-6 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <li className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                <span className="font-semibold text-foreground">Core Translation Engine</span> · IA contextual + VLibras
              </li>
              <li className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                <span className="font-semibold text-foreground">Signal Library Service</span> · banco colaborativo
              </li>
              <li className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                <span className="font-semibold text-foreground">Learning Service</span> · lições, quiz e progresso
              </li>
              <li className="rounded-xl border border-border/60 bg-background/50 px-3 py-2.5">
                <span className="font-semibold text-foreground">Education + Health</span> · aulas e clínica
              </li>
            </ul>
          </div>

          <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
            <div className="flex items-center gap-2 border-b border-border/60 px-4 py-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-primary/50" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/35" />
              <span className="ml-2 text-[11px] font-medium text-muted-foreground">api.libraslive · REST</span>
            </div>
            <div className="space-y-1.5 overflow-x-auto p-4 font-mono text-xs leading-relaxed text-muted-foreground">
              <p className="text-primary">GET /api/public/signs?q=agua</p>
              <p>GET /api/public/hospital-phrases?categoria=emergencia</p>
              <p>GET /api/public/aulas</p>
              <p>POST /api/public/translate</p>
              <p className="ml-3 text-foreground/80">{`{ "glosses": ["EU","QUERER","ÁGUA"] }`}</p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section className="section-pad">
        <NewsletterForm />
      </section>
    </PageShell>
  );
}
