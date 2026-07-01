import { Link, useRouterState } from "@tanstack/react-router";
import { Hand, Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  // Close mobile menu on route change
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));

  return (
    <header className="sticky top-0 z-40 border-b bg-background/75 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5 transition-transform hover:scale-[1.02]">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow">
            <Hand className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight">
              LibrasLive <span className="text-primary">AI</span>
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex" aria-label="Navegação principal">
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
                {active && (
                  <span
                    aria-hidden
                    className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDark((d) => !d)}
            aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/70 transition hover:bg-accent"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Fechar menu" : "Abrir menu"}
            aria-expanded={open}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/70 transition hover:bg-accent md:hidden"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* mobile menu — expansível */}
      <nav
        className={`overflow-hidden border-t bg-card/70 backdrop-blur md:hidden ${
          open ? "max-h-[420px]" : "max-h-0"
        } transition-[max-height] duration-300 ease-out`}
        aria-label="Navegação móvel"
      >
        <ul className="grid grid-cols-2 gap-1 p-3">
          {LINKS.map((l) => {
            const active = isActive(l.to);
            return (
              <li key={l.to}>
                <Link
                  to={l.to}
                  className={`block rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                    active
                      ? "bg-primary/15 text-primary"
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
