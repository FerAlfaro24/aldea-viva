# ALDEA VIVA — ESPECIFICACIÓN TÉCNICA Y PLAN DE ACEPTACIÓN 0.1

**Edición de transferencia:** 2026-11-02  
**Prioridad:** DOCUMENTO OPERATIVO DE DESARROLLO  
**Destinatarios:** usuario propietario del proyecto, nueva conversación de ChatGPT y Codex en VS Code.  
**Estado:** propuesta de arquitectura y requisitos extraídos de las 29 decisiones; **ninguna implementación de la nueva 0.1 se considera realizada** por la mera existencia de este documento.

> **Empezar aquí para programar.** Leer también `01_BIBLIA_DE_DISENO_0_1_A_1_0.md` antes de tocar las reglas. La Biblia preserva la visión y la historia de decisiones; esta especificación determina las entregas, contratos, pruebas y condiciones para aprobar la versión 0.1. `03_REFERENCIAS_Y_AUDITORIA_FMS_CEO.md` describe antecedentes reutilizables como ideas, pero no como código a copiar.

## 0. En una página: el trabajo real

### Qué debe poder hacer el jugador cuando termine 0.1

1. Abrir una aplicación web horizontal legible en PC y Android.
2. Elegir cualquiera de **tres ranuras** y crear una partida nueva; una ranura ocupada no debe sobrescribirse sin aviso inequívoco.
3. Ver una aldea de grado 1, **primavera, año 1, mes 1, día 1**, con habitantes y familias coherentes y recursos iniciales variables dentro de límites definidos.
4. Revisar individualmente **15–20 habitantes**; observar edad, parentescos, vivienda, atributos generales, habilidades iniciales, salud y desempleo. Las cifras de potencial por oficio son internas, no visibles.
5. Avanzar **1, 7 o 28 días**; el reloj cambia de día/mes/estación/año correctamente, los habitantes cumplen años en la fecha individual, y se registran novedades de calendario.
6. Cerrar la pestaña o aplicación y regresar, recuperando exactamente el estado guardado, incluidos habitantes, relaciones, fechas, inventario y estado RNG.
7. Repetir una generación con igual semilla y obtener el mismo mundo inicial, independientemente de la ranura o el instante real de creación, salvo metadatos externos a la simulación.
8. Usar el juego sin conexión una vez que los activos necesarios se hayan instalado/cacheado correctamente (ver pruebas de PWA); **no** depende de servidor para la simulación.
9. Ver de forma honesta qué menús son operativos y cuáles pertenecen a versiones posteriores.

### Qué NO debe aparentar funcionar en 0.1

- No se produce ni consume comida día a día; no se tala, construye, repara, combate, nace, muere ni llega gente por eventos.
- No hay racionamiento operativo, envejecimiento físico ni aprendizaje por oficios todavía; **sí** cumpleaños y fechas, y modelos para futura progresión.
- No se contratan trabajadores automáticamente; tampoco se permiten asignaciones profesionales que luego el motor no pueda procesar.
- No se calculan porcentajes ficticios de riesgo ni eventos aleatorios dramáticos para decorar.
- La crónica completa llegará después; 0.1 incorpora un registro mínimo correcto y persistente.
- Los edificios iniciales pueden representarse de forma sencilla, sin sistema de construcción/reparación jugable.

### Convenciones de autoridad

**[C] Confirmado por el usuario**, **[R] recomendación técnica**, **[P] pendiente de balance o decisión**, **[D] diferido**. En 0.1, un valor [P] puede hacerse configurable **sin fijarlo como decisión de diseño** si permite terminar el hito y no contradice una regla [C].

---

# PARTE I. CONTRATO DEL PRODUCTO Y ALCANCE

## 1. Entrega funcional mínima pero completa

**Definición de terminada:** se publica una versión navegable desde PC/Android, la simulación conserva integridad y el usuario puede empezar, inspeccionar, avanzar y recuperar una partida después de cerrar. El día 1 y el día 336 deben obedecer al mismo calendario. Requiere demostración y pruebas automatizadas, no una captura de pantalla.

**Valor para el usuario:** conocer a sus vecinos, sentir que la aldea tiene identidad y observar el tiempo avanzar. Debe haber motivos para inspeccionar fichas: diferencias reales en edades, habilidades, familias y pistas, aunque todavía no existan trabajos activos. Evitar texto repetitivo y números idénticos para todos.

**Primera experiencia recomendada [R]:** portada con “Nueva partida / Continuar” → ranura → semilla opcional → creación → presentación de aldea y aviso amable “Tus habitantes aún no tienen oficio; la asignación laboral llegará en una actualización” → exploración de familias/habitantes → avances por días → guardado inequívoco. No imponer tutorial interminable.

## 2. Matriz de alcance priorizada

| Código | Función | Alcance 0.1 | Prioridad | Dependencias | Evidencia exigida |
|---|---|---|---|---|---|
| AV01-001 | Repositorio/build | Ejecutable | P0 | Node/VS Code | instalación, build y test |
| AV01-002 | Calendario 12×28 | Ejecutable | P0 | core | pruebas de bordes |
| AV01-003 | RNG persistible | Ejecutable | P0 | core | igualdad por semilla |
| AV01-004 | Modelo de partida | Ejecutable | P0 | core | serialización redonda |
| AV01-005 | Generación habitantes | Ejecutable | P0 | RNG/modelos | 15–20; invariantes |
| AV01-006 | Generación familiares | Ejecutable | P0 | habitantes | relaciones recíprocas/coherentes |
| AV01-007 | Viviendas al inicio | Ejecutable mínimo | P0 | habitantes/edificios | camas no excedidas |
| AV01-008 | Recursos iniciales | Ejecutable mínimo | P1 | RNG/almacén | variación acotada |
| AV01-009 | Motor de tick diario | Ejecutable | P0 | calendario | avances equivalentes |
| AV01-010 | Cumpleaños | Ejecutable | P0 | edades/calendario | cumple solo una vez/año |
| AV01-011 | Registro básico | Ejecutable | P1 | motor | fecha y tipo correctos |
| AV01-012 | Interrupción de avances | API preparada y testeada | P1 | motor | paro en evento de prueba |
| AV01-013 | UI horizontal | Ejecutable | P0 | vista | Android landscape probado |
| AV01-014 | Lista/ficha habitantes | Ejecutable | P0 | modelos | datos reales e identidades |
| AV01-015 | Guardado 3 ranuras | Ejecutable | P0 | IndexedDB | recuperación/reinicio |
| AV01-016 | Guardado seguro | Ejecutable | P0 | persistencia | error controlado |
| AV01-017 | PWA/offline | Ejecutable o bloqueador documentado | P0 | assets/HTTPS | prueba modo avión |
| AV01-018 | Accesibilidad y legibilidad | Ejecutable | P1 | UI | pruebas táctiles |
| AV01-019 | Documentación | Entregable | P0 | todo | instrucciones de ejecución |
| AV01-020 | Preparación otros sistemas | Contratos mínimos, no lógica final | P1 | arquitectura | revisión de diseño |

**P0:** imprescindible; **P1:** imprescindible para aceptar calidad y continuidad pero puede implementarse en el último hito. Si el tiempo no alcanza, reducir efectos visuales, no reducir integridad de calendario/guardado.

## 3. Decisiones bloqueadas relevantes para 0.1

- Año exactamente **336 días = 12 meses × 28 días**. Estaciones de **84 días**.
- La población inicial es **15–20**, preferiblemente **2–3 niños** y suficientes adultos.
- Los habitantes presentan familias variadas, no solo individuos aislados.
- Todos los adultos empiezan desempleados y el jugador hará su primer nombramiento manualmente **cuando los oficios sean funcionales**.
- Las viviendas iniciales se distribuyen automáticamente priorizando familias/menores. El jugador podrá corregirlas manualmente en el sistema correspondiente, y sus órdenes prevalecerán; **en 0.1 no hace falta editor de vivienda si aún no está el módulo de viviendas**, pero la estructura debe estar lista.
- Atributos generales propuestos: fuerza, resistencia, agilidad, destreza, vitalidad. Habilidades: agricultura, tala, construcción, combate. Valores de referencia 0–100.
- Potencial **diferente por oficio y oculto**; pistas narrativas tempranas, descubrimiento progresivo después.
- Edades mínimas futuras: **12 agricultura, 14 construcción, 15 tala, 16 combate**; 0–11 no trabajan.
- Almacén futuro compartido; madera natural ilimitada hasta 1.0, no madera gratis en inventario.
- Guardado **automático**, **tres ranuras**, sin lista de recargas anteriores para deshacer resultados. Persistencia local, offline.
- La muerte será permanente una vez que sea posible morir; fin solo si no queda nadie vivo. Sin nacimientos durante 1.0.

## 4. Asuntos que CODEx no resolverá silenciosamente

**[P1] Viviendas 15 camas vs 15–20 habitantes.** Propuesta anterior: 10 solares, 3 casas × 5 plazas, 2 huertos, 1 almacén; son **6 solares usados y 4 libres**, pero pueden quedar hasta cinco personas sin vivienda. Para 0.1: **representar el conflicto honestamente**; nunca crear una cuarta casa fantasma ni aumentar camas invisiblemente. La penalización por frío no existe aún. Validación: cero superposiciones de plazas y recuento coherente de personas sin hogar. En 0.2 se revisará el balance con el jugador.

**[P2] Reserva inicial de comida/madera.** Variación leve confirmada; rangos numéricos no confirmados. Usar constantes de desarrollo explícitas y testeadas, no prometerlas como economía definitiva.

**[P3] Nombre, sexo/género, parentesco exacto, representación cultural y nombres propios.** No se definieron distribuciones cerradas. Diseñar un generador respetuoso y coherente; no imponer reglas de árbol genealógico más complejas de lo necesario. No inferir que todas las familias son nucleares ni todas las parejas casadas.

**[P4] Valores de salud, hambre y atributos.** Inicializar estados coherentes para mostrar en UI, pero no simular aún sus deterioros; fórmulas futuras pendientes.

**[P5] Cumpleaños al arrancar.** Generar día y mes de cumpleaños consistentes con la edad inicial. No usar año gregoriano. Definir claramente cómo se representa la fecha de nacimiento y qué día cumple; evitar que todas las personas cumplan años al terminar el año.

**[P6] PWA y guardado offline real.** Dependen del entorno final: navegador/instalación, origen HTTPS y política de almacenamiento del Android. Hay que probarlo; ningún README sustituye la prueba.

---

# PARTE II. ESTRUCTURA DE CÓDIGO Y MODELO DE DOMINIO

## 5. Arquitectura modular [R]

**Elección sugerida:** React + TypeScript + Vite + Vitest + `idb` o envoltorio pequeño de IndexedDB; PWA mediante plugin mantenido o service worker controlado. No hace falta motor gráfico 3D. Si el repositorio existente ya usa una tecnología comparable, revisar primero antes de inicializar; el usuario está trabajando en otra conversación, así que **no sobrescribir su GitHub**.

```
src/
  app/                 # rutas/estado de UI, composición de pantallas
  components/          # tarjetas, barras, botones, cabeceras, avisos
  screens/             # inicio, ranuras, aldea, habitantes, ficha, crónica
  game/
    core/
      calendar.ts      # lógica pura de fechas
      rng.ts           # RNG serializable, derivación de semillas
      tick.ts          # avance de un día y bucle de 1/7/28
      eventQueue.ts    # contrato de interrupciones, aún sin eventos complejos
    generation/
      generateVillage.ts
      generateFamilies.ts
      generateVillagers.ts
      generateHousing.ts
      names.ts
    models/
      calendar.ts
      resident.ts
      family.ts
      village.ts
      building.ts
      save.ts
      log.ts
    rules/
      initialConfig.ts # valores provisionales/edades/constantes
    selectors/         # estado derivado de población, viviendas, alertas
    validation/        # invariantes; validar guardados antes de cargar
  storage/
    repository.ts      # API por ranuras
    indexedDb.ts      # adaptador único
    migrations.ts
  styles/
  main.tsx
public/
  icons/
docs/
  01_BIBLIA_DE_DISENO_0_1_A_1_0.md
  02_ESPECIFICACION_EJECUTABLE_0_1.md
  03_REFERENCIAS_Y_AUDITORIA_FMS_CEO.md
tests/
  core/
  generation/
  storage/
  integration/
```

La estructura **no obliga a crear módulos vacíos**. Crear el menor número de archivos que conserve límites claros. Nunca poner RNG, mutaciones del mundo o guardado dentro del JSX.

### 5.1. Regla de dependencias

`game/core + models + generation + rules` → **sin importaciones de React, DOM, IndexedDB ni browser APIs**. `storage` conoce tipos y validación del juego; `screens/components` consumen selectores y comandos de aplicación; `app` orquesta motor y persistencia. Esto permite ejecutar pruebas de la simulación en Node sin navegador, y más adelante empaquetar Android sin reescribir reglas.

### 5.2. Flujo unidireccional

`Acción UI → comando de aplicación → validación de orden → transición de simulación pura → estado nuevo + sucesos → persistencia → confirmación UI`. Nunca `setState` de React que cambie una habilidad sin pasar por transición de juego. Si falla guardado, mostrar fallo y conservar estado temporal hasta recuperar, sin afirmar que se guardó.

### 5.3. Estado, no duplicación

La población se deriva de habitantes vivos; camas ocupadas de asignaciones; estación y mes de un contador temporal canónico; no mantener simultáneamente tres contadores editables que puedan discrepar. Si por motivos de rendimiento se cachean agregados, tratarlos como derivables, no como verdad primaria.

## 6. Contratos de datos iniciales recomendados [R]

Los siguientes fragmentos **son ejemplos de diseño**, no código ya implementado ni límites arbitrarios confirmados.

```ts
type ID = string;
type Profession = 'farmer' | 'woodcutter' | 'builder' | 'warrior';
type Season = 'spring' | 'summer' | 'autumn' | 'winter';
type TraitKey = 'strength' | 'endurance' | 'agility' | 'dexterity' | 'vitality';

interface GameDate {
  /** Días enteros transcurridos desde el inicio; 0 = día 1/mes 1/año 1 */
  elapsedDays: number;
}

interface RngSnapshot {
  algorithm: 'mulberry32-v1' | string; // fijar algoritmo real y versión
  originalSeed: string;
  state: unknown; // serializable; varios flujos si es necesario
}

interface Family {
  id: ID;
  displayName: string;
  memberIds: ID[];
  // parent/child/spouse/sibling se representa con IDs en Resident
}

interface Resident {
  id: ID;
  displayName: string;
  familyId?: ID;
  relations: {
    parentIds: ID[];
    childIds: ID[];
    partnerId?: ID;
    siblingIds: ID[];
  };
  birthDayOfYear: number; // 1..336
  initialAge: number;      // edad al día de inicio
  alive: boolean;
  death?: { atElapsedDay: number; cause: string };
  housingId: ID | null;
  profession: Profession | null; // 0.1: SIEMPRE null
  workplaceId: ID | null;
  attributes: Record<TraitKey, number>;
  skills: Record<Profession, {
    effective: number;
    historicalBest: number;
    experience: number;
    potentialSecret: number; // 0.1 NO aparece en ficha
  }>;
  condition: { health: number; hunger: number };
  initialClueIds: string[]; // pistas derivadas, no mentira al jugador
  historyEventIds: ID[];
}

interface Building {
  id: ID;
  type: 'house' | 'orchard' | 'warehouse' | 'wall' | string;
  slotId: ID;
  condition: number; // 0..100; 0.1 fijo, 0.2+ con deterioro
  housingCapacity?: number;
  workerCapacity?: number;
  storageCapacity?: number;
}

interface ChronicleEntry {
  id: ID;
  elapsedDay: number;
  type: 'founded' | 'birthday' | 'season_changed' | 'year_changed' | 'eligible_job' | string;
  subjectIds: ID[];
  params: Record<string, string | number | boolean>;
}

interface VillageState {
  id: ID;
  grade: number; // inicio 1
  date: GameDate;
  residents: Resident[];
  families: Family[];
  buildings: Building[];
  constructionSlots: Array<{ id: ID; buildingId: ID | null }>;
  inventory: { food: number; wood: number };
  housingAssignments: Array<{ residentId: ID; houseId: ID | null; source: 'system' | 'player'; locked: boolean }>;
  chronicle: ChronicleEntry[];
  pendingDecision: null | { id: ID; type: string; sinceElapsedDay: number };
}

interface SaveEnvelope {
  format: 'aldea-viva-save';
  schemaVersion: number;
  gameVersion: string;
  savedAt: string; // solo metadato real; NO afecta RNG
  slot: 1 | 2 | 3;
  rng: RngSnapshot;
  village: VillageState;
}
```

**Ajustes imprescindibles al pasar a código:**

- No guardar un `age` que suba diariamente y además derive de `birthDayOfYear` sin sincronización. **Solución recomendada:** almacenar `initialAge`, `birthDayOfYear` y fecha absoluta; `currentAge` se deriva con función pura. Al cumplirse años desde inicio se suma 1; para no sumar cumpleaños en el día 0, tomar los días pasados del rango `1…elapsedDays`. Para las personas nacidas después de inicio (fuera de 1.0) ampliar el modelo a fecha de nacimiento real.
- `familyId` no expresa por sí solo parejas y hermanos de varias generaciones: relaciones explícitas deben ser recíprocas cuando corresponda. No permitir parentescos imposibles.
- No confundir `potentialSecret` con un multiplicador visible de habilidad. Un novato puede tener mucho potencial y poca habilidad inicial.
- Las pistas (`initialClueIds`) pueden ser derivables del secreto + atributos y fijarse al crear, para evitar que cambien sin motivo.
- En 0.1, `condition` de edificios no avanza; `health` y `hunger` tampoco cambian mientras sus sistemas no estén implementados. Es preferible un estado inmóvil a fingir desgaste sin consecuencias.
- No exportar secretos en APIs públicas o DOM. Un JSON local para guardado sí los necesita, y un jugador técnico podría inspeccionarlo: no es sistema criptográfico.
- Guardar `slot` fuera del estado determinista también es válido. Si el ID de aldea se genera del timestamp, no incluirlo en la comparación de mundos por semilla.

### 6.1. Modelo de políticas futuras: reservar espacio sin sobrediseñar

**No construir el sistema de raciones en 0.1.** Pero evitar que el inventario sea simplemente dos textos de React. Se debe poder añadir después:

- `foodRation: abundant | normal | reduced | emergency`.
- `foodPriority: balanced | children | workers | selectedHouses` + `houseIds` cuando proceda.
- `storage` con **capacidad combinada** de comida y madera, no almacenes mágicos por recurso.
- `manualLock`, `assignmentSource`, `authorizedTask` en futuras asignaciones.
- `production`, `consumption`, `injuries`, `events`, `combat` como etapas de tick separadas.

No es necesario crear todos estos campos en partidas 0.1 si se pueden añadir con migraciones versionadas y valores por defecto; **mejor un esquema pequeño pero extensible que docenas de propiedades vacías**.

## 7. Determinismo como contrato del motor

**Riesgo habitual:** generar habitantes con semilla, pero usar `Math.random()` en cumpleaños, listas, IDs, animaciones o eventos, rompiendo reproducibilidad.

**Contrato recomendado:**

1. Elegir un algoritmo RNG estable con versión publicada en `rng.algorithm`; no cambiarlo sin migración o política de compatibilidad.
2. Generar únicamente a través de `rng.next()`, `rng.intInclusive(a,b)`, `rng.pick(items)`; el motor puro no usa `Math.random` ni `Date.now`.
3. Mantener estado RNG serializable; recuperar una ranura no reinicia el RNG a su semilla inicial.
4. Decidir si habrá subflujos `worldgen`, `calendar`, `events`, `production`, `combat`; **recomendados** para que introducir eventos de 0.7 no altere casualmente la identidad inicial. Derivarlos establemente de semilla.
5. La iteración por habitantes/tareas debe tener un orden definido (p. ej., ID de creación), no depender del DOM, del sorting actual de una tabla o del idioma.
6. Las animaciones visuales no consumen números del RNG de la simulación. Si necesitan variación visual, usar CSS/efectos sin repercusión en juego.
7. El motor retorna `nextState` y sucesos derivados; no realiza peticiones HTTP ni escribe en almacenamiento.
8. Una prueba de *replay* aplica una secuencia de acciones idéntica a dos estados con misma semilla y compara resultados canonizados.

**Sobre `Math.random`:** puede usarse fuera del motor solo para proponer una nueva semilla aleatoria, preferentemente `crypto.getRandomValues` para evitar duplicados; una vez elegida, esa semilla dirige todo el mundo.

### 7.1. Distinción entre aleatoriedad y proyección

La UI nunca debe inventar «probabilidades» para decorar una ficha. Los valores ocultos no se anuncian como certeza. En el futuro, una estimación de 70–80% implica cálculo documentado, incertidumbre de información y validación con pruebas estadísticas de numerosas semillas.

## 8. Calendario: especificación formal

**Representación recomendada:** `elapsedDays ∈ ℤ`, `elapsedDays >= 0`; `elapsedDays = 0` es **año 1, mes 1, día 1**. Para un día cualquiera:

```ts
const DAYS_PER_MONTH = 28;
const MONTHS_PER_YEAR = 12;
const DAYS_PER_YEAR = 336;
const DAYS_PER_SEASON = 84;

const year = Math.floor(elapsedDays / 336) + 1;
const dayOfYear = (elapsedDays % 336) + 1;    // 1..336
const month = Math.floor((dayOfYear - 1) / 28) + 1;
const dayOfMonth = ((dayOfYear - 1) % 28) + 1;
const seasonIndex = Math.floor((dayOfYear - 1) / 84); // 0..3
```

**Esta fórmula es una recomendación validable, no una decisión histórica sobre representación interna**. Lo confirmado son las fechas y límites.

**Ejemplos que tienen que funcionar:**

| `elapsedDays` | Año | Mes | Día del mes | Día del año | Estación |
|---:|---:|---:|---:|---:|---|
| 0 | 1 | 1 | 1 | 1 | Primavera |
| 27 | 1 | 1 | 28 | 28 | Primavera |
| 28 | 1 | 2 | 1 | 29 | Primavera |
| 83 | 1 | 3 | 28 | 84 | Primavera |
| 84 | 1 | 4 | 1 | 85 | Verano |
| 167 | 1 | 6 | 28 | 168 | Verano |
| 168 | 1 | 7 | 1 | 169 | Otoño |
| 251 | 1 | 9 | 28 | 252 | Otoño |
| 252 | 1 | 10 | 1 | 253 | Invierno |
| 335 | 1 | 12 | 28 | 336 | Invierno |
| 336 | 2 | 1 | 1 | 1 | Primavera |
| 671 | 2 | 12 | 28 | 336 | Invierno |
| 672 | 3 | 1 | 1 | 1 | Primavera |

### 8.1. Cumpleaños: semántica testable

Generar `birthDayOfYear ∈ [1,336]` y `initialAge >= 0`. El cumplimiento de años sucede cuando un avance llega a un día cuyo ordinal del año coincide con `birthDayOfYear`. Como la partida inicia día 1 y no se ha avanzado todavía, una persona con cumpleaños día 1 **no cumple de inmediato**; su siguiente cumpleaños ocurre al entrar en el día 1 del año 2 (después de 336 avances). Para cumpleaños día 2, el siguiente ocurre con el primer avance. Guardar la fecha de cumpleaños, no solo edad. El render de edad debe coincidir con el número de cumpleaños transcurridos desde el comienzo. No sumar dos años al saltar del último día al nuevo año.

**La notificación de oficios desbloqueados** cuando alguien cumpla 12/14/15/16 se diseñará como evento informativo básico en 0.1, sin asignación automática. El que cumpla 16 debe poder tener simultáneamente varias profesiones permitidas; mostrar novedad clara sin ruido redundante.

### 8.2. Orden del tick diario [R]

En 0.1: (i) comprobar ausencia de `pendingDecision`, (ii) avanzar fecha un día, (iii) detectar cumpleaños, edades habilitadas, nueva estación/año, (iv) emitir entradas de registro, (v) comprobar interrupción simulada si hay prueba, (vi) devolver estado y eventos. Cuando se activen sistemas posteriores, insertar etapas con orden documentado (asignaciones válidas → clima → producción → consumo → salud → deterioro → seguridad → eventos → log → estado final), siempre con la misma semántica y pruebas. **No cerrar ahora un orden balanceado que nunca se debatió.**

### 8.3. Avance múltiple y eventos pendientes

```ts
function advanceDays(state: VillageState, count: 1 | 7 | 28): AdvanceResult {
  let current = state;
  const events: ChronicleEntry[] = [];
  let processed = 0;
  for (let i = 0; i < count; i++) {
    if (current.pendingDecision) break;
    const result = tickOneDay(current);
    current = result.state;
    events.push(...result.events);
    processed++;
    if (current.pendingDecision) break;
  }
  return { state: current, processedDays: processed, events,
           interrupted: Boolean(current.pendingDecision) };
}
```

En 0.1 no hay eventos mayores reales, pero escribir prueba de interrupción sintética: si el evento aparece al noveno día de un avance de 28, el resultado debe haber procesado **exactamente nueve días**, no 28. Resolver decisión y reanudar será parte del contrato futuro; el juego nunca avanzará de fondo sin la orden del jugador.

---

# PARTE III. GENERACIÓN DE POBLACIÓN, FAMILIAS Y VIVIENDA

## 9. Generación reproducible de habitantes

### 9.1. Entradas y salidas

**Entrada:** `seed`, reglas de población, catálogos de nombres y configuración provisional.  
**Salida:** habitantes, grupos familiares, relaciones, pistas, edificios iniciales, ocupación de camas, inventario, registro de fundación, RNG en estado posterior a la generación.

**Prueba primordial:** si la entrada es igual, toda salida de simulación relevante es igual. Los IDs pueden ser derivados de orden de creación (`r0001`, `f0001`, `b0001`) o de RNG controlado, **no de reloj real**.

### 9.2. Orden sugerido de generación [R]

1. Obtener población objetivo `15..20`, niños objetivo preferente `2..3` sin convertir en regla absoluta si la coherencia lo exige.
2. Definir composición de unidades convivenciales: algunas parejas, grupos con hijos, hermanos y personas solas; evitar forzar una familia de cinco en todas las semillas.
3. Crear relaciones familiares plausibles antes de asignar números definitivos: padres suficientemente mayores que hijos; hermanos con edades coherentes; parejas adultas donde corresponda. Usar un generador que pueda reintentar con RNG controlado si hay conflicto.
4. Generar identidad: nombre, apellido/apelativo coherente, identificador estable, cumpleaños, edad inicial.
5. Generar atributos generales y habilidades con distribución acotada (no todos iguales, ni todos héroes); generar potencial **por cada uno de cuatro oficios** independientemente, permitiendo correlaciones moderadas si se justifica, sin un potencial global obligatorio.
6. Generar pistas narrativas apoyadas por señales reales, sin prometer un valor oculto exacto y sin mostrar el secreto.
7. Crear la aldea y edificios provisionales. Distribuir camas por prioridades familiares, respetando cupos.
8. Generar pequeñas variaciones iniciales de recursos con semilla. Registrar entrada de fundación.
9. Validar invariantes; si falla, fallar controladamente en desarrollo y **no entregar partidas corruptas al usuario**.

### 9.3. Reglas de coherencia y advertencias

- Un hijo no puede tener un progenitor con menos edad que él; fijar diferencia mínima **configurable**, no un número definitivo atribuido al usuario.
- Las relaciones recíprocas deben concordar: si A es progenitor de B, B lo reconoce; si A es hermano de B, B también; las parejas adultas se reconocen en ambas direcciones.
- Una persona no puede ser su propio padre/madre, pareja o hermano; prevenir ciclos imposibles de descendencia.
- Los solitarios no reciben hijos ficticios solo para completar plantilla de familias.
- Edad actual no puede ser negativa; cumpleaños 1..336.
- Cada habitante pertenece a como máximo una unidad familiar principal; los parentescos pueden cruzar unidades si se extiende el sistema más tarde.
- No fijar género o sexo si no es requisito técnico en 0.1; cualquier dato que sí exista debe mantenerse coherente sin estereotipar habilidades.
- No garantizar que todos tengan vivienda: la **escasez de 15 camas** es un conflicto real de balance acordado como pendiente.
- En la 0.1, no aplicar mortandad ni nacimientos invisibles para corregir tamaños de población.

### 9.4. Distribuciones [P]

La mezcla exacta de edades, el número de unidades familiares, la frecuencia de grupos de cinco, los valores iniciales de estadísticas y el balance de indicios no fueron cerrados. Guardarlos en `initialConfig.ts`, documentarlos como **configuración provisional de generación** y permitir cambiarlos sin reestructurar entidades. Añadir estadísticas de generación sobre ≥1000 semillas para detectar fallos: mínimo/máximo de habitantes, edades, menores y familias.

## 10. Vivienda al inicio

**Hecho histórico:** asignación inicial automática priorizando familias, sobre todo con hijos; caben desconocidos en camas sobrantes; usuario podrá mover personas manualmente y proteger esos movimientos cuando el menú exista. **Propuesta de balance todavía pendiente:** tres casas de cinco camas (capacidad 15), huertos 2 y almacén 1, 10 solares. No inventar cuarta vivienda para tapar la inconsistencia.

**Algoritmo recomendado [R]:**

1. Calcular unidades familiares y capacidad de camas existente.
2. Ordenar de forma determinista por prioridad: familias con menores, otras familias, grupos pequeños y solitarios; usar desempate basado en identificador/semilla.
3. Tratar de mantener junta cada unidad cuando exista espacio suficiente; si no existe, dividir con la menor separación razonable, registrando qué miembros quedan fuera.
4. No rebasar capacidad; registrar `housingId=null` para quien no tenga cama y reflejarlo claramente en UI.
5. Marcar estas asignaciones con `source='system'`, `locked=false`; las asignaciones manuales futuras tendrán `source='player',locked=true`.

**Nota de diseño:** no se acordó algoritmo óptimo específico de empaquetamiento de familias ni criterio de separación en casos extremos. Valorar comprobaciones: niños no deben terminar sistemáticamente solos si puede evitarse; distribución respetuosa ante conflicto.

### 10.1. ¿Permitir mover residentes en 0.1?

No imprescindible si 0.2 entregará la gestión de viviendas. Si el usuario desea probarla antes, crear una única acción mínima con invariantes de cupos y protección de orden manual, **sin desarrollar todo el módulo 0.2**. El equipo debe decidir alcance en GitHub antes de añadirla y mantenerla fuera de la condición de cierre P0.

## 11. Estados iniciales y futuro del personaje

**Inicializar:** estado vital vivo, desempleado, sin puesto laboral, salud y hambre visibles y coherentes, habilidades iniciales, potenciales ocultos por profesión, experiencia inicial (en 0.1 normalmente cero o valor explicado), historial personal pequeño. El dominio debe diferenciar:

- `age`: calendario, cumpleaños.
- `attributes`: capacidades generales, mejora y declive futuro.
- `skillEffective`: dominio actual de oficio, experiencia y posible desuso muy lento después.
- `skillHistoricalBest`: maestría previa para recuperación más rápida.
- `potentialSecret`: techo/velocidad individual de progreso según oficio; no universal.
- `condition`: salud y hambre del día, no atributos hereditarios.

**No implementar en 0.1:** progreso real por ejercicio, pérdida por edad, XP por crisis, secuelas, recuperación por trabajo, revelación progresiva del potencial, muerte. Pero no crear `Resident` como objeto plano de “nombre, edad, nivel general”, porque eso rompería el futuro.

### 11.1. Pistas sin revelar el secreto

Mostrar textos como «Parece aprender deprisa» o «Constitución resistente» únicamente si hay reglas consistentes detrás. En 0.1 deben indicar **indicios**, no un examen exacto del mejor oficio. Evitar que pistas den falsos consejos por RNG independiente del potencial. Pistas y reglas que las generan estarán documentadas/testadas.

---

# PARTE IV. PERSISTENCIA, RECUPERACIÓN Y OFFLINE

## 12. Las tres ranuras y el contrato de guardado

**[C]** tres ranuras locales independientes, guardado automático, un estado reciente por ranura; sin “cargar antes de la muerte” mediante historial de checkpoints. Al crear partida se guarda; al avanzar días se guarda; al modificar algo persistente, se guarda. Cerrar y volver equivale a continuar la última transacción confirmada.

**[R]** IndexedDB, una base con tabla `slots` clave `1|2|3` que almacene por ranura `{saveEnvelope, metadata}` en una transacción atómica. Usar un sistema de validación de datos (p. ej. Zod o validadores TS/JSON Schema) a la entrada, no confiar únicamente en `as GameState`.

**Interface recomendada:**

```ts
interface SaveRepository {
  listSlots(): Promise<Array<{ slot: 1|2|3; occupied: boolean; summary?: SlotSummary }>>;
  load(slot: 1|2|3): Promise<SaveEnvelope | null>;
  save(slot: 1|2|3, data: SaveEnvelope): Promise<void>;
  delete(slot: 1|2|3): Promise<void>;
}
```

**Requisitos de experiencia y seguridad:**

1. Nueva partida en ranura vacía: crear/validar/guardar y luego abrir.
2. Ranura ocupada: confirmación explícita antes de borrar/sobrescribir. Si usuario cancela, no cambia nada.
3. Guardado en curso: mostrar “Guardando…”; si falla, mostrar “No se pudo guardar”, conservar estado en memoria y permitir reintento. **No anunciar «guardado» hasta confirmar la transacción.**
4. Evitar carreras: si usuario pulsa +28 dos veces, serializar comandos y persistencia. Propuesta simple: bloquear botones durante transición/guardado.
5. Mantener último snapshot válido ante escritura abortada. En IndexedDB, una transacción sobre un mismo registro es atómica; probar condiciones de fallo en adaptador inyectado.
6. `schemaVersion`: leer versiones conocidas y migrarlas; versiones futuras desconocidas no se cargan a ciegas ni se sobreescriben.
7. Datos inválidos: mostrar explicación y posibilidad de reintentar/recuperar exportación; no inicializar silenciosamente encima del guardado antiguo.
8. Diferenciar `GameDate` del `savedAt` real; el reloj del Android no puede envejecer la aldea mientras la aplicación está cerrada.
9. Tres ranuras **no equivalen** a tres checkpoints del mismo mundo; cada una es una aldea independiente.
10. Si se borra caché/datos del sitio/dispositivo puede perderse partida; offline ≠ respaldo universal.

### 12.1. Exportación de partida [R adicional, recomendada]

El usuario pidió sobre todo automático; la **exportación/importación JSON** no fue una decisión cerrada, pero es muy recomendable antes de pruebas extensas en Android, porque IndexedDB puede borrarse accidentalmente y facilitará migrar a APK. Puede incluirse en 0.1 si no desplaza P0, o inmediatamente después de la 0.1. El archivo de exportación es una copia externa voluntaria y por tanto no se puede garantizar que impida físicamente volver atrás; no prometer imposibles.

### 12.2. Validación del guardado

Validar versión, rango de fecha, IDs únicos, ausencia de referencias colgantes, `birthday 1..336`, 15–20 habitantes **solo al crear** (la población variará en futuras versiones), tres ranuras, inventario no negativo, edificios con estado 0–100, asignaciones sin duplicados, capacidad de vivienda, RNG reconocible. **No imponer 15–20 para siempre** porque en 0.5/0.6 habrá muertes y más tarde visitantes.

### 12.3. Pruebas de persistencia en dispositivos

- Generar partida, avanzar 7 días, cerrar pestaña, reabrir en misma URL/origen: mismo estado.
- Crear segunda y tercera ranura; alternar, avanzar solo una, recargar; ninguna otra cambia.
- Guardado mientras hay una escritura fallida simulada: conservar registro previo válido, aviso claro.
- Instalar PWA en Android, navegar por modo avión tras precarga y confirmar funcionamiento.
- Cambiar a nueva versión de la PWA sin perder IndexedDB; actualizaciones de caché no deben borrar saves.
- Si se usa web y APK más tarde, **son orígenes/almacenes distintos**; no prometer transferencia automática. Exportación/importación resuelve el problema cuando se implemente.

## 13. PWA y orientación horizontal

**[C]** Android primero, horizontal y usable sin internet. **[R]** web app manifest con `display: standalone`/`fullscreen` si se justifica, `orientation: landscape`, iconos correctos y service worker que precachee recursos versionados; `meta viewport` adecuado; aviso de rotación si el navegador no garantiza bloqueo de orientación.

**Imprescindible:** PWA moderna servida desde HTTPS o `localhost` para registrar service worker; abrir `index.html` directamente desde disco **no garantiza** instalabilidad ni offline. Hacer prueba real. `orientation` del manifiesto es una preferencia de plataforma y no asegura bloqueo en todos los navegadores. No eliminar accesibilidad del sistema simplemente para fijar paisaje.

**Política SW recomendada:** cachear assets con nombres/versiones; permitir actualización controlada, no `cache.put` indiscriminado de toda URL; nunca cachear estado de juego en el service worker. Persistencia en IndexedDB, distinta de caché de activos. Crear mecanismo visible si una actualización requiere reiniciar, evitando mezclar chunks JS de versiones distintas.

---

# PARTE V. PANTALLAS, NAVEGACIÓN Y ERGONOMÍA

## 14. Mapa de navegación 0.1

```
Inicio / título
  ├── Continuar ranura 1/2/3
  ├── Nueva partida → elegir ranura → semilla opcional → confirmar
  └── Información breve de versión
         ↓
Aldea (panel principal)
  ├── Habitantes (lista)
  │     ├── ficha residente
  │     │      ├── familia/relaciones enlazadas
  │     │      ├── atributos + habilidades
  │     │      └── vivienda, estado, pistas e historial
  │     └── filtros básicos
  ├── Edificios iniciales (vista resumen de solo lectura)
  ├── Crónica básica (fundación/cumpleaños/estación)
  └── Avanzar 1 / 7 / 28 días → guardado automático
```

La UI puede fusionar vistas si mejora la experiencia en pantallas pequeñas. No inventar un mapa interactivo complejo como requisito 0.1. La pantalla principal debe sentirse como juego medieval, no un CRUD administrativo desnudo, pero ninguna decoración puede impedir leer los datos. No copiar recursos gráficos o logos de FMS CEO.

### 14.1. HUD imprescindible

- Nombre “Aldea Viva” y grado de aldea.
- Año/mes/día/estación visibles con coherencia; posiblemente contador ordinal anual.
- Número de vivos y población inicial (no mostrar muertes simuladas si no hay sistema).
- Alimentos y madera iniciales, marcados como recursos **aún sin economía activa**.
- Viviendas ocupadas / capacidad / sin techo, sin ocultar el desajuste.
- Estado de guardado (guardando / guardado / error).
- Acceso claro a habitantes y botones +1/+7/+28.

### 14.2. Ficha individual detallada

- Nombre, edad, familia, cumpleaños y casa/sin vivienda.
- Parentescos y navegación entre familiares.
- Estado vivo, salud, hambre **sin simulación todavía**.
- Cinco atributos generales 0–100 con barras y número exacto.
- Cuatro habilidades de oficio 0–100 con valor exacto; profesión actual: desempleado.
- Una o varias pistas narrativas iniciales sobre constitución/capacidad de aprendizaje, cuando correspondan.
- Historial de cambios de edad/acontecimientos, fechas.
- Desbloqueos de profesiones por edad **como información**, no botones de asignación funcional.
- No mostrar `potentialSecret` en la UI ni un porcentaje futuro fingido.

### 14.3. Menús futuros

Mostrar menú inactivo o sección “En desarrollo” para agricultura, tala, constructores, guerreros, construcción, raciones, defensa, etc., o simplemente omitir hasta que exista la función; nunca un botón que haga «nada» sin explicación. El usuario quiere aprender los menús de oficio asignando manualmente gente, pero esa experiencia comienza cuando se active la 0.3.

### 14.4. Recomendaciones de usabilidad Android [R]

- Objetivos táctiles cómodos (idealmente ~44–48 CSS px o equivalente), separación entre botones que alteran la simulación y botones de inspección.
- Zona segura respecto a notch/barras del sistema; scroll local donde la lista exceda alto disponible.
- No depender de hover; navegación por pulsación y botones de volver visibles.
- Truncamientos de texto con posibilidad de leer completos; no esconder valores relevantes por efecto visual.
- Probar paisaje en diferentes relaciones de aspecto (16:9 y móviles más alargados), con fuentes escalables.
- Confirmar acciones destructivas de ranuras; no confirmar cada avance de 1 día innecesariamente.
- Usar semántica accesible, labels, contraste y estados de foco; tipografía legible y tamaños suficientes.
- La fecha y el indicador de guardado deben mantenerse localizables incluso al abrir fichas.

---

# PARTE VI. PRUEBAS, CALIDAD Y ACEPTACIÓN

## 15. Estrategia automatizada

**Vitest** para lógica pura y pruebas de integración; para IndexedDB en test usar implementación simulada tipo `fake-indexeddb` o probar repositorio mediante adaptador inyectado. Para PWA/Android, automatización e inspección manual donde sea razonable; no declarar que Android se probó si no hay evidencia.

### 15.1. Calendario y edad: casos determinantes

**CAL-01** `day(0) = primavera, año1/mes1/día1`.  
**CAL-02** `day(27) = primavera, año1/mes1/día28`.  
**CAL-03** `day(28) = primavera, año1/mes2/día1`.  
**CAL-04** `day(83) = primavera, año1/mes3/día28`.  
**CAL-05** `day(84) = verano, año1/mes4/día1`.  
**CAL-06** `day(168) = otoño, año1/mes7/día1`.  
**CAL-07** `day(252) = invierno, año1/mes10/día1`.  
**CAL-08** `day(335) = invierno, año1/mes12/día28`.  
**CAL-09** `day(336) = primavera, año2/mes1/día1`.  
**CAL-10** `day(672) = primavera, año3/mes1/día1`.  
**CAL-11** `advance(28)` es equivalente al resultado de 28 `tickOneDay` desde mismo estado/semilla.  
**CAL-12** cumpleaños día2 se registra al pasar `elapsed 0→1`, no antes.  
**CAL-13** cumpleaños día1 se registra al pasar `elapsed 335→336`, no al iniciar partida.  
**CAL-14** tras 336 ticks, cada habitante vivo cumple exactamente una vez, sin importar día de cumpleaños.  
**CAL-15** al cumplir 12/14/15/16, la elegibilidad se actualiza según oficio; no autoempleo.  
**CAL-16** prueba de interrupción sintética al día 9 de avance 28: `processedDays===9`, sin procesar días 10..28.

### 15.2. Aleatoriedad y creación

**GEN-01** cien ejecuciones de misma semilla producen el mismo snapshot canónico.  
**GEN-02** dos semillas diferentes suelen variar en identidades/valores; verificar sobre conjunto de semillas, no exigir diferencia entre todas las parejas posibles.  
**GEN-03** 1000 semillas: población siempre en [15,20].  
**GEN-04** todas las personas inician `profession=null`, `workplaceId=null`; niños tampoco trabajan.  
**GEN-05** no hay IDs repetidos ni referencias familiares colgantes.  
**GEN-06** parentescos recíprocos; no persona autopariente; sin ciclos padre-hijo.  
**GEN-07** edades/cumpleaños válidos; suficientes adultos según configuración documentada.  
**GEN-08** hay diversidad de unidades familiares, sin obligación de familia de cinco en todas las semillas.  
**GEN-09** los cuatro potenciales de cada habitante existen y son independientes; no se filtran a UI.  
**GEN-10** las pistas narrativas tienen regla reproducible e información no contradictoria.  
**GEN-11** el número de camas ocupadas no supera capacidad total ni por casa.  
**GEN-12** si hay más habitantes que plazas, el número sin vivienda = población - alojados; nunca asignaciones fantasma.  
**GEN-13** comida/madera inicial varían dentro de rangos configurados, sin inventarios negativos.  
**GEN-14** generación no depende de fecha real, zona horaria, idioma de navegador ni ranura.  
**GEN-15** idempotencia: una creación fallida no deja medias familias o ranuras corruptas.

### 15.3. Guardado y recuperación

**SAVE-01** crear en ranura 1 y cargar devuelve snapshot equivalente.  
**SAVE-02** ranuras 1, 2 y 3 son independientes.  
**SAVE-03** intentar sobrescribir ranura ocupada requiere confirmación; cancelar conserva partida.  
**SAVE-04** guardado automático tras crear y tras +1/+7/+28.  
**SAVE-05** recarga conserva `RngSnapshot` y secuencia de resultados futuros.  
**SAVE-06** escritura simulada fallida conserva último estado persistido válido, y UI reporta error.  
**SAVE-07** datos malformados y versiones incompatibles se bloquean con error explicativo, no se sobreescriben.  
**SAVE-08** `savedAt` no cambia simulación al modificar reloj del sistema.  
**SAVE-09** comandos/guardados concurrentes no pisan avances previos.  
**SAVE-10** un cambio de versión con migración conocida preserva IDs/fechas y datos secretos.  
**SAVE-11** borrar una ranura exige confirmación y no toca las otras.  
**SAVE-12** el indicador “Guardado” solo aparece tras éxito real de transacción.

### 15.4. Interfaz, experiencia y offline

**UI-01** lista completa de 15–20 habitantes, sin duplicados visuales.  
**UI-02** ficha coincide exactamente con datos guardados de atributos/habilidades.  
**UI-03** navegación a familiares abre persona correcta.  
**UI-04** ordenación/filtros de lista no alteran orden del RNG ni simulación.  
**UI-05** todos tienen profesión “Sin asignar”; no aparecen botones ficticios de trabajo activo.  
**UI-06** no se ven potenciales secretos en detalles, tooltips, atributos HTML o tarjetas.  
**UI-07** fecha/estación correctas tras +1/+7/+28 y al recargar.  
**UI-08** viviendas y reservas reflejan estado real; sin inventar producción.  
**UI-09** confirmación de sobrescritura/borrado adecuada.  
**UI-10** paisaje Android usable, no hay controles críticos fuera de pantalla.  
**UI-11** funciona sin tocar pantalla con ratón/teclado PC, sin dependencia exclusiva de táctil.  
**UI-12** instalar/cargar web app en Android, activar modo avión y continuar una partida **ya instalada/cacheada**.  
**UI-13** despliegue en GitHub Pages u otro host usa ruta base de Vite/PWA correcta, sin rutas de activos rotas.  
**UI-14** ningún menú inactivo simula actividad; notifica versión futura o no se muestra.

### 15.5. Integración de extremo a extremo

**E2E-01:** nueva partida semilla S, abrir habitante X, anotar edad/atributos/familia; avanzar 28; recargar; verificar fecha y mismos datos (excepto cumpleaños legítimos).  
**E2E-02:** iniciar tres aldeas S1/S2/S3; avanzar solo S2 por 336 días; S1/S3 inalteradas.  
**E2E-03:** una semilla S generada en PC y Android con igual versión produce mismo snapshot de mundo (sin metadatos de dispositivo).  
**E2E-04:** reanudar simulación desde guardado a mitad de año y comparar con 336 avances de una corrida continua de mismas acciones.  
**E2E-05:** con fallo inducido en guardado, el usuario recibe alerta y no pierde silenciosamente el último estado válido.  
**E2E-06:** cambios estacionales y cumpleaños aparecen en registro con fecha correcta; repetir cargar no duplica entradas.

### 15.6. Medidas de calidad mínimas

- `npm run build` exitoso y `npm test` exitoso, con comandos reales anotados en PR/entrega.
- TypeScript sin `any` arbitrarios en modelos base; validación de inputs de IndexedDB.
- Nada de `Math.random`/`Date.now` dentro del motor de simulación.
- Tests borde de calendario, RNG y guardado obligatorios.
- Criterios de accesibilidad táctil y contraste razonables.
- Sin archivos de datos grandes de terceros innecesarios, dependencias redundantes o componentes gigantes incontrolables.
- Ningún reporte de «funciona Android» sin prueba en dispositivo/navegador especificado.

---

# PARTE VII. PLAN DE ENTREGA CON CODEX Y GITHUB

## 16. Hitos, commits y condiciones de paso

### Entrega M0 — Inspección del repositorio (sin destruir trabajo existente)

**Tareas:** abrir repositorio actual; `git status`, listar carpetas, revisar `package.json` y versiones; comprobar si ya hay implementación en la otra conversación. Preparar rama o plan de commits. Adjuntar estos documentos a `/docs`. **No ejecutar `npm create vite` encima de una aplicación existente sin inspección.**

**Salida:** informe de estado: “qué existe, qué falta, qué cambiaré”, comandos instalables y riesgos. Si aún no existe repo, crear uno con README/`.gitignore`/licencia cuando corresponda, sin confundir prototipo FMS CEO con proyecto Aldea Viva.

### Entrega M1 — Dominio, calendario y RNG

**Tareas:** constantes, types, RNG con estado versionado, fecha pura, `tickOneDay`, `advanceDays`, cumpleaños, eventos de calendario, tests de límites y semilla. Distinguir estado mundial de metadatos de guardado.

**Aceptación:** CAL-01..16 y RNG snapshots. UI puede ser mínima.

**Commit sugerido:** `feat(core): calendario de 336 dias y simulacion determinista`.

### Entrega M2 — Generación, familias, viviendas y recursos iniciales

**Tareas:** generador de unidades familiares, edades, nombres, relaciones, habilidades, potencial por oficio, pistas, datos iniciales de edificios, viviendas y almacén; validadores; tests por 1000 semillas. Explicitación del conflicto de camas.

**Aceptación:** GEN-01..15. Sin autoempleo, sin sistemas activos de comida/salud.

**Commit:** `feat(worldgen): habitantes y familias reproducibles`.

### Entrega M3 — Experiencia visual Android horizontal

**Tareas:** portada, tres ranuras, vista de aldea, lista, filtros, ficha, familia, HUD, registro, acciones +1/+7/+28. Componentes con valores reales y sin secretos filtrados. Estado visual de carga y de errores.

**Aceptación:** UI-01..11/14, pruebas de navegador PC y simulación móvil. **No integrar todavía combates ni agricultura**.

**Commit:** `feat(ui): aldea y habitantes en horizontal`.

### Entrega M4 — Persistencia, PWA y pruebas de integración

**Tareas:** IndexedDB transaccional, carga, error recovery, tres ranuras, serialización de RNG, migración base, manifest, service worker, instalación offline; probar Android real y pruebas E2E.

**Aceptación:** SAVE-01..12, UI-12..13, E2E-01..06, build/test y evidencia de uso real.

**Commit:** `feat(save): guardado automatico y pwa offline`.

### Entrega M5 — Auditoría y corte 0.1

**Tareas:** comprobar matriz AV01, revisar bugs reales, controles táctiles, documentación, límites, compatibilidad; confirmar con usuario funcionamiento en Android. Crear etiqueta `v0.1.0` **solo cuando pase aceptación**, publicar notas de versión.

**Salida:** demo o enlace accesible, changelog, capturas opcionales, instrucciones de instalación y lista de conocidos/pendientes. Ninguna función deshabilitada anunciada como implementada.

## 17. Orden concreto para una conversación nueva

1. Recibir los tres documentos e inspeccionar repo/archivos ya existentes.
2. Resumir las **restricciones bloqueadas** y cualquier contradicción visible.
3. Preguntar **una sola cosa** si realmente bloquea el siguiente paso; si no, asumir valores técnicos provisionales explícitos.
4. Trabajar en M0/M1 primero y enseñar código/tests reales.
5. Hacer pequeños commits/PRs, no megaparches imposibles de revisar.
6. Reportar al usuario en español qué cambió, qué se probó y qué queda pendiente.
7. Pasar por aceptación antes de empezar la siguiente versión.

## 18. Formato de reporte para cada entrega

```
HITO: M1 — motor calendario
Estado: completado / parcial / bloqueado
Archivos creados o modificados: ...
Reglas confirmadas respetadas: ...
Pruebas ejecutadas: comando, resultado y cantidad ...
Pruebas NO ejecutadas: ... (motivo)
Decisiones técnicas provisionales: ...
Riesgos/compatibilidad/partidas existentes: ...
Siguiente paso concreto: ...
```

Nunca declarar una prueba “pasada” por inferencia. La captura de una pantalla no valida guardado automático, determinismo ni consistencia de familias.

## 19. Errores que debemos prevenir desde el día uno

| Error frecuente | Daño posterior | Prevención 0.1 |
|---|---|---|
| Usar meses de 30 días por inercia | rompe cumpleaños/estaciones | pruebas 12×28 |
| `Math.random()` mezclado con lógica | no reproducible | RNG inyectado |
| IDs derivados de índice del array | vínculos rotos al ordenar/borrar | IDs estables |
| Edad mutable duplicada | cumpleaños dobles | edad derivada o invariante |
| Guardado ligado al componente | datos perdidos al cambiar pantalla | repositorio dedicado |
| Guardar solo semilla | replay incorrecto tras decisiones | serializar mundo + RNG |
| `localStorage` como solución final | problemas de cuota/corrupción | IndexedDB/validación |
| Actualización SW sin versionado | app vieja y scripts nuevos | cache controlada |
| Potencial global de personaje | oficios sin personalidad | potencial por oficio |
| Autorepartir trabajos al crear | contradice experiencia elegida | desempleo inicial |
| Alojar 20 personas en 15 camas | inconsistencia invisible | sin techo explícitos |
| Cambiar reglas al importar FMS CEO | heredar lógica ajena | referencia aislada |
| Implementar producción antes de tick estable | retrabajo | orden de versiones |
| Guardar en cada tick de +28 con UI concurrente | carreras/bloqueos | comando serial y save final; checkpoint por interrupción |
| Mostrar porcentajes inventados | desconfianza del usuario | motor define probabilidad |
| Diseñar toda 1.0 en tipos gigantes | sobreingeniería | interfaces mínimas extensibles |

## 20. Condición contractual de salida de 0.1

**La versión 0.1 está aprobada si y solo si:**

- Se ejecuta de forma reproducible en el entorno previsto.
- La población aleatoria y las familias cumplen invariantes y guardan su identidad.
- Fecha, estaciones, cumpleaños y avances 1/7/28 son correctos.
- Ningún sistema no implementado muestra datos falsos o altera el mundo sin reglas.
- El guardado automático de tres ranuras funciona, muestra fallos reales y permite continuar tras cerrar.
- El prototipo es legible/usado en Android horizontal y tiene verificación de funcionamiento offline.
- Las pruebas automatizadas de calendario, RNG, generación, vivienda y persistencia pasan, junto con una prueba E2E de continuación.
- Las fuentes de verdad y límites permanecen documentados en el repositorio.

**Importante:** aunque pasar 336 días no cause hambre aún, eso es correcto para la 0.1: el motor de economía de 0.4 y supervivencia de 0.5 no están activos. Una simulación vacía pero honesta es mejor que una muerte injustificable basada en fórmulas temporales no aprobadas.

---

# ANEXO A. MATRIZ DE DEPENDENCIAS HACIA 1.0

| Decisión de 0.1 | Mecanismo futuro que protege | No rehacer luego si… |
|---|---|---|
| fechas absolutas + 336 | estaciones, experiencia, envejecimiento, visitas, ataques | todos leen el mismo calendario |
| RNG inyectado y versionado | eventos y porcentajes | no se usa aleatoriedad suelta |
| IDs estables de residentes | genealogía, muerte, crónica, puestos | relaciones no dependen de índice |
| potencial por profesión | descubrimiento de aptitudes | no se reduce a “nivel total” |
| profesión `null` inicialmente | asignación manual 0.3 | nadie se autocontrata |
| casas/solares por ID | capacidades, derrumbes, ampliaciones | no se guardan números duplicados |
| inventario de recursos separado de capacidad futura | almacén compartido 0.2 | no se codifica capacidad individual falsa |
| política de órdenes manuales | automatización de constructores | órdenes tienen origen/protección |
| `pendingDecision` | eventos y ataques | ticks se interrumpen antes de seguir |
| log de sucesos con fecha y sujetos | crónica 0.7 | no se almacena solo texto libre |
| schemaVersion | mantenimiento continuo hasta 1.0 | hay migraciones y validación |
| lógica separada de UI | APK futura | motor no depende de DOM/React |

# ANEXO B. PROPUESTA DE CASOS DE USO 0.1

**UC01 — Iniciar aldea:** usuario elige ranura vacía y semilla opcional → se genera mundo completo → validación → guardado → pantalla principal. Si guardado falla, mostrar error y no afirmar creación exitosa persistida.

**UC02 — Continuar aldea:** usuario elige ranura ocupada → validar/migrar formato → cargar estado/RNG → mostrar fecha/habitantes correctos. Si versión es incompatible, bloquear edición y ofrecer explicación.

**UC03 — Inspeccionar vecino:** abrir lista → elegir habitante → ficha con atributos y relaciones → ir a familiar → volver sin modificar mundo ni consumir RNG.

**UC04 — Avanzar semana:** botón +7 → procesar siete ticks y todos los cumpleaños/estaciones intermedios → actualizar HUD/registro → guardar → confirmar. Si se simula interrupción, detener y no procesar días posteriores.

**UC05 — Cambiar de ranura:** guardar cambios pendientes o mostrar error → volver a selector → cargar otra aldea sin mezclar memorias de estado.

**UC06 — Cerrar y reabrir:** cerrar web/PWA tras confirmar guardado → reabrir misma instalación/origen → continuar exactamente. No aplicar avance por tiempo real.

**UC07 — Rotar dispositivo:** si está vertical, aviso de giro; al poner horizontal, controles accesibles y progreso intacto. No asumir bloqueo nativo donde no lo haya.

**UC08 — Ranura ocupada:** intentar nueva partida en ranura 1 existente → confirmar sobrescritura → cancelar → contenido previo intacto.

# ANEXO C. FUENTES Y LÍMITES DE PROCEDENCIA

**Fuente primaria de reglas:** 29 decisiones de la conversación de diseño y `01_BIBLIA_DE_DISENO_0_1_A_1_0.md`.  
**Documentos originales disponibles:** `Aldea_Viva_Documento_Maestro.md`, variante `-1.md`.  
**Referencia técnica inspeccionada:** `FMS_CEO-main.zip` y archivos asociados; detalles en `03_REFERENCIAS_Y_AUDITORIA_FMS_CEO.md`.  
**Pruebas antiguas no canónicas:** `aldea_v01.html` a `aldea_v04.html` y `npc_arena_v01.html` a `v05.html`.  
**Límite de memoria:** el corpus accesible incluye las decisiones resumidas y archivos, no una transcripción literal de cada mensaje histórico ni todas las reflexiones ocultas. No atribuir nuevos acuerdos sin soporte.

**Fin de la especificación operativa 0.1.**
