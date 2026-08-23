import { Link, useRouterState } from "@tanstack/react-router";
import {
  Hand,
  MessagesSquare,
  Languages,
  Library,
  GraduationCap,
  BookOpen,
  Stethoscope,
  Sparkles,
  LayoutGrid,
  Moon,
  Sun,
  Menu,
  X,
  UserRound,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useEffect, useState, type ComponentType, type ReactNode } from "react";
import { useSession } from "@/hooks/use-session";

type NavItem = {
  to: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  hint?: string;
};

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Operação",
    items: [
      { to: "/", label: "Painel", icon: LayoutGrid, hint: "Visão geral" },
      { to: "/conversa", label: "Conversa", icon: MessagesSquare, hint: "Libras → Português" },
      { to: "/traduzir", label: "Traduzir", icon: Languages, hint: "Português → Libras" },
      { to: "/lia", label: "Lia", icon: Sparkles, hint: "Intérprete virtual" },
    ],
  },
  {
    label: "Conhecimento",
    items: [
      { to: "/biblioteca", label: "Biblioteca", icon: Library, hint: "Banco de sinais" },
      { to: "/aprender", label: "Aprender", icon: GraduationCap, hint: "Trilhas e quiz" },
    ],
  },
  {
    label: "Institucional",
    items: [
      { to: "/educacao", label: "Educação", icon: BookOpen, hint: "Aulas acessíveis" },
      { to: "/hospital", label: "Hospital", icon: Stethoscope, hint: "Comunicação clínica" },
    ],
  },
];

const ALL_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

function useIsActive() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return {
    pathname,
    isActive: (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to)),
  };
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="group flex items-center gap-3 outline-none">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl gradient-primary shadow-glow transition-transform duration-300 group-hover:scale-105">
        <Hand className="h-4 w-4 text-primary-foreground" />
      </div>
      {!compact && (
        <span className="min-w-0 truncate font-display text-[15px] font-extrabold tracking-tight">
          LibrasLive <span className="text-primary">AI</span>
        </span>
      )}
    </Link>
  );
}

function NavList({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { isActive } = useIsActive();
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Navegação principal">
      {NAV_GROUPS.map((group) => (
        <div key={group.label}>
          {collapsed ? (
            <div className="mx-3 my-3 h-px bg-border/70" aria-hidden />
          ) : (
            <p className="rail-label">{group.label}</p>
          )}
          <ul className="space-y-0.5 px-2">
            {group.items.map((item) => {
              const active = isActive(item.to);
              const Icon = item.icon;
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={`nav-link ${active ? "nav-link-active" : ""} ${collapsed ? "justify-center px-0" : ""}`}
                  >
                    {active && !collapsed && (
                      <span
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary"
                        aria-hidden
                      />
                    )}
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    {!collapsed && (
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate leading-tight">{item.label}</span>
                        {item.hint && (
                          <span className="truncate text-[11px] font-normal text-muted-foreground/70">
                            {item.hint}
                          </span>
                        )}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function AccountCard({ collapsed }: { collapsed: boolean }) {
  const { user } = useSession();
  if (!user) {
    return (
      <Link
        to="/auth"
        className={`btn-primary w-full ${collapsed ? "px-0" : ""}`}
        aria-label="Entrar na plataforma"
      >
        <LogIn className="h-4 w-4" />
        {!collapsed && <span>Entrar</span>}
      </Link>
    );
  }
  return (
    <Link
      to="/conta"
      className={`flex items-center gap-3 rounded-2xl border border-border/70 bg-card/70 p-2.5 transition hover:border-primary/40 hover:bg-accent ${
        collapsed ? "justify-center" : ""
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/15 text-primary">
        <UserRound className="h-4 w-4" />
      </span>
      {!collapsed && (
        <span className="min-w-0">
          <span className="block truncate text-xs font-bold">{user.email ?? "Minha conta"}</span>
          <span className="block truncate text-[11px] text-primary">Configurações da conta</span>
        </span>
      )}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { pathname } = useIsActive();

  useEffect(() => {
    const stored = typeof window !== "undefined" ? window.localStorage.getItem("ll-theme") : null;
    if (stored === "light") setDark(false);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      window.localStorage.setItem("ll-theme", dark ? "dark" : "light");
    } catch {
      /* ignore */
    }
  }, [dark]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const current = ALL_ITEMS.find((i) => (i.to === "/" ? pathname === "/" : pathname.startsWith(i.to)));

  return (
    <div className="flex min-h-dvh w-full">
      {/* Sidebar desktop */}
      <aside
        className={`sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-border/70 bg-card/60 backdrop-blur-2xl transition-[width] duration-300 lg:flex ${
          collapsed ? "w-[76px]" : "w-[264px]"
        }`}
      >
        <div className={`flex h-16 items-center border-b border-border/60 px-4 ${collapsed ? "justify-center" : ""}`}>
          <Brand compact={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <NavList collapsed={collapsed} />
        </div>

        <div className="space-y-2 border-t border-border/60 p-3">
          <AccountCard collapsed={collapsed} />
          <button
            onClick={() => setCollapsed((c) => !c)}
            className={`btn-ghost h-9 w-full text-xs ${collapsed ? "px-0" : ""}`}
            aria-label={collapsed ? "Expandir menu lateral" : "Recolher menu lateral"}
          >
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
            {!collapsed && <span>Recolher</span>}
          </button>
        </div>
      </aside>

      {/* Coluna principal */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
          <div className="grid h-16 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <button
                onClick={() => setMobileOpen(true)}
                aria-label="Abrir menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card transition hover:bg-accent lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>
              <div className="lg:hidden">
                <Brand compact />
              </div>
              <div className="hidden min-w-0 items-center gap-2 text-sm lg:flex">
                <span className="text-muted-foreground">LibrasLive</span>
                <span className="h-1 w-1 rounded-full bg-muted-foreground/40" aria-hidden />
                <span className="truncate font-display font-bold">{current?.label ?? "Painel"}</span>
              </div>
            </div>

            <div className="min-w-0 justify-self-center">
              <span className="badge-live hidden sm:inline-flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" aria-hidden />
                IA de tradução ativa
              </span>
            </div>

            <div className="flex items-center gap-2 justify-self-end">
              <button
                onClick={() => setDark((d) => !d)}
                aria-label={dark ? "Ativar modo claro" : "Ativar modo escuro"}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
              <Link to="/conversa" className="btn-primary hidden h-9 sm:inline-flex">
                <MessagesSquare className="h-4 w-4" />
                Nova sessão
              </Link>
            </div>
          </div>
        </header>

        <main className="page-in min-w-0 flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>

        <footer className="border-t border-border/60 bg-card/40 px-4 py-6 text-xs text-muted-foreground sm:px-6">
          <div className="section-shell grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <p>
              LibrasLive AI · Ecossistema de acessibilidade em Libras · Avatar oficial VLibras do Governo Federal
            </p>
            <p className="sm:text-right">Conformidade LBI · Lei 13.146/2015</p>
          </div>
        </footer>
      </div>

      {/* Drawer mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            aria-label="Fechar menu"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-[82%] max-w-[300px] flex-col border-r border-border/70 bg-card shadow-pop">
            <div className="flex h-16 items-center justify-between border-b border-border/60 px-4">
              <Brand />
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 transition hover:bg-accent"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-2">
              <NavList collapsed={false} onNavigate={() => setMobileOpen(false)} />
            </div>
            <div className="border-t border-border/60 p-3">
              <AccountCard collapsed={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
