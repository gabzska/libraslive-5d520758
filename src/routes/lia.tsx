import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { AppNav } from "@/components/AppNav";
import { LiaInterpreter } from "@/components/LiaInterpreter";
import { Lia3DStage } from "@/components/Lia3DStage";
import { playSign, SIGN_LIBRARY } from "@/lib/lia-sign-library";
import { Sparkles, Heart, Hand, Brain, Accessibility, ArrowRight } from "lucide-react";
import liaAsset from "@/assets/lia-mascot.png.asset.json";

export const Route = createFileRoute("/lia")({
  head: () => ({
    meta: [
      { title: "Conheça a Lia — intérprete virtual do LibrasLive" },
      { name: "description", content: "Lia é a assistente virtual oficial do LibrasLive, a ponte amigável entre pessoas surdas e ouvintes. Conheça a mascote, sua missão e como ela interpreta Libras em tempo real." },
      { property: "og:title", content: "Conheça a Lia — intérprete virtual do LibrasLive" },
      { property: "og:description", content: "A mascote oficial do LibrasLive: rosto humano da acessibilidade em Libras, com tradução em tempo real, biblioteca de sinais e suporte a aprendizagem." },
      { property: "og:image", content: liaAsset.url },
      { property: "twitter:image", content: liaAsset.url },
    ],
  }),
  component: LiaPage,
});

const HIGHLIGHTS = [
  { icon: Hand, title: "Interpreta Libras em tempo real", desc: "Reconhece os sinais que você faz na câmera e responde com a frase em português correspondente." },
  { icon: Brain, title: "IA contextual brasileira", desc: "Entende o contexto da frase, desambigua sinais parecidos e adapta o texto para o português natural." },
  { icon: Accessibility, title: "Inclusão como princípio", desc: "Projetada com pessoas surdas no centro — em conformidade com a LBI (Lei 13.146/2015)." },
  { icon: Heart, title: "Mascote acolhedora", desc: "Presente em toda a plataforma para tornar cada interação mais humana, simples e amigável." },
];

const DEMO_SIGNS = ["OLÁ", "OBRIGADO", "AMOR", "LIBRAS", "AJUDA"] as const;

function LiaPage() {
  const [bubble, setBubble] = useState<string | undefined>("Oi! Eu sou a Lia 👋");
  return (
    <main className="min-h-dvh">
      <AppNav />

      {/* HERO */}
      <section className="mx-auto grid max-w-6xl gap-10 px-5 pb-10 pt-12 md:grid-cols-2 md:items-center md:pt-16">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-primary" /> Intérprete virtual oficial
          </span>
          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] sm:text-5xl md:text-6xl">
            Oi, eu sou a{" "}
            <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.78_0.16_310)] bg-clip-text text-transparent">Lia</span>.
          </h1>
          <p className="mt-4 max-w-lg text-balance text-muted-foreground">
            Sou a intérprete virtual do LibrasLive. Estou aqui para conectar pessoas surdas e ouvintes em
            tempo real, com tradução precisa, expressões naturais e o cuidado de quem entende que a língua é parte da identidade.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/conversa" className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110">
              Conversar com a Lia <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/aprender" className="inline-flex items-center gap-2 rounded-full border bg-card px-5 py-2.5 text-sm font-medium transition hover:bg-accent">
              Aprender Libras com a Lia
            </Link>
          </div>
        </div>

        <div className="relative flex justify-center">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[oklch(0.62_0.21_295)]/15 via-transparent to-[oklch(0.78_0.16_310)]/20 blur-3xl" />
          <img
            src={liaAsset.url}
            alt="Lia, intérprete virtual de Libras do LibrasLive, fazendo o sinal de 'eu te amo'"
            className="max-h-[520px] w-auto drop-shadow-2xl"
          />
        </div>
      </section>

      {/* DEMO INTERATIVA */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur md:p-10">
          <div className="grid gap-8 md:grid-cols-[1fr,1.2fr] md:items-center">
            <div className="flex flex-col items-center gap-6">
              <LiaInterpreter size="xl" variant="portrait" message={bubble} showBubble bubbleSide="bottom" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-primary">Experimente</p>
              <h2 className="mt-1 font-display text-2xl font-bold">Peça à Lia para sinalizar</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Toque em uma palavra. A Lia reage no balão e a função pública{" "}
                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">playSign(gloss)</code>{" "}
                dispara o sinal — mesma API que vai mover o avatar 3D no futuro, sem refatoração.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {DEMO_SIGNS.map((g) => (
                  <button
                    key={g}
                    onClick={() => {
                      setBubble(undefined);
                      playSign(g);
                    }}
                    className="rounded-full border bg-background px-4 py-2 text-sm font-medium transition hover:border-primary/60 hover:bg-primary/5"
                  >
                    {SIGN_LIBRARY[g]?.label ?? g}
                  </button>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                {Object.keys(SIGN_LIBRARY).length} sinais no catálogo inicial · biblioteca expansível
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="mx-auto max-w-6xl px-5 pb-14">
        <div className="grid gap-4 md:grid-cols-2">
          {HIGHLIGHTS.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.title} className="rounded-2xl border bg-card/60 p-5 backdrop-blur">
                <div className="grid h-10 w-10 place-items-center rounded-xl gradient-primary shadow-glow">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <h3 className="mt-3 font-display text-lg font-semibold">{h.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{h.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* PREVIEW 3D */}
      <section className="mx-auto max-w-6xl px-5 pb-16">
        <div className="overflow-hidden rounded-3xl border bg-gradient-to-br from-[oklch(0.96_0.04_300)] to-[oklch(0.92_0.06_290)] p-6 shadow-card md:p-10 dark:from-[oklch(0.22_0.05_290)] dark:to-[oklch(0.18_0.04_280)]">
          <div className="grid gap-6 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs uppercase tracking-wider text-primary">Próximo passo</p>
              <h2 className="mt-1 font-display text-2xl font-bold">A Lia em 3D — em breve</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                A estrutura React Three Fiber já está pronta: Canvas, luzes, suporte a GLB e o pipeline
                de animações por gloss. Quando o avatar riggado for entregue, ele aparece aqui — sem
                trocar nenhuma linha do código que consome a Lia.
              </p>
              <ul className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                <li>✓ Canvas R3F + ambient/directional lights</li>
                <li>✓ Loader GLB com Suspense</li>
                <li>✓ Bus pub/sub <code className="rounded bg-muted px-1 text-[10px]">subscribeLia</code> para animar o rig</li>
                <li>✓ <code className="rounded bg-muted px-1 text-[10px]">SIGN_LIBRARY[gloss].animationUrl</code> reservado</li>
              </ul>
            </div>
            <Lia3DStage className="aspect-square w-full" enableControls />
          </div>
        </div>
      </section>
    </main>
  );
}
