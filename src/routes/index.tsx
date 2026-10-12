import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { SelectorFrente } from "@/components/SelectorFrente";
import { Panel, Stat, Titulo, Vacio } from "@/components/field-ui";
import { rendimientoFrente, viajesDelDia, sumaM3 } from "@/lib/calc";
import { actualizar } from "@/lib/store";
import { fechaLarga, num } from "@/lib/dates";
import { TIPO_FRENTE_LABEL, type DB } from "@/lib/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Frentes de obra · M.I Maquinaria" },
      { name: "description", content: "Resumen diario de viajes, m³ y maquinaria asignada por frente de obra." },
      { property: "og:title", content: "Frentes de obra · M.I Maquinaria" },
      { property: "og:description", content: "Resumen diario de viajes, m³ y maquinaria por frente." },
    ],
  }),
  component: () => <AppShell>{(db) => <Inicio db={db} />}</AppShell>,
});

function Inicio({ db }: { db: DB }) {
  const { obraId, fecha, frenteId } = db.seleccion;
  const frentes = db.frentes.filter((f) => f.obraId === obraId);
  const vsObra = viajesDelDia(db, fecha).filter((v) => v.obraId === obraId);

  return (
    <>
      <Panel>
        <Titulo>Frente de trabajo</Titulo>
        <SelectorFrente db={db} />
      </Panel>

      <div className="grid grid-cols-2 gap-3">
        <Stat label={`Viajes obra · ${fechaLarga(fecha)}`} value={vsObra.length} />
        <Stat label="m³ obra" value={num(sumaM3(vsObra), 0)} />
      </div>

      {frentes.length === 0 && <Vacio>Esta obra no tiene frentes. Créalos en Administración.</Vacio>}

      {frentes.map((f) => {
        const r = rendimientoFrente(db, fecha, f);
        const maqs = f.maquinaIds.map((id) => db.maquinas.find((m) => m.id === id)).filter(Boolean);
        const vols = f.volqueteIds.map((id) => db.volquetes.find((v) => v.id === id)).filter(Boolean);
        const sel = f.id === frenteId;
        return (
          <Panel key={f.id} className={sel ? "border-2 border-primary" : ""}>
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-xs font-bold uppercase tracking-widest text-primary">{TIPO_FRENTE_LABEL[f.tipo]}</div>
                <h3 className="font-display text-lg font-bold leading-tight">{f.nombre}</h3>
              </div>
              {r.alerta && <span className="shrink-0 rounded bg-destructive px-2 py-1 text-xs font-bold uppercase text-destructive-foreground">Bajo rendimiento</span>}
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label="Viajes" value={r.viajes} />
              <Stat label="m³" value={num(r.volumen, 0)} />
              <Stat label="m³/h" value={r.real === null ? "—" : num(r.real, 0)} tone={r.alerta ? "alert" : undefined} />
            </div>
            <div className="mt-3 space-y-1 text-sm">
              <p><span className="text-muted-foreground">Maquinaria: </span>{maqs.length ? maqs.map((m) => `${m!.nombre} (${m!.toneladas} t)`).join(", ") : "Sin asignar"}</p>
              <p><span className="text-muted-foreground">Volquetes: </span>{vols.length ? vols.map((v) => `${v!.nombre} · ${v!.capacidad} m³`).join(", ") : "Sin asignar"}</p>
            </div>
            <div className="mt-3 flex gap-2">
              <Link
                to="/viajes"
                onClick={() => actualizar((d) => ({ ...d, seleccion: { ...d.seleccion, frenteId: f.id } }))}
                className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-primary font-display font-bold uppercase text-primary-foreground"
              >
                Registrar viajes
              </Link>
              <Link
                to="/horas"
                onClick={() => actualizar((d) => ({ ...d, seleccion: { ...d.seleccion, frenteId: f.id } }))}
                className="flex min-h-12 flex-1 items-center justify-center rounded-lg bg-secondary font-display font-bold uppercase text-secondary-foreground"
              >
                Horas
              </Link>
            </div>
          </Panel>
        );
      })}
    </>
  );
}
