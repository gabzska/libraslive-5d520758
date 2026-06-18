import { Link } from "@tanstack/react-router";
import { Hand, Moon, Sun } from "lucide-react";
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
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-xl gradient-primary shadow-glow">
            <Hand className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="leading-tight">
            <p className="font-display text-base font-bold tracking-tight">
              LibrasLive <span className="text-primary">AI</span>
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-full px-3 py-1.5 text-sm font-medium bg-primary/10 text-primary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={() => setDark((d) => !d)}
          aria-label="Alternar modo escuro"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border bg-card/70 transition hover:bg-accent"
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>

      {/* mobile nav */}
      <nav className="flex items-center gap-1 overflow-x-auto border-t bg-card/60 px-3 py-2 md:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className="whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent"
            activeProps={{ className: "whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium bg-primary/15 text-primary" }}
            activeOptions={{ exact: l.to === "/" }}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
