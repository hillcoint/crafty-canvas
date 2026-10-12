import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes, SelectHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-border bg-card p-4", className)}>{children}</section>;
}

export function Titulo({ children, extra }: { children: ReactNode; extra?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="font-display text-xl font-bold uppercase tracking-wide text-foreground">{children}</h2>
      {extra}
    </div>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "outline"; size?: "md" | "lg" | "sm" };
export function Btn({ variant = "primary", size = "md", className, ...p }: BtnProps) {
  return (
    <button
      {...p}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-display font-bold uppercase tracking-wide transition-transform active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none",
        size === "lg" && "min-h-16 px-6 text-xl",
        size === "md" && "min-h-12 px-4 text-base",
        size === "sm" && "min-h-10 px-3 text-sm",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "outline" && "border-2 border-primary text-primary",
        variant === "ghost" && "bg-secondary text-secondary-foreground",
        variant === "danger" && "bg-destructive text-destructive-foreground",
        className,
      )}
    />
  );
}

export function Campo({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

const inputCls =
  "min-h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/40";

export function Input(p: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className={cn(inputCls, p.className)} />;
}

export function Select(p: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...p} className={cn(inputCls, "appearance-auto", p.className)} />;
}

export function Stat({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode | undefined; tone?: "alert" | "ok" | undefined }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-background/40 p-3",
        tone === "alert" && "border-destructive bg-destructive/15",
        tone === "ok" && "border-success/60",
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold leading-tight text-foreground">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Aviso({ tone = "info", children }: { tone?: "info" | "error" | "ok"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-lg border-2 p-3 text-sm font-medium",
        tone === "error" && "border-destructive bg-destructive/15 text-foreground",
        tone === "ok" && "border-success bg-success/15 text-foreground",
        tone === "info" && "border-primary/50 bg-primary/10 text-foreground",
      )}
    >
      {children}
    </div>
  );
}
