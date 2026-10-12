export type TipoFrente = "banco" | "relleno" | "corte" | "nivelacion";
export type TipoMaquina = "excavadora" | "cargador";

export interface Obra {
  id: string;
  nombre: string;
  ubicacion: string;
}

export interface Frente {
  id: string;
  obraId: string;
  nombre: string;
  tipo: TipoFrente;
  maquinaIds: string[];
  volqueteIds: string[];
}

export interface Volquete {
  id: string;
  nombre: string;
  capacidad: number; // m³
}

export interface Maquina {
  id: string;
  nombre: string;
  tipo: TipoMaquina;
  toneladas: number;
  m3hEsperado: number;
}

export interface Viaje {
  id: string;
  volqueteId: string;
  frenteId: string;
  obraId: string;
  fechaHora: string; // ISO
  capacidad: number; // m³ guardada al registrar
}

export interface RegistroHoras {
  id: string;
  recurso: "maquina" | "volquete";
  recursoId: string;
  frenteId: string;
  fecha: string; // YYYY-MM-DD
  horometroInicial: number | null;
  horometroFinal: number | null;
  horas: number;
}

export interface Tarifa {
  clave: string;
  concepto: string;
  unidad: "m³" | "h";
  mxn: number;
}

export interface Seleccion {
  obraId: string;
  frenteId: string;
  fecha: string;
}

export interface DB {
  version: number;
  obras: Obra[];
  frentes: Frente[];
  volquetes: Volquete[];
  maquinas: Maquina[];
  viajes: Viaje[];
  horas: RegistroHoras[];
  tarifas: Tarifa[];
  seleccion: Seleccion;
}

export const TIPO_FRENTE_LABEL: Record<TipoFrente, string> = {
  banco: "Banco de material",
  relleno: "Relleno",
  corte: "Corte",
  nivelacion: "Nivelación",
};
