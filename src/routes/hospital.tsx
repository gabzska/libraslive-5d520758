import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Siren, HeartPulse, Stethoscope, FileText, CheckCircle, Send, Volume2,
  Activity, Droplet, Scan, Hourglass, Droplets, CalendarCheck, Bed, Phone, Pill,
  AlertTriangle, IdCard, UserCheck, Soup, Thermometer, Clock, MapPin, Wind, Eye,
  UserPlus, User, Mic, MicOff,
} from "lucide-react";
import { AppNav } from "@/components/AppNav";
import { VLibrasPlayer } from "@/components/VLibrasPlayer";
import { speak } from "@/lib/tts";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hospital")({
  head: () => ({
    meta: [
      { title: "Modo Hospital — LibrasLive AI" },
      { name: "description", content: "Interface rápida para comunicação entre profissionais de saúde e pacientes surdos: frases de emergência, sintomas, admissão, exames e alta com tradução em Libras e voz." },
      { property: "og:title", content: "Modo Hospital — LibrasLive AI" },
      { property: "og:description", content: "Comunicação médica acessível em Libras e voz, em tempo real." },
    ],
  }),
  component: HospitalPage,
});

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Siren, HeartPulse, Stethoscope, FileText, CheckCircle, Activity, Droplet, Scan,
  Hourglass, Droplets, CalendarCheck, Bed, Phone, Pill, AlertTriangle, IdCard,
  UserCheck, Soup, Thermometer, Clock, MapPin, Wind, Eye, UserPlus, User,
};

const TABS = [
  { id: "emergencia", label: "Emergência", icon: Siren, tone: "destructive" as const },
  { id: "sintoma", label: "Sintomas", icon: HeartPulse, tone: "primary" as const },
  { id: "admissao", label: "Admissão", icon: UserCheck, tone: "primary" as const },
  { id: "exame", label: "Exame", icon: Activity, tone: "primary" as const },
  { id: "alta", label: "Alta", icon: CheckCircle, tone: "primary" as const },
];

interface Frase {
  id: string; categoria: string; prioridade: number;
  texto_pt: string; gloss: string | null; icone: string | null; ordem: number;
}

function HospitalPage() {
  const [tab, setTab] = useState<string>("emergencia");
  const [active, setActive] = useState<string>("");
  const [custom, setCustom] = useState<string>("");

  const { listening, interim, finalText, start, stop, supported } = useSpeechRecognition({
    lang: "pt-BR",
    onFinal: (t) => setCustom((c) => (c ? c + " " + t : t)),
  });

  const { data: frases } = useQuery({
    queryKey: ["frases-hospital"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("frases_hospital")
        .select("*")
        .order("prioridade", { ascending: false })
        .order("ordem", { ascending: true });
      if (error) throw error;
      return data as Frase[];
    },
  });

  const filtered = useMemo(
    () => (frases ?? []).filter((f) => f.categoria === tab),
    [frases, tab],
  );

  const send = (texto: string) => {
    setActive(texto);
    speak(texto);
  };

  const playerText = active || custom || finalText;

  return (
    <main className="min-h-dvh">
      <AppNav />
      <section className="mx-auto max-w-6xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
              <Stethoscope className="h-3.5 w-3.5 text-primary" /> Modo Hospital
            </span>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">Comunicação médica acessível</h1>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Toque numa frase para sinalizar em Libras e narrar em voz alta. Pensado para atendimento rápido em prontos-socorros, enfermarias e consultórios.
            </p>
          </div>

          <button
            onClick={() => send("Emergência! Vou chamar ajuda agora.")}
            className="inline-flex items-center gap-2 rounded-full bg-destructive px-5 py-3 text-sm font-semibold text-destructive-foreground shadow-card transition hover:brightness-110"
          >
            <Siren className="h-4 w-4" /> EMERGÊNCIA
          </button>
        </div>

        {/* tabs */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            const cls = isActive
              ? t.tone === "destructive"
                ? "bg-destructive text-destructive-foreground shadow-card"
                : "bg-primary text-primary-foreground shadow-glow"
              : "border bg-card/60 text-muted-foreground hover:bg-accent";
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition ${cls}`}
              >
                <Icon className="h-4 w-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="mt-5 grid gap-5 md:grid-cols-5">
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {filtered.map((f) => {
                const Icon = (f.icone && ICONS[f.icone]) || HeartPulse;
                const isActive = active === f.texto_pt;
                return (
                  <button
                    key={f.id}
                    onClick={() => send(f.texto_pt)}
                    className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 shadow-glow"
                        : "bg-card/70 hover:border-primary/40 hover:bg-accent"
                    }`}
                  >
                    <div className="grid h-10 w-10 flex-none place-items-center rounded-xl bg-primary/15 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug">{f.texto_pt}</p>
                      {f.gloss && <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{f.gloss}</p>}
                    </div>
                    <Volume2 className={`h-4 w-4 flex-none ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  </button>
                );
              })}
              {!filtered.length && (
                <p className="col-span-full text-sm text-muted-foreground">Nenhuma frase nesta categoria ainda.</p>
              )}
            </div>

            {/* Custom */}
            <div className="mt-5 rounded-3xl border bg-card/80 p-5 shadow-card">
              <p className="text-xs font-medium uppercase tracking-wider text-primary">Frase personalizada</p>
              <h2 className="mt-1 font-display text-lg font-semibold">Digite ou ouça o paciente</h2>
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Ex.: Vamos te levar para o raio-X agora."
                rows={3}
                className="mt-3 w-full resize-none rounded-2xl border bg-background/60 p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              {interim && <p className="mt-1 text-xs italic text-muted-foreground">{interim}</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                {!listening ? (
                  <button
                    onClick={start}
                    disabled={!supported}
                    className="inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2 text-sm hover:bg-accent disabled:opacity-50"
                  >
                    <Mic className="h-4 w-4 text-primary" /> Ouvir paciente
                  </button>
                ) : (
                  <button
                    onClick={stop}
                    className="inline-flex items-center gap-2 rounded-full bg-destructive px-4 py-2 text-sm text-destructive-foreground"
                  >
                    <MicOff className="h-4 w-4" /> Parar
                  </button>
                )}
                <button
                  onClick={() => custom.trim() && send(custom.trim())}
                  disabled={!custom.trim()}
                  className="inline-flex items-center gap-2 rounded-full gradient-primary px-5 py-2 text-sm font-medium text-primary-foreground shadow-glow disabled:opacity-50"
                >
                  <Send className="h-4 w-4" /> Sinalizar
                </button>
              </div>
            </div>
          </div>

          <div className="md:col-span-2">
            <VLibrasPlayer text={playerText} hint="A frase escolhida é sinalizada pelo avatar VLibras e narrada em voz alta — para que paciente e profissional se entendam imediatamente." />
          </div>
        </div>
      </section>
    </main>
  );
}
