import type { DB, Frente, Maquina, RegistroHoras, Viaje, Volquete } from "./types";
import { fechaDeISO } from "./dates";

export const MIN_ENTRE_VIAJES = 10;
export const UMBRAL_ALERTA = 0.8;

export function viajesDelDia(db: DB, fecha: string, frenteId?: string): Viaje[] {
  return db.viajes.filter(
    (v) => fechaDeISO(v.fechaHora) === fecha && (!frenteId || v.frenteId === frenteId),
  );
}

export const sumaM3 = (vs: Viaje[]) => vs.reduce((a, v) => a + v.capacidad, 0);

/** Devuelve el viaje que choca (< 10 min) con el nuevo, o null */
export function conflictoViaje(
  db: DB,
  volqueteId: string,
  fechaHora: Date,
  excluirId?: string,
): Viaje | null {
  const t = fechaHora.getTime();
  return (
    db.viajes.find(
      (v) =>
        v.volqueteId === volqueteId &&
        v.id !== excluirId &&
        Math.abs(new Date(v.fechaHora).getTime() - t) < MIN_ENTRE_VIAJES * 60_000,
    ) ?? null
  );
}

export function calcularHoras(ini: number, fin: number): { ok: true; horas: number } | { ok: false; error: string } {
  if (!Number.isFinite(ini) || !Number.isFinite(fin)) return { ok: false, error: "Captura ambos horómetros." };
  if (ini < 0 || fin < 0) return { ok: false, error: "Los horómetros no pueden ser negativos." };
  const h = Math.round((fin - ini) * 10) / 10;
  if (h < 0) return { ok: false, error: "El horómetro final es menor que el inicial (horas negativas)." };
  if (h > 24) return { ok: false, error: "Más de 24 h en un día: revisa los horómetros." };
  return { ok: true, horas: h };
}

/** m³/h evitando división entre cero */
export function m3h(volumen: number, horas: number): number | null {
  return horas > 0 ? volumen / horas : null;
}

export function horasMaquinaDia(db: DB, fecha: string, frenteId: string): { maquina: Maquina; horas: number }[] {
  const regs = db.horas.filter((h) => h.recurso === "maquina" && h.fecha === fecha && h.frenteId === frenteId);
  const map = new Map<string, number>();
  regs.forEach((r) => map.set(r.recursoId, (map.get(r.recursoId) ?? 0) + r.horas));
  return [...map.entries()]
    .map(([id, horas]) => ({ maquina: db.maquinas.find((m) => m.id === id)!, horas }))
    .filter((x) => x.maquina);
}

export interface RendFrente {
  frente: Frente;
  volumen: number;
  viajes: number;
  porUnidad: { volquete: Volquete; viajes: number; m3: number }[];
  horasExc: number;
  real: number | null;
  esperado: number | null;
  ratio: number | null;
  alerta: boolean;
}

export function rendimientoFrente(db: DB, fecha: string, frente: Frente): RendFrente {
  const vs = viajesDelDia(db, fecha, frente.id);
  const volumen = sumaM3(vs);
  const unidades = new Map<string, { viajes: number; m3: number }>();
  vs.forEach((v) => {
    const u = unidades.get(v.volqueteId) ?? { viajes: 0, m3: 0 };
    u.viajes++;
    u.m3 += v.capacidad;
    unidades.set(v.volqueteId, u);
  });
  const porUnidad = [...unidades.entries()]
    .map(([id, u]) => ({ volquete: db.volquetes.find((x) => x.id === id) ?? { id, nombre: "(eliminado)", capacidad: 0 }, ...u }))
    .sort((a, b) => b.viajes - a.viajes);
  const maqs = horasMaquinaDia(db, fecha, frente.id).filter((x) => x.maquina.tipo === "excavadora");
  const horasExc = maqs.reduce((a, x) => a + x.horas, 0);
  const real = m3h(volumen, horasExc);
  // esperado: promedio ponderado por horas del m³/h esperado de cada excavadora
  const esperado = horasExc > 0 ? maqs.reduce((a, x) => a + x.maquina.m3hEsperado * x.horas, 0) / horasExc : null;
  const ratio = real !== null && esperado ? real / esperado : null;
  return { frente, volumen, viajes: vs.length, porUnidad, horasExc, real, esperado, ratio, alerta: ratio !== null && ratio < UMBRAL_ALERTA };
}

export function claveTarifaVolumen(f: Frente) {
  return `vol_${f.tipo}`;
}

export function claveTarifaHora(db: DB, r: RegistroHoras): string | null {
  if (r.recurso === "volquete") {
    const v = db.volquetes.find((x) => x.id === r.recursoId);
    return v ? `hr_volq${v.capacidad}` : null;
  }
  const m = db.maquinas.find((x) => x.id === r.recursoId);
  if (!m) return null;
  if (m.tipo === "cargador") return "hr_cargador";
  return m.toneladas >= 30 ? "hr_exc30" : "hr_exc20";
}

export const tarifa = (db: DB, clave: string | null) => db.tarifas.find((t) => t.clave === clave);

export interface Linea {
  concepto: string;
  cantidad: number;
  unidad: string;
  tarifa: number | null;
  importe: number;
}

export function calcularCobro(db: DB, obraId: string, desde: string, hasta: string) {
  const frentes = db.frentes.filter((f) => obraId === "todas" || f.obraId === obraId);
  const ids = new Set(frentes.map((f) => f.id));
  const enRango = (f: string) => f >= desde && f <= hasta;

  // Volumen por frente
  const volLineas: Linea[] = frentes.map((f) => {
    const m3 = sumaM3(db.viajes.filter((v) => v.frenteId === f.id && enRango(fechaDeISO(v.fechaHora))));
    const t = tarifa(db, claveTarifaVolumen(f));
    return { concepto: f.nombre, cantidad: m3, unidad: "m³", tarifa: t?.mxn ?? null, importe: m3 * (t?.mxn ?? 0) };
  });

  // Horas por recurso
  const horasMap = new Map<string, { nombre: string; horas: number; clave: string | null }>();
  db.horas
    .filter((h) => ids.has(h.frenteId) && enRango(h.fecha))
    .forEach((h) => {
      const k = `${h.recurso}:${h.recursoId}`;
      const nombre =
        h.recurso === "maquina"
          ? db.maquinas.find((m) => m.id === h.recursoId)?.nombre
          : db.volquetes.find((v) => v.id === h.recursoId)?.nombre;
      const e = horasMap.get(k) ?? { nombre: nombre ?? "(eliminado)", horas: 0, clave: claveTarifaHora(db, h) };
      e.horas += h.horas;
      horasMap.set(k, e);
    });
  const horLineas: Linea[] = [...horasMap.values()]
    .map((e) => {
      const t = tarifa(db, e.clave);
      return { concepto: e.nombre, cantidad: e.horas, unidad: "h", tarifa: t?.mxn ?? null, importe: e.horas * (t?.mxn ?? 0) };
    })
    .sort((a, b) => b.importe - a.importe);

  const totalVol = volLineas.reduce((a, l) => a + l.importe, 0);
  const totalHor = horLineas.reduce((a, l) => a + l.importe, 0);
  return { volLineas, horLineas, totalVol, totalHor, diferencia: totalVol - totalHor };
}
