import { Link, useLocation } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { HardHat, Truck, Gauge, TrendingUp, Receipt, Settings } from "lucide-react";
import { useDB, useStorageOk } from "@/lib/store";
import type { DB } from "@/lib/types";

const NAV = [
  { to: "/", label: "Frentes", icon: HardHat },
  { to: "/viajes", label: "Viajes", icon: Truck },
  { to: "/horas", label: "Horas", icon: Gauge },
  { to: "/rendimiento", label: "Rendim.", icon: TrendingUp },
  { to: "/cobro", label: "Cobro", icon: Receipt },
] as const;

export function AppShell({ children }: { children: (db: DB) => ReactNode }) {
  const db = useDB();
  const ok = useStorageOk();
  const { pathname } = useLocation();

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col bg-background">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-primary font-display text-lg font-black text-primary-foreground">MI</span>
          <span className="font-display text-lg font-bold uppercase leading-none tracking-wide">
            M.I Maquinaria
            <span className="block text-[10px] font-medium tracking-[0.2em] text-muted-foreground">Control de campo</span>
          </span>
        </Link>
        <Link to="/admin" aria-label="Administración" className="grid h-11 w-11 place-items-center rounded-lg bg-secondary text-secondary-foreground">
          <Settings className="h-5 w-5" />
        </Link>
      </header>

      {db && !ok && (
        <div className="m-4 mb-0 rounded-lg border-2 border-destructive bg-destructive/15 p-3 text-sm font-medium">
          El almacenamiento del navegador está bloqueado. Los registros NO se guardarán al recargar. Desactiva el modo privado o permite el almacenamiento local.
        </div>
      )}

      <main className="min-w-0 flex-1 space-y-4 p-4 pb-32">
        {db ? children(db) : <div className="py-20 text-center text-muted-foreground">Cargando datos…</div>}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]">
        <ul className="mx-auto grid max-w-3xl grid-cols-5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <li key={to}>
                <Link
                  to={to}
                  className={`flex min-h-16 min-w-0 flex-col items-center justify-center gap-1 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide ${active ? "text-primary" : "text-muted-foreground"}`}
                >
                  <Icon className="h-6 w-6" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
