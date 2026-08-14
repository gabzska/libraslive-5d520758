import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Hand, Loader2, Mail, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { signInInput, signUpInput } from "@/lib/users.schema";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar ou criar conta — LibrasLive AI" },
      {
        name: "description",
        content:
          "Acesse sua conta LibrasLive AI ou crie um novo cadastro para gerenciar perfis, aulas e traduções em Libras.",
      },
      { property: "og:title", content: "Entrar ou criar conta — LibrasLive AI" },
      {
        property: "og:description",
        content: "Acesse ou crie sua conta na plataforma de acessibilidade em Libras.",
      },
    ],
  }),
  component: AuthPage,
});

type Mode = "entrar" | "criar";

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("entrar");
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirma, setConfirma] = useState("");
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erroServidor, setErroServidor] = useState<string | null>(null);


  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/conta", replace: true });
    });
  }, [navigate]);

  const errors: Record<string, string | undefined> = {};
  if (mode === "criar") {
    const parsed = signUpInput.safeParse({ nomeCompleto: nome, email, password: senha });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] === "nomeCompleto" ? "nome" : String(issue.path[0]);
        errors[key] ??= issue.message;
      }
    }
    if (confirma !== senha) errors["confirma"] = "As senhas não coincidem";
  } else {
    const parsed = signInInput.safeParse({ email, password: senha });
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        errors[String(issue.path[0] === "password" ? "senha" : issue.path[0])] ??= issue.message;
      }
    }
  }
  const invalid = Object.keys(errors).length > 0;

  function mensagemDeErro(err: { message?: string; code?: string; status?: number }) {
    const raw = (err.message ?? "").toLowerCase();
    const code = err.code ?? "";
    if (code === "weak_password" || raw.includes("pwned") || raw.includes("weak password"))
      return "Essa senha é muito comum ou já apareceu em vazamentos. Escolha uma senha mais forte e única.";
    if (raw.includes("already registered") || raw.includes("user already"))
      return "Já existe uma conta com este e-mail. Faça login ou recupere o acesso.";
    if (code === "email_address_invalid" || raw.includes("invalid email"))
      return "Este endereço de e-mail não é aceito. Use um e-mail válido.";
    if (raw.includes("rate limit") || err.status === 429)
      return "Muitas tentativas em sequência. Aguarde alguns instantes e tente novamente.";
    if (raw.includes("email not confirmed"))
      return "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.";
    if (raw.includes("invalid login")) return "E-mail ou senha incorretos.";
    return "Não foi possível concluir. Tente novamente em instantes.";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ nome: true, email: true, senha: true, confirma: true, password: true });
    if (invalid || loading) return;
    setLoading(true);
    setErroServidor(null);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        toast.success("Bem-vindo de volta!");
        navigate({ to: "/conta", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: {
            emailRedirectTo: `${window.location.origin}/conta`,
            data: { nome_completo: nome },
          },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Conta criada! Você já está conectado.");
          navigate({ to: "/conta", replace: true });
          return;
        }

        // Sem sessão imediata: tenta autenticar; se falhar, é confirmação por e-mail.
        const { data: signIn } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (signIn.session) {
          toast.success("Conta criada! Você já está conectado.");
          navigate({ to: "/conta", replace: true });
          return;
        }
        setSucesso(true);
        toast.success("Conta criada. Confirme seu e-mail para entrar.");
      }
    } catch (err) {
      const msg = mensagemDeErro(err as { message?: string; code?: string; status?: number });
      setErroServidor(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }


  const field = (key: string) => (touched[key] ? errors[key] : undefined);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <div className="absolute inset-0 -z-10 gradient-primary opacity-90" />
        <div
          aria-hidden
          className="absolute -right-24 top-1/3 -z-10 h-96 w-96 rounded-full bg-primary-foreground/15 blur-3xl"
        />
        <Link to="/" className="flex items-center gap-3 text-primary-foreground">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground/15">
            <Hand className="h-5 w-5" />
          </div>
          <span className="font-display text-lg font-bold">LibrasLive AI</span>
        </Link>
        <div className="max-w-md text-primary-foreground">
          <h2 className="font-display text-4xl font-bold leading-tight">
            Acessibilidade em Libras, do começo ao fim.
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-primary-foreground/80">
            Traduza, ensine e atenda em Libras com uma plataforma única. Crie sua conta para
            gerenciar equipes, perfis e conteúdos.
          </p>
        </div>
        <p className="text-xs text-primary-foreground/70">
          © {new Date().getFullYear()} LibrasLive AI
        </p>
      </aside>

      <main className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 lg:hidden">
            <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary">
              <Hand className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold">LibrasLive AI</span>
          </Link>

          <div className="mb-7 inline-flex rounded-lg border bg-muted/60 p-1" role="tablist">
            {(["entrar", "criar"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setTouched({});
                  setSucesso(false);
                  setErroServidor(null);
                }}
                className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                  mode === m
                    ? "bg-card text-foreground shadow-card"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {m === "entrar" ? "Entrar" : "Criar conta"}
              </button>
            ))}
          </div>

          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {mode === "entrar" ? "Bem-vindo de volta" : "Criar sua conta"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {mode === "entrar"
              ? "Entre para acessar seu painel e suas configurações."
              : "Leva menos de um minuto. Use uma senha forte e única."}
          </p>

          {erroServidor && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-3 rounded-lg border border-destructive/35 bg-destructive/8 p-4 text-sm text-destructive"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{erroServidor}</p>
            </div>
          )}

          {sucesso && (
            <div className="mt-6 flex items-start gap-3 rounded-lg border border-primary/25 bg-primary/8 p-4 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p>
                Cadastro concluído. Verifique sua caixa de entrada para confirmar o e-mail e
                liberar o acesso.
              </p>
            </div>
          )}


          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
            {mode === "criar" && (
              <Field
                id="nome"
                label="Nome completo"
                icon={<User className="h-4 w-4" />}
                value={nome}
                onChange={setNome}
                onBlur={() => setTouched((t) => ({ ...t, nome: true }))}
                error={field("nome")}
                placeholder="Maria Silva"
                autoComplete="name"
              />
            )}
            <Field
              id="email"
              label="E-mail"
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={email}
              onChange={setEmail}
              onBlur={() => setTouched((t) => ({ ...t, email: true }))}
              error={field("email")}
              placeholder="voce@email.com"
              autoComplete="email"
            />
            <Field
              id="senha"
              label="Senha"
              type="password"
              icon={<Lock className="h-4 w-4" />}
              value={senha}
              onChange={setSenha}
              onBlur={() => setTouched((t) => ({ ...t, senha: true }))}
              error={field("senha") ?? field("password")}
              placeholder="Mínimo de 8 caracteres"
              autoComplete={mode === "entrar" ? "current-password" : "new-password"}
            />
            {mode === "criar" && (
              <Field
                id="confirma"
                label="Confirmar senha"
                type="password"
                icon={<Lock className="h-4 w-4" />}
                value={confirma}
                onChange={setConfirma}
                onBlur={() => setTouched((t) => ({ ...t, confirma: true }))}
                error={field("confirma")}
                placeholder="Repita a senha"
                autoComplete="new-password"
              />
            )}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl gradient-primary text-sm font-semibold text-primary-foreground shadow-glow transition hover:brightness-105 active:scale-[0.99] disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === "entrar" ? "Entrar" : "Criar conta"}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            Ao continuar você concorda com o uso responsável da plataforma.
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  icon,
  type = "text",
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-erro` : undefined}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          className={`h-11 w-full rounded-xl border bg-card px-3 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:ring-2 focus:ring-ring/40 ${
            icon ? "pl-9" : ""
          } ${error ? "border-destructive focus:ring-destructive/30" : ""}`}
        />
      </div>
      {error && (
        <p id={`${id}-erro`} className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
