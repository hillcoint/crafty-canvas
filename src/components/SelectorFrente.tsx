import { actualizar } from "@/lib/store";
import type { DB } from "@/lib/types";
import { TIPO_FRENTE_LABEL } from "@/lib/types";
import { Campo, Input, Select } from "./field-ui";

/** Selector compartido de obra / frente / fecha (se guarda en localStorage) */
export function SelectorFrente({ db, conFrente = true }: { db: DB; conFrente?: boolean }) {
  const { obraId, frenteId, fecha } = db.seleccion;
  const frentes = db.frentes.filter((f) => f.obraId === obraId);

  const set = (patch: Partial<DB["seleccion"]>) =>
    actualizar((d) => ({ ...d, seleccion: { ...d.seleccion, ...patch } }));

  return (
    <div className={`grid min-w-0 grid-cols-1 gap-3 ${conFrente ? "sm:grid-cols-2 lg:grid-cols-3" : "sm:grid-cols-2"}`}>
      <Campo label="Obra">
        <Select
          value={obraId}
          onChange={(e) => {
            const f = db.frentes.find((x) => x.obraId === e.target.value);
            set({ obraId: e.target.value, frenteId: f?.id ?? "" });
          }}
        >
          {db.obras.length === 0 && <option value="">Sin obras</option>}
          {db.obras.map((o) => (
            <option key={o.id} value={o.id}>{o.nombre}</option>
          ))}
        </Select>
      </Campo>
      {conFrente && (
        <Campo label="Frente">
          <Select value={frenteId} onChange={(e) => set({ frenteId: e.target.value })}>
            {frentes.length === 0 && <option value="">Sin frentes</option>}
            {frentes.map((f) => (
              <option key={f.id} value={f.id}>{TIPO_FRENTE_LABEL[f.tipo]} · {f.nombre}</option>
            ))}
          </Select>
        </Campo>
      )}
      <div className={conFrente ? "min-w-0 sm:col-span-2 lg:col-span-1" : "min-w-0"}>
        <Campo label="Fecha">
          <Input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && set({ fecha: e.target.value })}
            className="w-full"
          />
        </Campo>
      </div>
    </div>
  );
}
