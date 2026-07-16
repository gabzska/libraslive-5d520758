import { useState } from "react";
import { Mail, Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const INTERESSES = [
  { value: "", label: "Selecione (opcional)" },
  { value: "acompanhar", label: "Acompanhar o projeto" },
  { value: "testar", label: "Testar a plataforma" },
  { value: "parceiro", label: "Ser parceiro" },
  { value: "investir", label: "Apoiar / investir" },
] as const;

export function NewsletterForm() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [interesse, setInteresse] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const n = nome.trim();
    const em = email.trim();
    if (n.length < 1 || n.length > 120) return setError("Informe seu nome.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)) return setError("E-mail inválido.");

    setStatus("loading");
    const { error: dbError } = await supabase.from("inscricoes_novidades").insert({
      nome: n,
      email: em,
      interesse: interesse || null,
      origem: "site",
    });
    if (dbError) {
      // unique-violation on email → tratamos como sucesso silencioso
      if (dbError.code === "23505") {
        setStatus("done");
        return;
      }
      setStatus("error");
      setError(dbError.message);
      return;
    }
    setStatus("done");
    setNome(""); setEmail(""); setInteresse("");
  }

  if (status === "done") {
    return (
      <div className="relative overflow-hidden rounded-3xl border bg-card/70 p-8 text-center shadow-card backdrop-blur">
        <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/25 to-transparent blur-2xl" />
        <div className="relative">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl gradient-primary shadow-glow">
            <Check className="h-6 w-6 text-primary-foreground" />
          </div>
          <h3 className="mt-4 font-display text-2xl font-bold">Obrigado por acompanhar o LibrasLive!</h3>
          <p className="mt-2 text-sm text-muted-foreground">Em breve enviaremos novidades para o seu e-mail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border bg-card/70 p-6 shadow-card backdrop-blur md:p-8">
      <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/20 to-transparent blur-2xl" />
      <div className="relative grid gap-6 md:grid-cols-[1fr_1.2fr] md:items-center">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Novidades
          </div>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Receba novidades do <span className="bg-gradient-to-r from-[oklch(0.62_0.21_295)] to-[oklch(0.72_0.18_280)] bg-clip-text text-transparent">LibrasLive</span>
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre-se para receber atualizações do projeto, convites para testar a plataforma e oportunidades de parceria.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              type="text"
              required
              placeholder="Seu nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="rounded-2xl border bg-background/70 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              maxLength={120}
            />
            <input
              type="email"
              required
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-2xl border bg-background/70 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
              maxLength={200}
            />
          </div>
          <select
            value={interesse}
            onChange={(e) => setInteresse(e.target.value)}
            className="rounded-2xl border bg-background/70 px-4 py-2.5 text-sm outline-none transition focus:border-primary/60 focus:ring-2 focus:ring-primary/25"
          >
            {INTERESSES.map((i) => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
          {error && <p className="text-xs text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={status === "loading"}
            className="inline-flex items-center justify-center gap-2 rounded-full gradient-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-glow transition hover:brightness-110 disabled:opacity-60"
          >
            {status === "loading" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
            {status === "loading" ? "Enviando…" : "Quero receber novidades"}
          </button>
          <p className="text-[11px] text-muted-foreground">
            Ao se cadastrar, você concorda em receber e-mails do LibrasLive. Você pode cancelar a qualquer momento.
          </p>
        </form>
      </div>
    </div>
  );
}
