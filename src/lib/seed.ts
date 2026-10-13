import type { DB, Frente, Maquina, RegistroHoras, Viaje, Volquete } from "./types";
import { addDays, hoy } from "./dates";

/** PRNG determinista para que los datos demo sean coherentes y reproducibles */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export const DB_VERSION = 1;

export function crearDatosDemo(): DB {
  const r = rng(20260601);
  const obras = [
    { id: "o1", nombre: "Libramiento Villahermosa km 12", ubicacion: "Centro, Tabasco" },
    { id: "o2", nombre: "Plataforma Parque Industrial Cárdenas", ubicacion: "Cárdenas, Tabasco" },
  ];
  const volquetes: Volquete[] = [
    { id: "v1", nombre: "V-01 Kenworth", capacidad: 7 },
    { id: "v2", nombre: "V-02 International", capacidad: 7 },
    { id: "v3", nombre: "V-03 Dina", capacidad: 7 },
    { id: "v4", nombre: "V-04 Kenworth", capacidad: 7 },
    { id: "v5", nombre: "V-05 Freightliner", capacidad: 14 },
    { id: "v6", nombre: "V-06 Kenworth T800", capacidad: 14 },
    { id: "v7", nombre: "V-07 International", capacidad: 14 },
    { id: "v8", nombre: "V-08 Mack Granite", capacidad: 20 },
  ];
  const maquinas: Maquina[] = [
    { id: "m1", nombre: "EXC-01 CAT 320", tipo: "excavadora", toneladas: 20, m3hEsperado: 90 },
    { id: "m2", nombre: "EXC-02 Komatsu PC200", tipo: "excavadora", toneladas: 20, m3hEsperado: 90 },
    { id: "m3", nombre: "EXC-03 CAT 330", tipo: "excavadora", toneladas: 30, m3hEsperado: 130 },
    { id: "m4", nombre: "CAR-01 CAT 950", tipo: "cargador", toneladas: 18, m3hEsperado: 110 },
  ];
  const frentes: Frente[] = [
    { id: "f1", obraId: "o1", nombre: "Relleno terraplén cad. 2+400", tipo: "relleno", maquinaIds: ["m1"], volqueteIds: ["v5", "v6", "v1"] },
    { id: "f2", obraId: "o1", nombre: "Corte talud cad. 3+100", tipo: "corte", maquinaIds: ["m3"], volqueteIds: ["v8", "v7", "v2"] },
    { id: "f3", obraId: "o2", nombre: "Banco El Bellote", tipo: "banco", maquinaIds: ["m2"], volqueteIds: ["v3", "v4"] },
    { id: "f4", obraId: "o2", nombre: "Nivelación plataforma A", tipo: "nivelacion", maquinaIds: ["m4"], volqueteIds: [] },
  ];

  const viajes: Viaje[] = [];
  const horas: RegistroHoras[] = [];
  const horometro: Record<string, number> = { m1: 4210, m2: 6875.5, m3: 3120, m4: 9020 };
  const capDe = (id: string) => volquetes.find((v) => v.id === id)!.capacidad;
  const maqDe = (id: string) => maquinas.find((m) => m.id === id)!;
  let n = 0;
  const fin = hoy();

  for (let i = 30; i >= 1; i--) {
    const fecha = addDays(fin, -i);
    const [y, mo, d] = fecha.split("-").map(Number);
    const dia = new Date(y!, mo! - 1, d!);
    if (dia.getDay() === 0) continue; // domingo sin trabajo

    for (const f of frentes) {
      let volumen = 0;
      for (const vid of f.volqueteIds) {
        const nViajes = 11 + Math.floor(r() * 8);
        let minuto = 6 * 60 + 30 + Math.floor(r() * 30);
        for (let k = 0; k < nViajes && minuto < 17 * 60 + 45; k++) {
          const dt = new Date(y!, mo! - 1, d!, Math.floor(minuto / 60), minuto % 60);
          viajes.push({ id: `sv${n++}`, volqueteId: vid, frenteId: f.id, obraId: f.obraId, fechaHora: dt.toISOString(), capacidad: capDe(vid) });
          volumen += capDe(vid);
          minuto += 28 + Math.floor(r() * 22);
        }
        horas.push({ id: `sh${n++}`, recurso: "volquete", recursoId: vid, frenteId: f.id, fecha, horometroInicial: null, horometroFinal: null, horas: 9 + Math.round(r() * 2 * 2) / 2, tarifaClave: `hr_volq${capDe(vid)}` });
      }
      for (const mid of f.maquinaIds) {
        const m = maqDe(mid);
        // factor de eficiencia: ocasionalmente < 0.8 para mostrar alertas
        const efic = r() < 0.18 ? 0.6 + r() * 0.15 : 0.85 + r() * 0.2;
        let h = volumen > 0 ? volumen / (m.m3hEsperado * efic) : 6 + r() * 3;
        h = Math.round(Math.min(h, 11) * 10) / 10;
        const ini = horometro[mid]!;
        const finH = Math.round((ini + h) * 10) / 10;
        horometro[mid] = finH;
        horas.push({ id: `sh${n++}`, recurso: "maquina", recursoId: mid, frenteId: f.id, fecha, horometroInicial: ini, horometroFinal: finH, horas: Math.round((finH - ini) * 10) / 10 });
      }
    }
  }

  return {
    version: DB_VERSION,
    obras,
    frentes,
    volquetes,
    maquinas,
    viajes,
    horas,
    tarifas: [
      { clave: "vol_relleno", concepto: "Relleno", unidad: "m³", mxn: 38 },
      { clave: "vol_corte", concepto: "Corte", unidad: "m³", mxn: 45 },
      { clave: "vol_banco", concepto: "Banco de material (ejemplo)", unidad: "m³", mxn: 32 },
      { clave: "vol_nivelacion", concepto: "Nivelación (ejemplo)", unidad: "m³", mxn: 28 },
      { clave: "hr_exc20", concepto: "Excavadora 20 t", unidad: "h", mxn: 1100 },
      { clave: "hr_exc30", concepto: "Excavadora 30 t", unidad: "h", mxn: 1500 },
      { clave: "hr_cargador", concepto: "Cargador frontal (ejemplo)", unidad: "h", mxn: 950 },
      { clave: "hr_volq7", concepto: "Volquete 7 m³ (ejemplo)", unidad: "h", mxn: 420 },
      { clave: "hr_volq14", concepto: "Volquete 14 m³", unidad: "h", mxn: 650 },
      { clave: "hr_volq20", concepto: "Volquete 20 m³ (ejemplo)", unidad: "h", mxn: 850 },
    ],
    seleccion: { obraId: "o1", frenteId: "f1", fecha: horas.length ? horas[horas.length - 1]!.fecha : fin },
  };
}
