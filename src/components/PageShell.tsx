import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";

export function PageShell({
  children,
  width = "default",
}: {
  children: ReactNode;
  width?: "default" | "wide";
}) {
  return (
    <div className="min-h-screen">
      <AppNav />
      <main
        className={`page-in mx-auto w-full px-4 py-10 sm:px-6 sm:py-14 ${
          width === "wide" ? "max-w-7xl" : "max-w-6xl"
        }`}
      >
        {children}
      </main>
    </div>
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
    <header className="reveal relative mb-10 overflow-hidden rounded-3xl border border-border/70 bg-card/60 p-6 shadow-card backdrop-blur-xl sm:mb-12 sm:p-8">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
        aria-hidden
      />
      <div className="relative grid gap-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <div className="min-w-0 space-y-2.5">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-[2.6rem] sm:leading-[1.08]">
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-card/50 px-6 py-14 text-center">
      {icon && (
        <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
