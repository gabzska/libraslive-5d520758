import type { ReactNode } from "react";
import { AppShell } from "@/components/AppShell";

export function PageShell({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "default" | "wide";
}) {
  return (
    <AppShell>
      <div className={`mx-auto w-full ${width === "wide" ? "max-w-[1400px]" : "max-w-6xl"}`}>
        {children}
      </div>
    </AppShell>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="reveal relative mb-8 overflow-hidden rounded-3xl border border-border/60 bg-card/60 p-6 shadow-card backdrop-blur-2xl sm:mb-10 sm:p-8">
      <div className="pointer-events-none absolute inset-0 grid-fade opacity-40" aria-hidden />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-primary/20 blur-[90px] aurora"
        aria-hidden
      />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="min-w-0 space-y-3">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="font-display text-[1.9rem] font-extrabold leading-[1.08] tracking-tight sm:text-[2.6rem]">
            {title}
          </h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              {description}
            </p>
          )}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </header>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center backdrop-blur">
      {icon && (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-primary/12 text-primary ring-soft">
          {icon}
        </div>
      )}
      <p className="font-display text-base font-bold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "primary" | "success";
}) {
  const toneClass =
    tone === "primary" ? "text-gradient" : tone === "success" ? "text-[var(--success)]" : "text-foreground";
  return (
    <div className="surface-interactive p-5">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`stat-value mt-1.5 ${toneClass}`}>{value}</p>
      {hint && <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground/80">{hint}</p>}
    </div>
  );
}
