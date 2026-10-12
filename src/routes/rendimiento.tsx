import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SelectorFrente } from "@/components/SelectorFrente";
import { Panel, Stat, Titulo, Vacio } from "@/components/field-ui";
import { rendimientoFrente, UMBRAL_ALERTA } from "@/lib/calc";
import { num } from "@/lib/dates";
import { TIPO_FRENTE_LABEL, type DB } from "@/lib/types";

export const Route = createFileRoute("/rendimiento")({
  head: () => ({
    meta: [
      { title: "Rendimiento diario · M.I Maquinaria" },
      { name: "description", content: "m³ por hora de excavadora frente al rendimiento esperado, con alertas por debajo del 80%." },
      { property: "og:title", content: "Rendimiento diario · M.I Maquinaria" },
      { property: "og:description", content: "Rendimiento real vs esperado por frente y equipo." },
    ],
  }),
  component: () => <AppShell>{(db) => <Rendimiento db={db} />}</AppShell>,
});

function Rendimiento({ db }: { db: DB }) {
  const { obraId, fecha } = db.seleccion;
  const frentes = db.frentes.filter((f) => f.obraId === obraId);

  return (
    <>
      <Panel>
        <Titulo>Rendimiento diario</Titulo>
        <SelectorFrente db={db} conFrente={false} />
      </Panel>
      {frentes.length === 0 && <Vacio>Esta obra no tiene frentes.</Vacio>}
      {frentes.map((f) => {
        const r = rendimientoFrente(db, fecha, f);
        const pct = r.ratio !== null ? Math.round(r.ratio * 100) : null;
        return (
          <Panel key={f.id} className={r.alerta ? "border-2 border-destructive" : ""}>
            <div className="mb-3">
              <div className="text-xs font-bold uppercase tracking-widest text-primary">{TIPO_FRENTE_LABEL[f.tipo]}</div>
              <h3 className="font-display text-lg font-bold">{f.nombre}</h3>
            </div>
            {r.alerta && (
              <div role="alert" className="mb-3 rounded-lg bg-destructive p-3 font-display text-lg font-bold uppercase text-destructive-foreground">
                ⚠ Rendimiento al {pct}% del esperado (mínimo {UMBRAL_ALERTA * 100}%)
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <Stat label="m³" value={num(r.volumen, 0)} />
              <Stat label="Viajes" value={r.viajes} />
              <Stat label="Horas excavadora" value={num(r.horasExc)} />
              <Stat
                label="m³/h real"
                value={r.real === null ? "—" : num(r.real, 0)}
                sub={r.esperado ? `Esperado ${num(r.esperado, 0)} · ${pct}%` : r.volumen > 0 ? "Sin horas de excavadora" : "Sin datos"}
                tone={r.alerta ? "alert" : r.ratio !== null ? "ok" : undefined}
              />
            </div>
            {r.ratio !== null && (
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-background">
                <div className={`h-full ${r.alerta ? "bg-destructive" : "bg-success"}`} style={{ width: `${Math.min(100, r.ratio * 100)}%` }} />
              </div>
            )}
            <h4 className="mb-1 mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Viajes por unidad</h4>
            {r.porUnidad.length === 0 ? <p className="text-sm text-muted-foreground">Sin viajes.</p> : (
              <ul className="divide-y divide-border text-sm">
                {r.porUnidad.map((u) => (
                  <li key={u.volquete.id} className="flex justify-between py-2">
                    <span>{u.volquete.nombre}</span>
                    <span className="font-bold">{u.viajes} · {num(u.m3, 0)} m³</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        );
      })}
    </>
  );
}
