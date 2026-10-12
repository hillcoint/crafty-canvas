import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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

function Admin({ db }: { db: DB }) {
  const [ok, setOk] = useState(false);
  const [clave, setClave] = useState("");
  const [err, setErr] = useState(false);

  if (!ok)
    return (
      <Panel>
        <Titulo>Administración</Titulo>
        <form className="space-y-3" onSubmit={(e) => { e.preventDefault(); if (clave === ADMIN_KEY) setOk(true); else setErr(true); }}>
          <Campo label="Clave de acceso"><Input type="password" value={clave} onChange={(e) => { setClave(e.target.value); setErr(false); }} autoFocus /></Campo>
          {err && <Aviso tone="error">Clave incorrecta.</Aviso>}
          <Btn type="submit" className="w-full">Entrar</Btn>
        </form>
      </Panel>
    );

  return (
    <>
      <Obras db={db} />
      <Frentes db={db} />
      <Volquetes db={db} />
      <Maquinas db={db} />
      <Tarifas db={db} />
      <Panel>
        <Titulo>Datos demo</Titulo>
        <p className="mb-3 text-sm text-muted-foreground">Reemplaza todos los datos guardados por el mes de ejemplo inicial.</p>
        <Btn variant="danger" className="w-full" onClick={() => window.confirm("¿Restablecer datos demo? Se perderán todos los registros actuales.") && restablecerDemo()}>
          Restablecer datos demo
        </Btn>
        <p className="mt-4 text-xs text-muted-foreground">
          Para cambiar la clave de administración edita la constante <code className="text-foreground">ADMIN_KEY</code> en <code className="text-foreground">src/routes/admin.tsx</code>.
        </p>
      </Panel>
    </>
  );
}

const quitar = (txt: string) => window.confirm(`¿Eliminar ${txt}? Los registros históricos se conservan.`);

function Obras({ db }: { db: DB }) {
  const [nombre, setNombre] = useState("");
  const [ubic, setUbic] = useState("");
  return (
    <Panel>
      <Titulo>Obras</Titulo>
      <ul className="mb-3 space-y-2">
        {db.obras.map((o) => (
          <li key={o.id} className="grid grid-cols-[1fr_1fr_auto] gap-2">
            <Input value={o.nombre} onChange={(e) => actualizar((d) => ({ ...d, obras: d.obras.map((x) => (x.id === o.id ? { ...x, nombre: e.target.value } : x)) }))} />
            <Input value={o.ubicacion} onChange={(e) => actualizar((d) => ({ ...d, obras: d.obras.map((x) => (x.id === o.id ? { ...x, ubicacion: e.target.value } : x)) }))} />
            <Btn size="sm" variant="ghost" onClick={() => quitar(o.nombre) && actualizar((d) => ({ ...d, obras: d.obras.filter((x) => x.id !== o.id), frentes: d.frentes.filter((f) => f.obraId !== o.id) }))}>✕</Btn>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2">
        <Input placeholder="Nueva obra" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input placeholder="Ubicación" value={ubic} onChange={(e) => setUbic(e.target.value)} />
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
    <Panel>
      <Titulo>Frentes y asignaciones</Titulo>
      {db.frentes.length === 0 && <Vacio>Sin frentes.</Vacio>}
      <ul className="mb-3 space-y-3">
        {db.frentes.map((f) => (
          <li key={f.id} className="space-y-2 rounded-lg bg-background/40 p-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value={f.nombre} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, nombre: e.target.value } : x)) }))} />
              <Btn size="sm" variant="ghost" onClick={() => quitar(f.nombre) && actualizar((d) => ({ ...d, frentes: d.frentes.filter((x) => x.id !== f.id) }))}>✕</Btn>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Select value={f.tipo} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, tipo: e.target.value as TipoFrente } : x)) }))}>
                {Object.entries(TIPO_FRENTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </Select>
              <Select value={f.obraId} onChange={(e) => actualizar((d) => ({ ...d, frentes: d.frentes.map((x) => (x.id === f.id ? { ...x, obraId: e.target.value } : x)) }))}>
                {db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
              </Select>
            </div>
            <Chips titulo="Maquinaria" items={db.maquinas.map((m) => ({ id: m.id, label: m.nombre }))} sel={f.maquinaIds} onToggle={(id) => toggle(f.id, "maquinaIds", id)} />
            <Chips titulo="Volquetes" items={db.volquetes.map((v) => ({ id: v.id, label: `${v.nombre} · ${v.capacidad} m³` }))} sel={f.volqueteIds} onToggle={(id) => toggle(f.id, "volqueteIds", id)} />
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-2 gap-2">
        <Input className="col-span-2" placeholder="Nombre del nuevo frente" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoFrente)}>
          {Object.entries(TIPO_FRENTE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
        <Select value={obraId} onChange={(e) => setObraId(e.target.value)}>
          {db.obras.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
        </Select>
        <Btn className="col-span-2" disabled={!nombre.trim() || !obraId} onClick={() => { actualizar((d) => ({ ...d, frentes: [...d.frentes, { id: nuevoId("f"), obraId, nombre: nombre.trim(), tipo, maquinaIds: [], volqueteIds: [] }] })); setNombre(""); }}>Agregar frente</Btn>
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
    <Panel>
      <Titulo>Volquetes</Titulo>
      <p className="mb-2 text-xs text-muted-foreground">Cambiar la capacidad solo afecta a viajes nuevos; los históricos conservan la suya.</p>
      <ul className="mb-3 space-y-2">
        {db.volquetes.map((v) => (
          <li key={v.id} className="grid grid-cols-[1fr_6rem_auto] gap-2">
            <Input value={v.nombre} onChange={(e) => actualizar((d) => ({ ...d, volquetes: d.volquetes.map((x) => (x.id === v.id ? { ...x, nombre: e.target.value } : x)) }))} />
            <Input type="number" min="1" inputMode="decimal" aria-label="Capacidad m³" value={v.capacidad} onChange={(e) => { const n = Number(e.target.value); if (n > 0) actualizar((d) => ({ ...d, volquetes: d.volquetes.map((x) => (x.id === v.id ? { ...x, capacidad: n } : x)) })); }} />
            <Btn size="sm" variant="ghost" onClick={() => quitar(v.nombre) && actualizar((d) => ({ ...d, volquetes: d.volquetes.filter((x) => x.id !== v.id), frentes: d.frentes.map((f) => ({ ...f, volqueteIds: f.volqueteIds.filter((x) => x !== v.id) })) }))}>✕</Btn>
          </li>
        ))}
      </ul>
      <div className="grid grid-cols-[1fr_6rem_auto] gap-2">
        <Input placeholder="Nuevo volquete" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Input type="number" min="1" value={cap} onChange={(e) => setCap(e.target.value)} aria-label="Capacidad m³" />
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
    <Panel>
      <Titulo>Excavadoras y cargadores</Titulo>
      <ul className="mb-3 space-y-3">
        {db.maquinas.map((m) => (
          <li key={m.id} className="space-y-2 rounded-lg bg-background/40 p-3">
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Input value={m.nombre} onChange={(e) => upd(m.id, { nombre: e.target.value })} />
              <Btn size="sm" variant="ghost" onClick={() => quitar(m.nombre) && actualizar((d) => ({ ...d, maquinas: d.maquinas.filter((x) => x.id !== m.id), frentes: d.frentes.map((f) => ({ ...f, maquinaIds: f.maquinaIds.filter((x) => x !== m.id) })) }))}>✕</Btn>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Campo label="Tipo">
                <Select value={m.tipo} onChange={(e) => upd(m.id, { tipo: e.target.value as TipoMaquina })}>
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
      <div className="grid grid-cols-3 gap-2">
        <Input className="col-span-3" placeholder="Nueva máquina" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        <Select value={tipo} onChange={(e) => setTipo(e.target.value as TipoMaquina)}>
          <option value="excavadora">Excavadora</option>
          <option value="cargador">Cargador</option>
        </Select>
        <Input type="number" min="1" value={ton} onChange={(e) => setTon(e.target.value)} aria-label="Toneladas" />
        <Input type="number" min="1" value={m3h} onChange={(e) => setM3h(e.target.value)} aria-label="m³/h esperado" />
        <Btn className="col-span-3" disabled={!nombre.trim() || !(Number(ton) > 0) || !(Number(m3h) > 0)} onClick={() => { actualizar((d) => ({ ...d, maquinas: [...d.maquinas, { id: nuevoId("m"), nombre: nombre.trim(), tipo, toneladas: Number(ton), m3hEsperado: Number(m3h) }] })); setNombre(""); }}>Agregar máquina</Btn>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Excavadoras ≥ 30 t usan la tarifa “Excavadora 30 t”; el resto “Excavadora 20 t”.</p>
    </Panel>
  );
}

function Tarifas({ db }: { db: DB }) {
  return (
    <Panel>
      <Titulo>Tarifas (MXN)</Titulo>
      <ul className="space-y-2">
        {db.tarifas.map((t) => (
          <li key={t.clave} className="grid grid-cols-[1fr_7rem] items-center gap-2">
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
