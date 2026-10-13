# M.I Maquinaria · Control de campo

Demo mobile-first para registrar viajes de volquetes, horas de maquinaria, rendimiento diario y comparar el cobro por m³ frente al cobro por horas en obras de terracería de Tabasco (México). Importes en MXN.

## Enlaces y acceso

- Demo: https://m-i-maquinaria-lvb.lovable.app/
- Administración: https://m-i-maquinaria-lvb.lovable.app/admin
- **Contraseña de la demo: `maquinaria2026`**
- Repositorio privado: https://github.com/hillcoint/crafty-canvas
- Editor Lovable: https://lovable.dev/projects/6bd36969-e916-402c-9a58-6c56beb27f9c

La clave es un control básico de interfaz, no autenticación segura. Se cambia en `src/routes/admin.tsx`, constante `ADMIN_KEY`. No se utiliza backend.

## Arranque local

Requiere acceso al repositorio privado, Node.js y Bun (recomendado).

```bash
git clone https://github.com/hillcoint/crafty-canvas.git
cd crafty-canvas
bun install --frozen-lockfile
bun run dev
```

Abrir la URL local indicada en la terminal. Alternativa: `npm install` y `npm run dev`.
Pruebas: `bun run test`. Compilación: `bun run build`.

## Pantallas

| Ruta | Función |
| --- | --- |
| `/` | Frentes: selección de obra, frente, fecha y resumen. |
| `/viajes` | Registro, corrección y eliminación de viajes; m³ por unidad y día. |
| `/horas` | Horómetros de excavadoras/cargadores y horas facturables de volquetes. |
| `/rendimiento` | m³/h reales, rendimiento esperado y alerta inferior al 80 %. |
| `/cobro` | Comparación de cobro por volumen y por horas, filtros y desgloses. |
| `/admin` | Obras, frentes, asignaciones, volquetes, máquinas, tarifas y reinicio de demo. |

## Validaciones y cálculos

- Cada viaje suma la capacidad vigente del volquete y guarda ese valor en el registro histórico.
- Un mismo volquete no puede registrar salidas separadas por menos de 10 minutos, aunque cambie de frente.
- Horas de máquina = horómetro final menos inicial. Se bloquean intervalos solapados, valores negativos y más de 12 h por jornada.
- Las horas facturables de volquetes se registran independientemente de los viajes; se evitan duplicidades para igual unidad, frente y fecha y más de 12 h por día.
- Rendimiento = m³ movidos / horas de excavadora; alerta roja cuando es menor al 80 % de lo esperado.
- Cobro por volumen = m³ por frente × tarifa. Cobro por horas = horas de excavadoras y volquetes × sus respectivas tarifas. El cargador no entra en esta comparación.
- Diferencia = cobro por volumen − cobro por horas; se muestra con signo. Si falta alguna tarifa necesaria, aparece una advertencia.

## Datos simulados

Se precargan **2 obras, 4 frentes, 8 volquetes** (4 de 7 m³, 3 de 14 m³ y 1 de 20 m³), **3 excavadoras y 1 cargador**, tarifas editables y alrededor de un mes de viajes y partes de horas, sin domingos. Son datos ficticios, no de operaciones reales.

Tarifas iniciales de ejemplo: relleno **38 MXN/m³**; corte **45 MXN/m³**; banco **32 MXN/m³**; nivelación **28 MXN/m³**; excavadora de 20 t **1.100 MXN/h**, de 30 t **1.500 MXN/h**; volquetes de 7, 14 y 20 m³: **420, 650 y 850 MXN/h** respectivamente. Existe además una tarifa configurada para cargador (950 MXN/h), excluida del comparador.

## Almacenamiento y reinicio

Todo funciona en el frontend con **React, TypeScript, Tailwind CSS y TanStack Start/Vite**. Los datos se guardan en `localStorage` (`mi-maquinaria-db-v1`), no en un servidor. Persisten al recargar el mismo navegador, pero **no se comparten entre dispositivos ni usuarios**.

Para restablecer: abrir `/admin`, introducir `maquinaria2026`, desplegar **Datos de demostración** y pulsar **Restablecer datos demo**. La operación sustituye todos los datos locales, incluidos los registros introducidos manualmente. Si se borran los datos del sitio, se regeneran los ejemplos.

## Dónde está cada cosa

- `src/routes/`: pantallas y formularios.
- `src/lib/seed.ts`: datos ficticios iniciales.
- `src/lib/calc.ts`: cálculos y validaciones.
- `src/lib/store.ts`: persistencia en `localStorage` y reinicio.
- `src/lib/types.ts`: tipos de datos.
- `src/lib/*.test.ts` y `src/routes/admin.test.tsx`: pruebas automáticas.

## Entrega KODARVIA

Prototipo frontend, sin Supabase, backend, sincronización multiusuario ni autenticación real. Para revisar el repositorio privado, conceder acceso a `partners@kodarvia.com` por GitHub o compartir el proyecto Lovable según el canal acordado, junto con la URL pública de la demo.
