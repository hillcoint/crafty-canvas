import { useSyncExternalStore } from "react";
import type { DB } from "./types";
import { crearDatosDemo, DB_VERSION } from "./seed";
import { hoy } from "./dates";

const KEY = "mi-maquinaria-db-v1";

let db: DB | null = null;
let storageOk = true;
const listeners = new Set<() => void>();

function probarStorage(): boolean {
  try {
    const t = "__mi_test__";
    window.localStorage.setItem(t, "1");
    window.localStorage.removeItem(t);
    return true;
  } catch {
    return false;
  }
}

function cargar(): DB {
  storageOk = probarStorage();
  if (storageOk) {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as DB;
        if (parsed.version === DB_VERSION) {
          parsed.seleccion.fecha = parsed.seleccion.fecha || hoy();
          return parsed;
        }
      }
    } catch {
      /* datos corruptos: regenerar */
    }
  }
  const demo = crearDatosDemo();
  persistir(demo);
  return demo;
}

function persistir(d: DB) {
  if (!storageOk) return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(d));
  } catch {
    storageOk = false;
  }
}

function getSnapshot(): DB | null {
  if (typeof window === "undefined") return null;
  if (!db) db = cargar();
  return db;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Devuelve la base de datos (null durante el render del servidor / hidratación) */
export function useDB(): DB | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

export function useStorageOk(): boolean {
  useDB();
  return storageOk;
}

export function actualizar(fn: (d: DB) => DB) {
  const actual = getSnapshot();
  if (!actual) return;
  db = fn(actual);
  persistir(db);
  listeners.forEach((l) => l());
}

export function restablecerDemo() {
  db = crearDatosDemo();
  persistir(db);
  listeners.forEach((l) => l());
}

let contador = 0;
export function nuevoId(prefijo: string): string {
  contador++;
  return `${prefijo}${Date.now().toString(36)}${contador}`;
}
