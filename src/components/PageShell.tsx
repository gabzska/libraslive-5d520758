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
        className={`page-in mx-auto w-full px-4 py-8 sm:px-6 sm:py-12 ${
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
    <header className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {eyebrow && (
          <span className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium tracking-wide text-primary">
            {eyebrow}
          </span>
        )}
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
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
