import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SelectorFrente } from "@/components/SelectorFrente";
import { Aviso, Btn, Campo, Input, Panel, Select, Titulo, Vacio } from "@/components/field-ui";
import { validarHorasMaquina, validarHorasVolquete } from "@/lib/calc";
import { actualizar, nuevoId } from "@/lib/store";
import { num } from "@/lib/dates";
import type { DB } from "@/lib/types";

export const Route = createFileRoute("/horas")({
  head: () => ({
    meta: [
      { title: "Horas de maquinaria · M.I Maquinaria" },
      { name: "description", content: "Horómetros de excavadoras y cargadores, y horas facturables de volquetes." },
      { property: "og:title", content: "Horas de maquinaria · M.I Maquinaria" },
      { property: "og:description", content: "Control de horómetros y horas facturables por día." },
    ],
  }),
  component: () => <AppShell>{(db) => <Horas db={db} />}</AppShell>,
});

type Msg = { tone: "ok" | "error"; text: string } | null;

function ultimoHorometro(db: DB, maquinaId: string, fecha: string): number | null {
  const regs = db.horas.filter((h) =>
    h.recurso === "maquina" && h.recursoId === maquinaId &&
    h.fecha <= fecha && h.horometroFinal !== null,
  );
  if (!regs.length) return null;
  const masReciente = [...regs].sort((a, b) => b.fecha.localeCompare(a.fecha) ||
    (b.horometroFinal ?? 0) - (a.horometroFinal ?? 0))[0];
  return masReciente.horometroFinal;
}

function Horas({ db }: { db: DB }) {
  const { frenteId, fecha } = db.seleccion;
  const frente = db.frentes.find((f) => f.id === frenteId);
  if (!frente) return (<><Panel><Titulo>Horas</Titulo><SelectorFrente db={db} /></Panel><Vacio>Selecciona un frente.</Vacio></>);

  const regs = db.horas.filter((h) => h.frenteId === frente.id && h.fecha === fecha);
  const nombre = (r: (typeof regs)[number]) =>
    r.recurso === "maquina" ? db.maquinas.find((m) => m.id === r.recursoId)?.nombre : db.volquetes.find((v) => v.id === r.recursoId)?.nombre;

  return (
    <>
      <Panel>
        <Titulo>Horas</Titulo>
        <SelectorFrente db={db} />
      </Panel>
      <FormMaquina db={db} frenteId={frente.id} fecha={fecha} key={`m-${frente.id}-${fecha}`} />
      <FormVolquete db={db} frenteId={frente.id} fecha={fecha} key={`v-${frente.id}-${fecha}`} />
      <Panel>
        <Titulo>Registros del día</Titulo>
        {regs.length === 0 ? <Vacio>Sin horas registradas para este frente y fecha.</Vacio> : (
          <ul className="space-y-2">
            {regs.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/40 p-3">
                <div className="min-w-0">
                  <div className="truncate font-bold">{nombre(r) ?? "(eliminado)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.recurso === "maquina" ? `Horómetro ${num(r.horometroInicial ?? 0)} → ${num(r.horometroFinal ?? 0)}` : "Horas facturables"}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="font-display text-xl font-bold">{num(r.horas)} h</span>
                  <Btn size="sm" variant="ghost" aria-label="Eliminar registro" onClick={() => window.confirm("¿Eliminar este registro de horas?") && actualizar((d) => ({ ...d, horas: d.horas.filter((x) => x.id !== r.id) }))}>✕</Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function FormMaquina({ db, frenteId, fecha }: { db: DB; frenteId: string; fecha: string }) {
  const frente = db.frentes.find((f) => f.id === frenteId)!;
  const ordenadas = [...db.maquinas].sort((a, b) => Number(frente.maquinaIds.includes(b.id)) - Number(frente.maquinaIds.includes(a.id)));
  const [maqId, setMaqId] = useState(ordenadas[0]?.id ?? "");
  const ult = maqId ? ultimoHorometro(db, maqId, fecha) : null;
  const [ini, setIni] = useState(ult !== null ? String(ult) : "");
  const [fin, setFin] = useState("");
  const [msg, setMsg] = useState<Msg>(null);
  const calc = ini !== "" && fin !== "" ? validarHorasMaquina(db, maqId, fecha, Number(ini), Number(fin)) : null;

  function guardar() {
    const r = validarHorasMaquina(db, maqId, fecha, Number(ini), Number(fin));
    if (ini === "" || fin === "") return setMsg({ tone: "error", text: "Captura horómetro inicial y final." });
    if (!maqId) return setMsg({ tone: "error", text: "Selecciona una máquina." });
    if (!r.ok) return setMsg({ tone: "error", text: r.error });
    if (!frente.maquinaIds.includes(maqId) && !window.confirm("Esta máquina no está asignada al frente. ¿Registrar de todos modos?")) return;
    actualizar((d) => ({
      ...d,
      horas: [...d.horas, { id: nuevoId("h"), recurso: "maquina", recursoId: maqId, frenteId, fecha, horometroInicial: Number(ini), horometroFinal: Number(fin), horas: r.horas, tarifaClave: d.maquinas.find((m) => m.id === maqId)?.tipo === "excavadora" ? (d.maquinas.find((m) => m.id === maqId)!.toneladas >= 30 ? "hr_exc30" : "hr_exc20") : "hr_cargador" }],
    }));
    setMsg({ tone: "ok", text: `Guardado: ${num(r.horas)} h` });
    setIni(fin);
    setFin("");
  }

  return (
    <Panel>
      <Titulo>Excavadoras y cargadores</Titulo>
      {db.maquinas.length === 0 ? <Vacio>No hay maquinaria registrada.</Vacio> : (
        <div className="space-y-3">
          <Campo label="Máquina">
            <Select value={maqId} onChange={(e) => { setMaqId(e.target.value); const u = ultimoHorometro(db, e.target.value, fecha); setIni(u !== null ? String(u) : ""); setMsg(null); }}>
              {ordenadas.map((m) => <option key={m.id} value={m.id}>{m.nombre} · {m.tipo} {m.toneladas} t{frente.maquinaIds.includes(m.id) ? " (asignada)" : ""}</option>)}
            </Select>
          </Campo>
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Horómetro inicial"><Input type="number" inputMode="decimal" step="0.1" min="0" value={ini} onChange={(e) => setIni(e.target.value)} /></Campo>
            <Campo label="Horómetro final"><Input type="number" inputMode="decimal" step="0.1" min="0" value={fin} onChange={(e) => setFin(e.target.value)} /></Campo>
          </div>
          <div className={`rounded-lg p-3 text-center font-display text-2xl font-bold ${calc && !calc.ok ? "bg-destructive/20 text-destructive" : "bg-background/40"}`}>
            {calc ? (calc.ok ? `${num(calc.horas)} h` : calc.error) : "Horas = final − inicial"}
          </div>
          <Btn className="w-full" size="lg" onClick={guardar}>Guardar horas</Btn>
          {msg && <Aviso tone={msg.tone}>{msg.text}</Aviso>}
        </div>
      )}
    </Panel>
  );
}

function FormVolquete({ db, frenteId, fecha }: { db: DB; frenteId: string; fecha: string }) {
  const frente = db.frentes.find((f) => f.id === frenteId)!;
  const ordenados = [...db.volquetes].sort((a, b) => Number(frente.volqueteIds.includes(b.id)) - Number(frente.volqueteIds.includes(a.id)));
  const [vid, setVid] = useState(ordenados[0]?.id ?? "");
  const [h, setH] = useState("");
  const [msg, setMsg] = useState<Msg>(null);

  function guardar() {
    if (h === "" || !vid) return setMsg({ tone: "error", text: "Selecciona el volquete y captura sus horas facturables." });
    const validacion = validarHorasVolquete(db, vid, frenteId, fecha, Number(h));
    if (!validacion.ok) return setMsg({ tone: "error", text: validacion.error });
    if (!frente.volqueteIds.includes(vid) && !window.confirm("Este volquete no está asignado al frente. ¿Registrar de todos modos?")) return;
    actualizar((d) => ({ ...d, horas: [...d.horas, { id: nuevoId("h"), recurso: "volquete", recursoId: vid, frenteId, fecha, horometroInicial: null, horometroFinal: null, horas: validacion.horas, tarifaClave: `hr_volq${d.volquetes.find((v) => v.id === vid)?.capacidad ?? ""}` }] }));
    setMsg({ tone: "ok", text: `Guardado: ${num(validacion.horas)} h facturables` });
    setH("");
  }

  return (
    <Panel>
      <Titulo>Volquetes · horas facturables</Titulo>
      <p className="mb-3 text-xs text-muted-foreground">Independiente del número de viajes registrados.</p>
      {db.volquetes.length === 0 ? <Vacio>No hay volquetes registrados.</Vacio> : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Campo label="Volquete">
              <Select value={vid} onChange={(e) => setVid(e.target.value)}>
                {ordenados.map((v) => <option key={v.id} value={v.id}>{v.nombre} · {v.capacidad} m³</option>)}
              </Select>
            </Campo>
            <Campo label="Horas facturables"><Input type="number" inputMode="decimal" step="0.5" min="0" value={h} onChange={(e) => setH(e.target.value)} /></Campo>
          </div>
          <Btn className="w-full" variant="outline" onClick={guardar}>Guardar horas volquete</Btn>
          {msg && <Aviso tone={msg.tone}>{msg.text}</Aviso>}
        </div>
      )}
    </Panel>
  );
}
