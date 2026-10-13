import { describe, expect, it } from "vitest";
import {
  calcularCobro, calcularHoras, conflictoViaje, rendimientoFrente, sumaM3,
  validarHorasMaquina, validarHorasVolquete,
} from "./calc";
import type { DB, RegistroHoras, Viaje } from "./types";

const fecha = "2026-10-13";
const instante = (hora: number, minuto = 0) => new Date(2026, 9, 13, hora, minuto).toISOString();

function dbBase(): DB {
  return {
    version: 1,
    obras: [{ id: "o1", nombre: "Obra 1", ubicacion: "Tabasco" }],
    frentes: [
      { id: "f1", obraId: "o1", nombre: "Relleno", tipo: "relleno", maquinaIds: ["e1"], volqueteIds: ["v1"] },
      { id: "f2", obraId: "o1", nombre: "Corte", tipo: "corte", maquinaIds: ["e1"], volqueteIds: ["v1"] },
    ],
    volquetes: [{ id: "v1", nombre: "Volquete 14", capacidad: 14 }],
    maquinas: [
      { id: "e1", nombre: "Excavadora 20 t", tipo: "excavadora", toneladas: 20, m3hEsperado: 90 },
      { id: "c1", nombre: "Cargador", tipo: "cargador", toneladas: 18, m3hEsperado: 110 },
    ],
    viajes: [], horas: [],
    tarifas: [
      { clave: "vol_relleno", concepto: "Relleno", unidad: "m³", mxn: 38 },
      { clave: "vol_corte", concepto: "Corte", unidad: "m³", mxn: 45 },
      { clave: "hr_exc20", concepto: "Excavadora", unidad: "h", mxn: 1100 },
      { clave: "hr_cargador", concepto: "Cargador", unidad: "h", mxn: 950 },
      { clave: "hr_volq14", concepto: "Volquete de 14 m³", unidad: "h", mxn: 650 },
      { clave: "hr_volq20", concepto: "Volquete de 20 m³", unidad: "h", mxn: 850 },
    ],
    seleccion: { obraId: "o1", frenteId: "f1", fecha },
  };
}

const viaje = (id: string, frenteId = "f1", capacidad = 14, salida = instante(8)): Viaje =>
  ({ id, volqueteId: "v1", frenteId, obraId: "o1", fechaHora: salida, capacidad });

const horas = (
  id: string, recurso: "maquina" | "volquete", recursoId: string,
  frenteId: string, cantidad: number, ini: number | null = null,
  fin: number | null = null, tarifaClave?: string,
): RegistroHoras => ({
  id, recurso, recursoId, frenteId, fecha, horas: cantidad,
  horometroInicial: ini, horometroFinal: fin, tarifaClave,
});

describe("producción de terracería", () => {
  it("suma la capacidad histórica por viaje y no la del catálogo", () => {
    const db = dbBase();
    db.viajes = [viaje("1", "f1", 7), viaje("2", "f1", 14, instante(8, 11))];
    db.volquetes[0]!.capacidad = 20;
    expect(sumaM3(db.viajes)).toBe(21);
  });

  it("bloquea el mismo volquete antes de 10 min incluso en otro frente", () => {
    const db = dbBase();
    db.viajes = [viaje("1", "f2", 14, instante(8))];
    expect(conflictoViaje(db, "v1", new Date(instante(8, 9)))?.id).toBe("1");
    expect(conflictoViaje(db, "v1", new Date(instante(8, 10)))).toBeNull();
    expect(conflictoViaje(db, "v1", new Date(instante(7, 51)))?.id).toBe("1");
  });

  it("calcula las horas y rechaza un descenso de horómetro aunque el redondeo dé cero", () => {
    expect(calcularHoras(10, 12.5)).toEqual({ ok: true, horas: 2.5 });
    expect(calcularHoras(100.04, 100).ok).toBe(false);
    expect(calcularHoras(10, 9).ok).toBe(false);
  });

  it("detecta intervalos superpuestos de la misma excavadora aunque cambie el frente", () => {
    const db = dbBase();
    db.horas = [horas("h1", "maquina", "e1", "f2", 1, 100, 101)];
    expect(validarHorasMaquina(db, "e1", fecha, 100.5, 101.5).ok).toBe(false);
    expect(validarHorasMaquina(db, "e1", fecha, 101, 102)).toEqual({ ok: true, horas: 1 });
  });

  it("rechaza más de 12 horas por unidad y día", () => {
    const db = dbBase();
    db.horas = [horas("h1", "maquina", "e1", "f1", 11.5, 100, 111.5)];
    expect(validarHorasMaquina(db, "e1", fecha, 111.5, 112.5).ok).toBe(false);
    db.horas = [horas("h2", "volquete", "v1", "f1", 11.5)];
    expect(validarHorasVolquete(db, "v1", "f2", fecha, 1).ok).toBe(false);
  });

  it("evita duplicar las horas facturables del mismo volquete/frente/día", () => {
    const db = dbBase();
    db.horas = [horas("h1", "volquete", "v1", "f1", 4)];
    expect(validarHorasVolquete(db, "v1", "f1", fecha, 2).ok).toBe(false);
    expect(validarHorasVolquete(db, "v1", "f2", fecha, 2)).toEqual({ ok: true, horas: 2 });
  });

  it("calcula m³/h y alerta estrictamente por debajo del 80% esperado", () => {
    const db = dbBase();
    db.viajes = [viaje("1", "f1", 72)];
    db.horas = [horas("h1", "maquina", "e1", "f1", 1, 100, 101)];
    let r = rendimientoFrente(db, fecha, db.frentes[0]!);
    expect(r.real).toBe(72);
    expect(r.ratio).toBe(0.8);
    expect(r.alerta).toBe(false);
    db.viajes = [viaje("1", "f1", 71)];
    r = rendimientoFrente(db, fecha, db.frentes[0]!);
    expect(r.alerta).toBe(true);
    db.horas = [];
    expect(rendimientoFrente(db, fecha, db.frentes[0]!).real).toBeNull();
  });
});

describe("comparación económica", () => {
  it("cobra volumen y horas de excavadora y volquete, excluyendo el cargador", () => {
    const db = dbBase();
    db.viajes = [viaje("1")];
    db.horas = [
      horas("h1", "maquina", "e1", "f1", 2, 100, 102),
      horas("h2", "volquete", "v1", "f1", 1, null, null, "hr_volq14"),
      horas("h3", "maquina", "c1", "f1", 3, 50, 53),
    ];
    const cobro = calcularCobro(db, "o1", fecha, fecha);
    expect(cobro.totalVol).toBe(14 * 38);
    expect(cobro.totalHor).toBe(2 * 1100 + 650);
    expect(cobro.horLineas).toHaveLength(2);
    expect(cobro.diferencia).toBe(14 * 38 - (2 * 1100 + 650));
  });

  it("mantiene la tarifa horaria histórica si cambia la capacidad del volquete", () => {
    const db = dbBase();
    db.horas = [horas("h2", "volquete", "v1", "f1", 2, null, null, "hr_volq14")];
    db.volquetes[0]!.capacidad = 20;
    expect(calcularCobro(db, "o1", fecha, fecha).totalHor).toBe(2 * 650);
  });

  it("avisa cuando faltan tarifas para operaciones efectivamente registradas", () => {
    const db = dbBase();
    db.viajes = [viaje("1")];
    db.tarifas = db.tarifas.filter((t) => t.clave !== "vol_relleno");
    expect(calcularCobro(db, "o1", fecha, fecha).tarifasPendientes).toContain("Relleno");
  });
});
