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
import { PageShell } from "@/components/PageShell";
import { NewsletterForm } from "@/components/NewsletterForm";
import { usePlatformStatus } from "@/hooks/use-platform-status";
import { Button } from "@/components/ui/button";

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

function Index() {
  const { online, avatarReady } = usePlatformStatus();
  return (
    <PageShell width="wide">
      <VLibrasWidget />

      <section className="reveal py-4 sm:py-6">
        <p className="eyebrow">Português ↔ Libras</p>
        <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">LibrasLive <span className="text-primary">AI</span></h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">Uma conversa começa com entendimento.</p>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <Button asChild className="btn-primary h-12"><Link to="/conversa"><MessagesSquare /> Conversar <ArrowRight /></Link></Button>
          <Button asChild variant="outline" className="btn-secondary h-12"><Link to="/traduzir"><Languages /> Traduzir <ArrowRight /></Link></Button>
          <Button asChild variant="outline" className="btn-secondary h-12"><Link to="/aprender"><GraduationCap /> Aprender <ArrowRight /></Link></Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" role="status">
          <span>{online === null ? "Verificando conexão…" : online ? "Navegador conectado" : "Sem conexão"}</span>
          <span>VLibras: {avatarReady ? "disponível para envio" : "ainda não disponível"}</span>
          <span>Tempo da tradução: medido em cada conversa</span>
        </div>
      </section>

      {/* MÓDULOS */}
      <section className="section-pad">
        <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="eyebrow">Plataforma</p>
            <h2 className="section-title mt-2">Mais possibilidades</h2>
          </div>
          <p className="max-w-sm text-sm text-muted-foreground sm:text-right">
            Biblioteca, educação e atendimento em um só lugar.
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

      {/* NEWSLETTER */}
      <section className="section-pad">
        <NewsletterForm />
      </section>
    </PageShell>
  );
}
