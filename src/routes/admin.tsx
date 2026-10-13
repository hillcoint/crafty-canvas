import { createFileRoute } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { ChevronDown, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Aviso, Btn, Campo, Input, Panel, Select, Titulo, Vacio } from "@/components/field-ui";
import { actualizar, nuevoId, restablecerDemo } from "@/lib/store";
import { TIPO_FRENTE_LABEL, type DB, type TipoFrente, type TipoMaquina } from "@/lib/types";

/**
 * CLAVE DE ADMINISTRACIÓN
 * Para cambiarla, edita esta constante y guarda el archivo (src/routes/admin.tsx).
 * Es una protección básica de interfaz, no seguridad real: el código es visible.
 */
const ADMIN_KEY = "maquinaria2026";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Administración · M.I Maquinaria" },
      { name: "description", content: "Gestión de obras, frentes, equipos, tarifas y rendimientos esperados." },
      { property: "og:title", content: "Administración · M.I Maquinaria" },
      { property: "og:description", content: "Catálogos y tarifas de la operación." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: () => <AppShell>{(db) => <Admin db={db} />}</AppShell>,
});

export function Admin({ db }: { db: DB }) {
  const [ok, setOk] = useState(false);
  const [clave, setClave] = useState("");
  const [err, setErr] = useState(false);
  const [abierta, setAbierta] = useState<SeccionId | null>(null);

  if (!ok)
    return (
      <Panel>
        <Titulo>Administración</Titulo>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (clave === ADMIN_KEY) { setOk(true); setClave(""); } else setErr(true); }}>
          <Campo label="Clave de acceso"><Input type="password" value={clave} onChange={(e) => { setClave(e.target.value); setErr(false); }} autoFocus /></Campo>
          {err && <Aviso tone="error">Clave incorrecta.</Aviso>}
          <Btn type="submit" className="w-full">Entrar</Btn>
        </form>
      </Panel>
    );

  const mostrar = (id: SeccionId) => setAbierta((actual) => actual === id ? null : id);

  return (
    <div className="space-y-3">
      <Panel>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Titulo>Administración</Titulo>
          <Btn variant="ghost" size="sm" onClick={() => { setOk(false); setAbierta(null); }}>
            Cerrar sesión
          </Btn>
        </div>
        <p className="text-sm text-muted-foreground">
          Elige qué quieres gestionar. Abre una categoría y las demás permanecerán cerradas.
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-primary" aria-hidden="true" />
          {db.obras.length} obras · {db.frentes.length} frentes · {db.volquetes.length} volquetes · {db.maquinas.length} máquinas
        </div>
      </Panel>
      <SeccionAdmin id="obras" titulo="Obras" detalle={`${db.obras.length} registradas`} abierta={abierta === "obras"} onToggle={() => mostrar("obras")}>
        <Obras db={db} />
      </SeccionAdmin>
      <SeccionAdmin id="frentes" titulo="Frentes y asignaciones" detalle={`${db.frentes.length} frentes`} abierta={abierta === "frentes"} onToggle={() => mostrar("frentes")}>
        <Frentes db={db} />
      </SeccionAdmin>
      <SeccionAdmin id="volquetes" titulo="Volquetes" detalle={`${db.volquetes.length} unidades`} abierta={abierta === "volquetes"} onToggle={() => mostrar("volquetes")}>
        <Volquetes db={db} />
      </SeccionAdmin>
      <SeccionAdmin id="maquinas" titulo="Excavadoras y cargadores" detalle={`${db.maquinas.length} equipos`} abierta={abierta === "maquinas"} onToggle={() => mostrar("maquinas")}>
        <Maquinas db={db} />
      </SeccionAdmin>
      <SeccionAdmin id="tarifas" titulo="Tarifas (MXN)" detalle={`${db.tarifas.length} conceptos`} abierta={abierta === "tarifas"} onToggle={() => mostrar("tarifas")}>
        <Tarifas db={db} />
      </SeccionAdmin>
      <SeccionAdmin id="datos" titulo="Datos de demostración" detalle="Restablecer ejemplos y consultar la clave" abierta={abierta === "datos"} onToggle={() => mostrar("datos")}>
        <Panel className="border-0 bg-transparent p-3 sm:p-4">
          <p className="mb-3 text-sm text-muted-foreground">Reemplaza todos los datos guardados por el mes de ejemplo inicial.</p>
          <Btn variant="danger" className="w-full" onClick={() => window.confirm("¿Restablecer datos demo? Se perderán todos los registros actuales.") && restablecerDemo()}>
            Restablecer datos demo
          </Btn>
          <p className="mt-4 text-sm text-muted-foreground">
            Para cambiar la clave de administración edita la constante <code className="text-foreground">ADMIN_KEY</code> en <code className="text-foreground">src/routes/admin.tsx</code>.
          </p>
        </Panel>
      </SeccionAdmin>
    </div>
  );
}

type SeccionId = "obras" | "frentes" | "volquetes" | "maquinas" | "tarifas" | "datos";

function SeccionAdmin({ id, titulo, detalle, abierta, onToggle, children }: {
  id: SeccionId;
  titulo: string;
  detalle: string;
  abierta: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card">
      <h2>
        <button
          type="button"
          id={`cabecera-${id}`}
          aria-expanded={abierta}
          aria-controls={`contenido-${id}`}
          onClick={onToggle}
          className={`flex min-h-16 w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${abierta ? "bg-primary/10" : "hover:bg-secondary/50"}`}
        >
          <span className="min-w-0">
            <span className="block font-display text-lg font-bold uppercase leading-tight text-foreground">{titulo}</span>
            <span className="block text-sm text-muted-foreground">{detalle}</span>
          </span>
          <ChevronDown aria-hidden="true" className={`h-6 w-6 shrink-0 text-primary transition-transform ${abierta ? "rotate-180" : ""}`} />
        </button>
      </h2>
      <div
        id={`contenido-${id}`}
        role="region"
        aria-labelledby={`cabecera-${id}`}
        hidden={!abierta}
        className="border-t border-border [&>section]:rounded-none [&>section]:border-0 [&>section]:bg-transparent"
      >
        {abierta ? children : null}
      </div>
    </section>
  );
}

/** Los maestros con historial no pueden eliminarse: su eliminación ocultaría producción y cobros. */
const historicoFrente = (db: DB, id: string) =>
  db.viajes.some((v) => v.frenteId === id) || db.horas.some((h) => h.frenteId === id);
const historicoVolquete = (db: DB, id: string) =>
  db.viajes.some((v) => v.volqueteId === id) || db.horas.some((h) => h.recurso === "volquete" && h.recursoId === id);
const historicoMaquina = (db: DB, id: string) =>
  db.horas.some((h) => h.recurso === "maquina" && h.recursoId === id);
function permitirEliminar(tieneHistorico: boolean, descripcion: string): boolean {
  if (tieneHistorico) {
    window.alert(`No se puede eliminar ${descripcion}: tiene viajes u horas históricos. Para preservar los cobros, conserva el registro.`);
    return false;
  }
  return window.confirm(`¿Eliminar ${descripcion}? Esta acción no se puede deshacer.`);
}

function Obras({ db }: { db: DB }) {
  const [nombre, setNombre] = useState("");
  const [ubic, setUbic] = useState("");
  return (
    <Panel className="border-0 bg-transparent p-3 sm:p-4">
      <ul className="mb-3 space-y-2">
        {db.obras.map((o) => (
          <li key={o.id} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <Input aria-label="Nombre de obra" value={o.nombre} onChange={(e) => actualizar((d) => ({ ...d, obras: d.obras.map((x) => (x.id === o.id ? { ...x, nombre: e.target.value } : x)) }))} />
            <Input aria-label="Ubicación de obra" value={o.ubicacion} onChange={(e) => actualizar((d) => ({ ...d, obras: d.obras.map((x) => (x.id === o.id ? { ...x, ubicacion: e.target.value } : x)) }))} />
            </div>
            <Btn size="sm" variant="ghost" onClick={() => permitirEliminar(db.frentes.some((f) => f.obraId === o.id && historicoFrente(db, f.id)), o.nombre) && actualizar((d) => ({ ...d, obras: d.obras.filter((x) => x.id !== o.id), frentes: d.frentes.filter((f) => f.obraId !== o.id) }))}>✕</Btn>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
          <Input placeholder="Nueva obra" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input placeholder="Ubicación" value={ubic} onChange={(e) => setUbic(e.target.value)} />
        </div>
        <Btn size="sm" disabled={!nombre.trim()} onClick={() => { actualizar((d) => ({ ...d, obras: [...d.obras, { id: nuevoId("o"), nombre: nombre.trim(), ubicacion: ubic.trim() }] })); setNombre(""); setUbic(""); }}>+</Btn>
      </div>
    </Panel>
  );
}

function Frentes({ db }: { db: DB }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoFrente>("relleno");
  const [obraId, setObraId] = useState(db.obras[0]?.id ?? "");
  const toggle = (fid: string, campo: "maquinaIds" | "volqueteIds", id: string) =>
    actualizar((d) => ({
      ...d,
      frentes: d.frentes.map((f) => (f.id === fid ? { ...f, [campo]: f[campo].includes(id) ? f[campo].filter((x) => x !== id) : [...f[campo], id] } : f)),
    }));
  return (
    <Panel className="border-0 bg-transparent p-3 sm:p-4">
      {db.frentes.length === 0 && <Vacio>Sin frentes.</Vacio>}
      <ul className="mb-3 space-y-3">
        {db.frentes.map((f) => (
          <li key={f.id} className="rounded-lg bg-background/40">
            <details className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 p-3 font-display font-bold focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block break-words text-base">{f.nombre}</span>
                  <span className="block text-xs font-normal text-muted-foreground">
                    {TIPO_FRENTE_LABEL[f.tipo]} · {db.obras.find((o) => o.id === f.obraId)?.nombre ?? "Sin obra"}
                  </span>
                </span>
                <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0 text-primary transition-transform group-open:rotate-180" />
              </summary>
              <div className="space-y-3 border-t border-border p-3">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input value={f.nombre} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, nombre: e.target.value } : x)) }))} />
              <Btn size="sm" variant="ghost" onClick={() => permitirEliminar(historicoFrente(db, f.id), f.nombre) && actualizar((d) => ({ ...d, frentes: d.frentes.filter((x) => x.id !== f.id) }))}>✕</Btn>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Select value={f.tipo} disabled={historicoFrente(db, f.id)} title={historicoFrente(db, f.id) ? "Tipo bloqueado por tener producción histórica" : undefined} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, tipo: e.target.value as TipoFrente } : x)) }))}>
                {Object.entries(TIPO_FRENTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Select value={f.obraId} disabled={historicoFrente(db, f.id)} title={historicoFrente(db, f.id) ? "Obra bloqueada por tener registros históricos" : undefined} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, obraId: e.target.value } : x)) }))}>
                {db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </Select>
            </div>
            <Chips titulo="Maquinaria" items={db.maquinas.map((m) => ({ id: m.id, label: m.nombre }))} sel={f.maquinaIds} onToggle={(id) => toggle(f.id, "maquinaIds", id)} />
            <Chips titulo="Volquetes" items={db.volquetes.map((v) => ({ id: v.id, label: `${v.nombre} · ${v.capacidad} m³` }))} sel={f.volqueteIds} onToggle={(id) => toggle(f.id, "volqueteIds", id)} />
              </div>
            </details>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <Input className="sm:col-span-2" placeholder="Nombre del nuevo frente" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFrente)}>
          {Object.entries(TIPO_FRENTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={obraId} onChange={(e) => setObraId(e.target.value)}>
          {db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </Select>
        <Btn className="sm:col-span-2" disabled={!nombre.trim() || !obraId} onClick={() => { actualizar((d) => ({ ...d, frentes: [...d.frentes, { id: nuevoId("f"), obraId, nombre: nombre.trim(), tipo, maquinaIds: [], volqueteIds: [] }] })); setNombre(""); }}>Agregar frente</Btn>
      </div>
    </Panel>
  );
}

function Chips({ titulo, items, sel, onToggle }: { titulo: string; items: { id: string; label: string }[]; sel: string[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{titulo}</div>
      <div className="flex flex-wrap gap-2">
        {items.map((i) => (
          <button key={i.id} onClick={() => onToggle(i.id)} className={`min-h-10 rounded-full border px-3 text-xs font-semibold ${sel.includes(i.id) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}>
            {i.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Volquetes({ db }: { db: DB }) {
  const [nombre, setNombre] = useState("");
  const [cap, setCap] = useState("7");
  return (
    <Panel className="border-0 bg-transparent p-3 sm:p-4">
      <p className="mb-2 text-xs text-muted-foreground">Cambiar la capacidad solo afecta a viajes nuevos; los históricos conservan la suya.</p>
      <ul className="mb-3 space-y-2">
        {db.volquetes.map((v) => (
          <li key={v.id} className="flex items-start gap-2">
            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
              <Input aria-label="Nombre de volquete" value={v.nombre} onChange={(e) => actualizar((d) => ({ ...d, volquetes: d.volquetes.map((x) => (x.id === v.id ? { ...x, nombre: e.target.value } : x)) }))} />
            <Input type="number" min="1" inputMode="decimal" aria-label="Capacidad m³" value={v.capacidad} onChange={(e) => { const n = Number(e.target.value); if (n > 0) actualizar((d) => ({ ...d, volquetes: d.volquetes.map((x) => (x.id === v.id ? { ...x, capacidad: n } : x)) })); }} />
            </div>
            <Btn size="sm" variant="ghost" onClick={() => permitirEliminar(historicoVolquete(db, v.id), v.nombre) && actualizar((d) => ({ ...d, volquetes: d.volquetes.filter((x) => x.id !== v.id), frentes: d.frentes.map((f) => ({ ...f, volqueteIds: f.volqueteIds.filter((x) => x !== v.id) })) }))}>✕</Btn>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-2">
        <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <Input placeholder="Nuevo volquete" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input type="number" min="1" value={cap} onChange={(e) => setCap(e.target.value)} aria-label="Capacidad m³" />
        </div>
        <Btn size="sm" disabled={!nombre.trim() || !(Number(cap) > 0)} onClick={() => { actualizar((d) => ({ ...d, volquetes: [...d.volquetes, { id: nuevoId("v"), nombre: nombre.trim(), capacidad: Number(cap) }] })); setNombre(""); }}>+</Btn>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">La tarifa por hora se busca por capacidad (clave hr_volq7, hr_volq14, hr_volq20…).</p>
    </Panel>
  );
}

function Maquinas({ db }: { db: DB }) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<TipoMaquina>("excavadora");
  const [ton, setTon] = useState("20");
  const [m3h, setM3h] = useState("90");
  const upd = (id: string, patch: Partial<DB["maquinas"][number]>) => actualizar((d) => ({ ...d, maquinas: d.maquinas.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  return (
    <Panel className="border-0 bg-transparent p-3 sm:p-4">
      <ul className="mb-3 space-y-3">
        {db.maquinas.map((m) => (
          <li key={m.id} className="space-y-2 rounded-lg bg-background/40 p-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value={m.nombre} onChange={(e) => upd(m.id, { nombre: e.target.value })} />
              <Btn size="sm" variant="ghost" onClick={() => permitirEliminar(historicoMaquina(db, m.id), m.nombre) && actualizar((d) => ({ ...d, maquinas: d.maquinas.filter((x) => x.id !== m.id), frentes: d.frentes.map((f) => ({ ...f, maquinaIds: f.maquinaIds.filter((x) => x !== m.id) })) }))}>✕</Btn>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Campo label="Tipo">
                <Select value={m.tipo} disabled={historicoMaquina(db, m.id)} title={historicoMaquina(db, m.id) ? "Tipo bloqueado por tener historial" : undefined} onChange={(e) => upd(m.id, { tipo: e.target.value as TipoMaquina })}>
                  <option value="excavadora">Excavadora</option>
                  <option value="cargador">Cargador</option>
                </Select>
              </Campo>
              <Campo label="Toneladas"><Input type="number" min="1" value={m.toneladas} onChange={(e) => Number(e.target.value) > 0 && upd(m.id, { toneladas: Number(e.target.value) })} /></Campo>
              <Campo label="m³/h esperado"><Input type="number" min="1" value={m.m3hEsperado} onChange={(e) => Number(e.target.value) > 0 && upd(m.id, { m3hEsperado: Number(e.target.value) })} /></Campo>
            </div>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Input className="col-span-2 sm:col-span-3" placeholder="Nueva máquina" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaquina)}>
          <option value="excavadora">Excavadora</option>
          <option value="cargador">Cargador</option>
        </Select>
        <Input type="number" min="1" value={ton} onChange={(e) => setTon(e.target.value)} aria-label="Toneladas" />
        <Input type="number" min="1" value={m3h} onChange={(e) => setM3h(e.target.value)} aria-label="m³/h esperado" />
        <Btn className="col-span-2 sm:col-span-3" disabled={!nombre.trim() || !(Number(ton) > 0) || !(Number(m3h) > 0)} onClick={() => { actualizar((d) => ({ ...d, maquinas: [...d.maquinas, { id: nuevoId("m"), nombre: nombre.trim(), tipo, toneladas: Number(ton), m3hEsperado: Number(m3h) }] })); setNombre(""); }}>Agregar máquina</Btn>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Excavadoras ≥ 30 t usan la tarifa “Excavadora 30 t”; el resto “Excavadora 20 t”.</p>
    </Panel>
  );
}

function Tarifas({ db }: { db: DB }) {
  return (
    <Panel className="border-0 bg-transparent p-3 sm:p-4">
      <ul className="space-y-2">
        {db.tarifas.map((t) => (
          <li key={t.clave} className="grid grid-cols-1 items-center gap-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <div className="min-w-0">
              <Input value={t.concepto} onChange={(e) => actualizar((d) => ({ ...d, tarifas: d.tarifas.map((x) => (x.clave === t.clave ? { ...x, concepto: e.target.value } : x)) }))} />
              <div className="mt-0.5 text-[11px] text-muted-foreground">{t.clave} · por {t.unidad}</div>
            </div>
            <Input type="number" min="0" inputMode="decimal" value={t.mxn} onChange={(e) => { const n = Number(e.target.value); if (n >= 0) actualizar((d) => ({ ...d, tarifas: d.tarifas.map((x) => (x.clave === t.clave ? { ...x, mxn: n } : x)) })); }} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
