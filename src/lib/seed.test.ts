import { describe, expect, it } from "vitest";
import { crearDatosDemo } from "./seed";
import { fechaDeISO } from "./dates";

describe("datos demo de M.I Maquinaria", () => {
  const db = crearDatosDemo();
  it("incluye 2 obras, 4 frentes, 8 volquetes y 3 excavadoras", () => {
    expect(db.obras).toHaveLength(2);
    expect(db.frentes).toHaveLength(4);
    expect(db.volquetes).toHaveLength(8);
    expect(db.maquinas.filter((m) => m.tipo === "excavadora")).toHaveLength(3);
    expect(db.volquetes.map((v) => v.capacidad).sort((a,b) => a-b)).toEqual([7,7,7,7,14,14,14,20]);
    expect(db.frentes.every((f) => db.viajes.some((v) => v.frenteId === f.id))).toBe(true);
  });

  it("usa las capacidades históricas y conserva una tarifa para cada parte de volquete", () => {
    for (const viaje of db.viajes) {
      expect(viaje.capacidad).toBe(db.volquetes.find((v) => v.id === viaje.volqueteId)?.capacidad);
    }
    for (const parte of db.horas.filter((h) => h.recurso === "volquete")) {
      expect(db.tarifas.some((t) => t.clave === parte.tarifaClave)).toBe(true);
    }
  });

  it("separa al menos 10 minutos las salidas de una misma unidad", () => {
    const porVolquete = new Map<string, number[]>();
    for (const viaje of db.viajes) {
      const lista = porVolquete.get(viaje.volqueteId) ?? [];
      lista.push(new Date(viaje.fechaHora).getTime());
      porVolquete.set(viaje.volqueteId, lista);
    }
    for (const lista of porVolquete.values()) {
      lista.sort((a,b) => a-b);
      for (let i = 1; i < lista.length; i++) {
        expect(lista[i]! - lista[i-1]!).toBeGreaterThanOrEqual(600_000);
      }
    }
  });

  it("mantiene los registros de ejemplo dentro de la jornada de 06 a 18 h", () => {
    const dbFechas = new Set(db.viajes.map((v) => fechaDeISO(v.fechaHora)));
    expect(dbFechas.size).toBeGreaterThanOrEqual(20);
    for (const viaje of db.viajes) {
      const d = new Date(viaje.fechaHora);
      const h = d.getHours() + d.getMinutes()/60;
      expect(h).toBeGreaterThanOrEqual(6);
      expect(h).toBeLessThan(18);
    }
    for (const parte of db.horas) {
      expect(parte.horas).toBeLessThanOrEqual(12);
      expect(parte.horas).toBeGreaterThanOrEqual(0);
    }
  });
});
