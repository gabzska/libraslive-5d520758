import { Link, useRouterState } from "@tanstack/react-router";
import { Hand, Moon, Sun, Menu, X, UserRound, LogIn } from "lucide-react";
import { useEffect, useState } from "react";
import { useSession } from "@/hooks/use-session";

const LINKS = [
  { to: "/", label: "Início" },
  { to: "/lia", label: "Lia" },
  { to: "/conversa", label: "Conversa" },
  { to: "/traduzir", label: "Traduzir" },
  { to: "/biblioteca", label: "Biblioteca" },
  { to: "/aprender", label: "Aprender" },
  { to: "/educacao", label: "Educação" },
  { to: "/hospital", label: "Hospital" },
] as const;

export function AppNav() {
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { user } = useSession();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg gradient-primary shadow-glow">
            <Hand className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="font-display text-[15px] font-bold tracking-tight">
            LibrasLive <span className="text-primary">AI</span>
          </span>
        </Link>

        <nav
          className="mx-auto hidden items-center gap-0.5 rounded-xl border border-border/70 bg-muted/60 p-1 lg:flex"
          aria-label="Navegação principal"
        >
          {LINKS.map((l) => {
            const active = isActive(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
                aria-current={active ? "page" : undefined}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {user ? (
            <Link
              to="/conta"
              aria-label="Minha conta"
              className="inline-flex h-9 items-center gap-2 rounded-lg border bg-card px-3 text-sm font-medium transition hover:bg-accent"
            >
              <UserRound className="h-4 w-4" />
              <span className="hidden sm:inline">Conta</span>
            </Link>
          ) : (
            <Link
              to="/auth"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-glow transition hover:bg-primary/90"
            >
              <LogIn className="h-4 w-4" />
              <span className="hidden sm:inline">Entrar</span>
            </Link>
          )}
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-card transition hover:bg-accent lg:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <nav
        className={`overflow-hidden border-t border-border/70 bg-background/95 backdrop-blur lg:hidden ${
          open ? "max-h-[440px]" : "max-h-0"
        } transition-[max-height] duration-300 ease-out`}
        aria-label="Navegação móvel"
      >
        <ul className="grid grid-cols-2 gap-1 p-3 sm:grid-cols-3">
          {LINKS.map((l) => {
            const active = isActive(l.to);
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`block rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
