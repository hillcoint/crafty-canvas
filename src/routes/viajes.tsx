import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { SelectorFrente } from "@/components/SelectorFrente";
import { Aviso, Btn, Campo, Input, Panel, Select, Stat, Titulo, Vacio } from "@/components/field-ui";
import { conflictoViaje, MIN_ENTRE_VIAJES, sumaM3, viajesDelDia } from "@/lib/calc";
import { actualizar, nuevoId } from "@/lib/store";
import { horaDeISO, num, toLocalInput, hoy } from "@/lib/dates";
import type { DB, Viaje } from "@/lib/types";

export const Route = createFileRoute("/viajes")({
  head: () => ({
    meta: [
      { title: "Registro de viajes · M.I Maquinaria" },
      { name: "description", content: "Registra salidas de volquetes por frente con control de 10 minutos entre viajes." },
      { property: "og:title", content: "Registro de viajes · M.I Maquinaria" },
      { property: "og:description", content: "Salidas de volquetes, conteo por unidad y m³ del día." },
    ],
  }),
  component: () => <AppShell>{(db) => <Viajes db={db} />}</AppShell>,
});

type Msg = { tone: "ok" | "error"; text: string } | null;

function Viajes({ db }: { db: DB }) {
  const { frenteId, fecha } = db.seleccion;
  const frente = db.frentes.find((f) => f.id === frenteId);
  const asignados = frente ? frente.volqueteIds.map((id) => db.volquetes.find((v) => v.id === id)).filter((v) => !!v) : [];
  const otros = db.volquetes.filter((v) => !frente?.volqueteIds.includes(v.id));
  const [volqueteId, setVolqueteId] = useState("");
  const [momento, setMomento] = useState("");
  const [usarAhora, setUsarAhora] = useState(true);
  const [msg, setMsg] = useState<Msg>(null);
  const [editando, setEditando] = useState<string | null>(null);

  useEffect(() => {
    if (!asignados.some((v) => v.id === volqueteId)) setVolqueteId(asignados[0]?.id ?? db.volquetes[0]?.id ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frenteId]);

  useEffect(() => {
    setMomento(toLocalInput(new Date()));
  }, []);

  const viajes = frente ? viajesDelDia(db, fecha, frente.id).sort((a, b) => b.fechaHora.localeCompare(a.fechaHora)) : [];
  const conteo = new Map<string, number>();
  viajes.forEach((v) => conteo.set(v.volqueteId, (conteo.get(v.volqueteId) ?? 0) + 1));

  function registrar() {
    if (!frente) return setMsg({ tone: "error", text: "Selecciona un frente." });
    const vol = db.volquetes.find((v) => v.id === volqueteId);
    if (!vol) return setMsg({ tone: "error", text: "Selecciona un volquete." });
    const cuando = usarAhora ? new Date() : new Date(momento);
    if (Number.isNaN(cuando.getTime())) return setMsg({ tone: "error", text: "Fecha/hora inválida." });
    const choque = conflictoViaje(db, vol.id, cuando);
    if (choque) {
      const fr = db.frentes.find((f) => f.id === choque.frenteId);
      return setMsg({
        tone: "error",
        text: `Bloqueado: ${vol.nombre} ya registró una salida a las ${horaDeISO(choque.fechaHora)} en ${fr?.nombre ?? "otro frente"}. Deben pasar al menos ${MIN_ENTRE_VIAJES} min entre viajes.`,
      });
    }
    const viaje: Viaje = { id: nuevoId("v"), volqueteId: vol.id, frenteId: frente.id, obraId: frente.obraId, fechaHora: cuando.toISOString(), capacidad: vol.capacidad };
    actualizar((d) => ({ ...d, viajes: [...d.viajes, viaje] }));
    setMsg({ tone: "ok", text: `Salida registrada: ${vol.nombre} · ${horaDeISO(viaje.fechaHora)} · +${vol.capacidad} m³` });
    setMomento(toLocalInput(new Date()));
  }

  return (
    <>
      <Panel>
        <Titulo>Viajes</Titulo>
        <SelectorFrente db={db} />
      </Panel>

      {!frente ? (
        <Vacio>Selecciona una obra con frentes para registrar viajes.</Vacio>
      ) : (
        <>
          <Panel>
            <Titulo>Registrar salida</Titulo>
            {db.volquetes.length === 0 ? (
              <Vacio>No hay volquetes. Agrégalos en Administración.</Vacio>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {asignados.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVolqueteId(v.id)}
                      className={`min-h-16 rounded-lg border-2 p-2 text-left ${volqueteId === v.id ? "border-primary bg-primary/15" : "border-border bg-background/40"}`}
                    >
                      <div className="font-display font-bold leading-tight">{v.nombre}</div>
                      <div className="text-xs text-muted-foreground">{v.capacidad} m³ · {conteo.get(v.id) ?? 0} viajes hoy</div>
                    </button>
                  ))}
                </div>
                {otros.length > 0 && (
                  <Campo label="Otro volquete (no asignado)">
                    <Select value={asignados.some((v) => v.id === volqueteId) ? "" : volqueteId} onChange={(e) => e.target.value && setVolqueteId(e.target.value)}>
                      <option value="">— Elegir —</option>
                      {otros.map((v) => <option key={v.id} value={v.id}>{v.nombre} · {v.capacidad} m³</option>)}
                    </Select>
                  </Campo>
                )}
                <label className="flex min-h-12 items-center gap-3 text-sm">
                  <input type="checkbox" className="h-6 w-6 accent-primary" checked={usarAhora} onChange={(e) => setUsarAhora(e.target.checked)} />
                  Usar fecha y hora actual
                </label>
                {!usarAhora && (
                  <Campo label="Fecha y hora de salida">
                    <Input type="datetime-local" value={momento} onChange={(e) => setMomento(e.target.value)} />
                  </Campo>
                )}
                <Btn size="lg" className="w-full" onClick={registrar}>Registrar salida</Btn>
                {msg && <Aviso tone={msg.tone}>{msg.text}</Aviso>}
                {usarAhora && fecha !== hoy() && <Aviso>La salida se registra con la fecha de hoy; la lista muestra el día seleccionado.</Aviso>}
              </div>
            )}
          </Panel>

          <div className="grid grid-cols-2 gap-3">
            <Stat label="Viajes del día" value={viajes.length} />
            <Stat label="m³ del día" value={num(sumaM3(viajes), 0)} />
          </div>

          <Panel>
            <Titulo>Conteo por unidad</Titulo>
            {conteo.size === 0 ? <Vacio>Sin viajes este día.</Vacio> : (
              <ul className="divide-y divide-border">
                {[...conteo.entries()].map(([id, n]) => {
                  const v = db.volquetes.find((x) => x.id === id);
                  const m3 = sumaM3(viajes.filter((x) => x.volqueteId === id));
                  return (
                    <li key={id} className="flex justify-between py-2 text-sm">
                      <span>{v?.nombre ?? "(eliminado)"}</span>
                      <span className="font-bold">{n} viajes · {num(m3, 0)} m³</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel>
            <Titulo>Historial del día</Titulo>
            {viajes.length === 0 ? <Vacio>No hay viajes registrados en este frente para la fecha.</Vacio> : (
              <ul className="space-y-2">
                {viajes.map((v) =>
                  editando === v.id ? (
                    <EditarViaje key={v.id} db={db} viaje={v} onClose={() => setEditando(null)} />
                  ) : (
                    <li key={v.id} className="flex items-center justify-between gap-2 rounded-lg bg-background/40 p-3">
                      <div className="min-w-0">
                        <div className="font-display text-lg font-bold">{horaDeISO(v.fechaHora)}</div>
                        <div className="truncate text-sm text-muted-foreground">{db.volquetes.find((x) => x.id === v.volqueteId)?.nombre ?? "(eliminado)"} · {v.capacidad} m³</div>
                      </div>
                      <Btn size="sm" variant="outline" onClick={() => setEditando(v.id)}>Corregir</Btn>
                    </li>
                  ),
                )}
              </ul>
            )}
          </Panel>
        </>
      )}
    </>
  );
}

function EditarViaje({ db, viaje, onClose }: { db: DB; viaje: Viaje; onClose: () => void }) {
  const [vid, setVid] = useState(viaje.volqueteId);
  const [momento, setMomento] = useState(toLocalInput(new Date(viaje.fechaHora)));
  const [error, setError] = useState("");

  function guardar() {
    const cuando = new Date(momento);
    if (Number.isNaN(cuando.getTime())) return setError("Fecha/hora inválida.");
    const choque = conflictoViaje(db, vid, cuando, viaje.id);
    if (choque) return setError(`Choca con otra salida de ese volquete a las ${horaDeISO(choque.fechaHora)} (mín. ${MIN_ENTRE_VIAJES} min).`);
    if (!window.confirm("¿Confirmas la corrección de este viaje?")) return;
    const vol = db.volquetes.find((v) => v.id === vid);
    actualizar((d) => ({
      ...d,
      viajes: d.viajes.map((x) =>
        x.id === viaje.id
          ? { ...x, volqueteId: vid, fechaHora: cuando.toISOString(), capacidad: vid === viaje.volqueteId ? x.capacidad : vol?.capacidad ?? x.capacidad }
          : x,
      ),
    }));
    onClose();
  }

  function eliminar() {
    if (!window.confirm("¿Eliminar este viaje? Esta acción no se puede deshacer.")) return;
    actualizar((d) => ({ ...d, viajes: d.viajes.filter((x) => x.id !== viaje.id) }));
    onClose();
  }

  return (
    <li className="space-y-3 rounded-lg border-2 border-primary p-3">
      <Campo label="Volquete">
        <Select value={vid} onChange={(e) => setVid(e.target.value)}>
          {db.volquetes.map((v) => <option key={v.id} value={v.id}>{v.nombre} · {v.capacidad} m³</option>)}
        </Select>
      </Campo>
      <Campo label="Fecha y hora">
        <Input type="datetime-local" value={momento} onChange={(e) => setMomento(e.target.value)} />
      </Campo>
      {error && <Aviso tone="error">{error}</Aviso>}
      <div className="grid grid-cols-3 gap-2">
        <Btn size="sm" onClick={guardar}>Guardar</Btn>
        <Btn size="sm" variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn size="sm" variant="danger" onClick={eliminar}>Eliminar</Btn>
      </div>
    </li>
  );
}
