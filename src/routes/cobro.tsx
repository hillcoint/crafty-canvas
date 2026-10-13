import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Campo, Input, Panel, Select, Titulo, Vacio } from "@/components/field-ui";
import { calcularCobro, type Linea } from "@/lib/calc";
import { addDays, hoy, mxn, num } from "@/lib/dates";
import type { DB } from "@/lib/types";

export const Route = createFileRoute("/cobro")({
  head: () => ({
    meta: [
      { title: "Cobro volumen vs horas · M.I Maquinaria" },
      { name: "description", content: "Compara el cobro por m³ contra el cobro por horas de maquinaria en MXN." },
      { property: "og:title", content: "Cobro volumen vs horas · M.I Maquinaria" },
      { property: "og:description", content: "Desglose y diferencia en MXN entre ambos esquemas de cobro." },
    ],
  }),
  component: () => <AppShell>{(db) => <Cobro db={db} />}</AppShell>,
});

type Periodo = "mes" | "7" | "30" | "hoy" | "custom";

function rango(p: Periodo, desde: string, hasta: string): [string, string] {
  const h = hoy();
  if (p === "hoy") return [h, h];
  if (p === "7") return [addDays(h, -6), h];
  if (p === "30") return [addDays(h, -29), h];
  if (p === "mes") return [h.slice(0, 8) + "01", h];
  return [desde, hasta];
}

function Cobro({ db }: { db: DB }) {
  const [obra, setObra] = useState(db.seleccion.obraId || "todas");
  const [periodo, setPeriodo] = useState<Periodo>("30");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  useEffect(() => { setDesde(addDays(hoy(), -29)); setHasta(hoy()); }, []);

  const [d, h] = rango(periodo, desde, hasta);
  const c = calcularCobro(db, obra, d, h);
  const mayor = c.diferencia > 0 ? "volumen" : c.diferencia < 0 ? "horas" : "igual";

  return (
    <>
      <Panel>
        <Titulo>Cobro</Titulo>
        <div className="grid grid-cols-2 gap-3">
          <Campo label="Obra">
            <Select value={obra} onChange={(e) => setObra(e.target.value)}>
              <option value="todas">Todas las obras</option>
              {db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
            </Select>
          </Campo>
          <Campo label="Periodo">
            <Select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)}>
              <option value="hoy">Hoy</option>
              <option value="7">Últimos 7 días</option>
              <option value="30">Últimos 30 días</option>
              <option value="mes">Mes en curso</option>
              <option value="custom">Personalizado</option>
            </Select>
          </Campo>
          {periodo === "custom" && (
            <>
              <Campo label="Desde"><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></Campo>
              <Campo label="Hasta"><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></Campo>
            </>
          )}
        </div>
      </Panel>

      {c.tarifasPendientes.length > 0 && (
        <Panel className="border-2 border-destructive" >
          <p role="alert" className="text-sm font-semibold">
            Comparación incompleta: faltan tarifas para {Array.from(new Set(c.tarifasPendientes)).join(", ")}.
            Configúralas en Administración antes de tomar decisiones de cobro.
          </p>
        </Panel>
      )}
      <div className="grid grid-cols-2 gap-3">
        <Total label="Cobro por volumen" value={c.totalVol} win={mayor === "volumen"} />
        <Total label="Cobro por horas" value={c.totalHor} win={mayor === "horas"} />
      </div>
      <Panel className="border-2 border-primary">
        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Diferencia (MXN)</div>
        <div className="font-display text-4xl font-black text-primary">{mxn(c.diferencia)}</div>
        <p className="mt-1 font-semibold">
          {c.tarifasPendientes.length
            ? "Resultado provisional: hay conceptos sin tarifa."
            : mayor === "igual"
              ? "Ambos esquemas dan el mismo importe."
              : `El cobro por ${mayor} supera al otro en ${mxn(Math.abs(c.diferencia))}. Diferencia = volumen − horas.`}
        </p>
      </Panel>

      <Desglose titulo="Desglose por volumen" lineas={c.volLineas} />
      <Desglose titulo="Desglose por horas" lineas={c.horLineas} />
    </>
  );
}

function Total({ label, value, win }: { label: string; value: number; win: boolean }) {
  return (
    <div className={`rounded-xl border-2 p-3 ${win ? "border-primary bg-primary/15" : "border-border bg-card"}`}>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="font-display text-2xl font-bold">{mxn(value)}</div>
      {win && <div className="mt-1 inline-block rounded bg-primary px-2 py-0.5 text-[11px] font-bold uppercase text-primary-foreground">Mayor</div>}
    </div>
  );
}

function Desglose({ titulo, lineas }: { titulo: string; lineas: Linea[] }) {
  return (
    <Panel>
      <Titulo>{titulo}</Titulo>
      {lineas.length === 0 || lineas.every((l) => l.cantidad === 0) ? <Vacio>Sin registros en el periodo.</Vacio> : (
        <ul className="divide-y divide-border">
          {lineas.map((l, i) => (
            <li key={i} className="flex items-center justify-between gap-2 py-2 text-sm">
              <div className="min-w-0">
                <div className="truncate font-semibold">{l.concepto}</div>
                <div className="text-xs text-muted-foreground">
                  {num(l.cantidad)} {l.unidad} × {l.tarifa === null ? "sin tarifa" : `${mxn(l.tarifa)}/${l.unidad}`}
                </div>
              </div>
              <div className="shrink-0 font-display font-bold">{mxn(l.importe)}</div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
