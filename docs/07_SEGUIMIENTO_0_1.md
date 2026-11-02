# Aldea Viva — Seguimiento de la versión 0.1

Fecha de revisión: 2026-11-02. Este documento registra implementación y decisiones de ingeniería; no sustituye las reglas confirmadas del paquete maestro.

## Fuentes y estado inicial comprobado (M0)

- Se leyó `LEEME_PRIMERO.md` del ZIP y se verificaron sus seis documentos contra el dossier integral leído. Se incorporaron sin modificar su contenido, junto con la referencia original.
- El documento maestro anterior del repositorio coincide con la referencia incluida en el ZIP y se conserva.
- Al comenzar: rama `main`, último commit local `ff0c8bf`, sin cambios pendientes. Existían TypeScript 7.0.2, Vite 8.3.5, pantalla de bienvenida, estilos, favicon y comandos de desarrollo/compilación. La compilación inicial pasó.
- No existían motor, generación de habitantes, pruebas de reglas, guardado, PWA ni una partida jugable. No se reinicializó ni reemplazó el proyecto.
- La auditoría de FMS CEO se recibió como documento; su código fuente y los prototipos antiguos no vienen dentro de este ZIP ni se incorporaron al proyecto.

## Reglas que guían la 0.1

- Calendario de 12 meses de 28 días y cuatro estaciones de 84 días.
- Avance de 1, 7 o 28 días mediante pasos diarios, con interrupciones exactas.
- Generación de 15–20 habitantes por semilla, familias coherentes y preferencia por 2–3 menores.
- Todos comienzan sin oficio. Las edades 12/14/15/16 habilitan agricultura/construcción/tala/combate como información; no asignan trabajo.
- Potenciales individuales por oficio y ocultos en la interfaz.
- Tres partidas independientes, guardado automático y funcionamiento sin conexión al completar M4.
- En 0.1 no se activan economía, consumo, deterioro físico, trabajos, construcción, ataques, muertes ni llegadas.

## Hitos

| Hito | Estado | Resultado |
|---|---|---|
| M0 — Revisar y preservar | Completado | Repositorio inspeccionado, compilación inicial correcta y documentación incorporada |
| M1 — Dominio temporal, RNG y tick | Completado | Motor puro con pruebas, aún sin conexión a la pantalla |
| M2 — Generar la aldea | Completado | Familias, habitantes, viviendas, recursos y validación por 1000 semillas; aún sin UI |
| M3 — Interfaz jugable | Completado como sesión temporal | Tres espacios en memoria, aldea, fichas, filtros, registro y controles de tiempo |
| M4 — Persistencia y offline | Implementado y probado en navegadores y pruebas básicas de Android | Tres partidas transaccionales, recuperación, conflictos, PWA offline y actualización |
| M5 — Validación 0.1 | Pruebas básicas completadas; candidata pendiente de auditoría ampliada | Android confirmó instalación, orientación, recuperación offline y tres ranuras; matriz y límites en el documento 08 |

## M1 — Implementación y convenciones

### Separación del código

- `src/game/rules/calendar.ts`: constantes confirmadas y edades laborales.
- `src/game/models/simulation.ts`: contratos de calendario, habitante temporal, RNG, registro y decisión pendiente.
- `src/game/core/calendar.ts`: fecha derivada, edad y oficios habilitados.
- `src/game/core/rng.ts`: creación, recuperación y consumo explícito de aleatoriedad.
- `src/game/core/tick.ts`: paso diario y avances múltiples.
- `tests/core/`: pruebas de calendario, RNG y tick; `tests/fixtures/` contiene datos sintéticos exclusivos de pruebas, no aldeas reales.

`ResidentClock` contiene solo lo necesario para procesar cumpleaños y habilitaciones. `Resident`, incorporado en M2, lo extiende con identidad, familias y características. La pantalla no se rellena con datos ficticios para simular un sistema conectado.

El motor no importa DOM, React, IndexedDB ni APIs del navegador. No guarda datos ni obtiene tiempo real. La interfaz actual permanece sin cambios y todavía muestra la bienvenida.

Archivos de apoyo actualizados: `.gitignore`, `AGENTS.md`, `README.md`, `package.json`, `package-lock.json` y `tsconfig.json`. Se añadieron tres archivos de pruebas en `tests/core/` y su fixture en `tests/fixtures/simulation.ts`. La documentación recibida ocupa `LEEME_PRIMERO.md`, los seis documentos numerados 01–06 en `docs/` y `referencias/Aldea_Viva_Documento_Maestro_original.md`; este seguimiento es el documento 07 creado para el repositorio.

### Calendario y cumpleaños

- `elapsedDays = 0` equivale a año 1, mes 1, día 1. Se rechazan fracciones, negativos y enteros fuera del rango seguro de JavaScript.
- Fecha, mes y estación se derivan de ese contador, sin contadores editables duplicados.
- La edad se deriva de `initialAge`, cumpleaños anual y tiempo transcurrido; no se almacena una segunda edad mutable.
- Un cumpleaños el día 1 ya está incluido en la edad inicial. El próximo ocurre después de 336 avances. Un cumpleaños el día 2 ocurre tras el primer avance.
- El registro diario tiene orden estable: cambio de año, cambio de estación y, por ID de habitante, cumpleaños y nuevas habilitaciones. Ordenar una lista para mostrarla no cambia este registro.
- No se asignan profesiones ni se alteran atributos al cumplir años. El contrato permite ignorar cumpleaños de personas marcadas como fallecidas, pero no implementa mortalidad.

### Generador reproducible

Decisión técnica, no regla narrativa: algoritmo `xorshift32-fnv1a-utf16le-v1`. La semilla se transforma mediante FNV-1a sobre bytes UTF-16LE. Se usa xorshift32 con desplazamientos 13/17/5; el estado cero del hash se sustituye por `0x9e3779b9` para evitar un generador bloqueado. Estos detalles forman parte de la versión y no deben cambiarse silenciosamente.

Se conservan algoritmo, semilla original y estado entero. Cada tirada devuelve un estado nuevo y no modifica el recibido. Los enteros inclusivos usan descarte de la cola del intervalo antes del módulo. Las pruebas cubren ese descarte y un vector fijo de referencia. No se garantiza que cualquier par de semillas posibles produzca siempre mundos distintos: toda transformación a un estado finito puede tener colisiones.

El tick temporal actual no necesita tiradas y conserva el RNG. M2 usará el mismo contrato para generación. Los subflujos por sistema son una posible extensión versionada; no se han creado sistemas aleatorios de economía o combate.

Referencias técnicas: [Xorshift RNGs, George Marsaglia](https://www.jstatsoft.org/article/view/v008i14), [guía de Vitest](https://vitest.dev/guide/).

### Interrupciones y serialización

- `tickOneDay` procesa un día. `advanceDays` acepta exclusivamente 1/7/28 y retorna estado, sucesos nuevos, días procesados, días restantes e indicador de interrupción.
- Una decisión pendiente bloquea nuevos pasos. La extensión `decisionAfterDay` permite probar que una decisión originada en el noveno paso detiene exactamente ahí un avance de 28.
- No se procesan días restantes automáticamente. La resolución de decisiones jugables pertenece a hitos futuros.
- Las pruebas serializan a JSON y recuperan estados temporales y snapshots RNG para comprobar replay. Esto **no implementa guardado**, validación completa de partidas ni migraciones: esas funciones llegan en M4.

## Verificación ejecutada al cerrar M1

- `npm test`: **92 pruebas pasaron en 3 archivos**. Incluye CAL-01..CAL-16, los 336 cumpleaños posibles durante un año, límites estacionales, ausencia de autoempleo, pausa exacta, inmutabilidad, validación de entradas y continuación de secuencias tras serializar el RNG.
- `npm run build`: correcto; incluye comprobación TypeScript de `src/` y `tests/` y compilación Vite.
- Se añadió Vitest 5.1.0. La instalación reportó cero vulnerabilidades. Node.js mínimo se actualizó a 22.12 para reflejar el requisito de la herramienta de pruebas; no se modificó la instalación del sistema.
- No se repitieron pruebas visuales, porque M1 no cambia la interfaz. Las pruebas anteriores de bienvenida en Brave y Opera GX no acreditan una partida jugable.
- Todavía no se han ejecutado GEN, SAVE, UI de juego, E2E ni pruebas de instalación/modo avión en Android físico, pues sus funciones aún no están implementadas.
- No hay ESLint ni Prettier configurados y no se reportan como ejecutados.

## Pendientes de diseño preservados

- Tres casas de cinco camas para hasta veinte personas: M2 debe mostrar quién queda sin vivienda sin aumentar plazas ni reducir población en secreto. No habrá daño por frío en 0.1.
- Diez solares, edificios iniciales, rangos de reservas y distribuciones de atributos/edades siguen siendo propuestas de equilibrio. Cualquier configuración necesaria en M2 será provisional, centralizada y documentada.
- React sigue siendo recomendación. M1 conserva TypeScript + Vite existente porque el motor es independiente de la interfaz; no hay migración automática de tecnología.
- M1 no crea commits, push, etiquetas ni publicaciones. Esas operaciones requieren la autorización del usuario para esta entrega.

## M2 — Creación determinista de la aldea

### Qué se implementó

- `generateVillage(seed)` crea un mundo completo en memoria: grado 1, día 1 de primavera, 15–20 habitantes, familias, 3 casas de 5 plazas, 2 huertos, 1 almacén y 10 solares, con 4 libres. Los edificios empiezan al 100 de conservación.
- La composición de cada hogar se elige antes de crear sus integrantes. Hay una familia con 2–3 menores, parejas, hermanos y personas que llegaron solas. Algunas familias tienen cinco miembros; no todas las semillas fuerzan ese tamaño.
- Se conservan IDs estables por orden de creación, nombres distintos, edades iniciales, cumpleaños, progenitores, descendientes, hermanos y pareja con referencias recíprocas. No se incorpora sexo/género como requisito ni un sistema de personalidad.
- Cada persona tiene cinco atributos, cuatro habilidades con dominio histórico y experiencia inicial cero, cuatro potenciales independientes, salud, hambre, origen e indicios narrativos iniciales. Todas comienzan vivas, sin oficio ni destino laboral.
- Se priorizan hogares con menores y se mantienen juntos cuando caben. Se ocupan únicamente camas existentes y se registran personas sin vivienda. La capacidad sigue siendo 15: no se redujo la población ni se crearon casas adicionales.
- `selectResidentDetails` y los resúmenes preparan la futura UI con datos reales, edad derivada, enlaces familiares y pistas. Las cifras de potencial no se entregan a esas proyecciones. El guardado interno futuro sí necesitará conservarlas; no se promete secreto criptográfico.
- Se valida la aldea antes de devolverla. Una creación fallida no modifica otro mundo ni escribe almacenamiento. La gestión de ranuras/transacciones sigue pendiente de M4.
- El motor diario conserva el tipo y los datos completos de la aldea. Avanzar un año registra cumpleaños y estaciones sin consumir inventario, cambiar empleos ni simular deterioro físico.

### Archivos de M2

- Nuevo modelo completo en `src/game/models/village.ts`, compuesto con el contrato temporal existente.
- Generación en `src/game/generation/{random,names,families,residents,clues,housing,village}.ts`.
- Parámetros provisionales en `src/game/rules/initialConfig.ts`.
- Validación en `src/game/validation/village.ts` y proyecciones en `src/game/selectors/village.ts`.
- Pruebas en `tests/generation/village.test.ts` e `invariants.test.ts`.
- Ajustes en `src/game/models/simulation.ts`, `src/game/core/calendar.ts` y `src/game/core/tick.ts` para el registro de fundación, fechas de nacimiento sintéticas y conservación del estado completo.
- Actualización de `README.md`, `AGENTS.md` y este seguimiento. No se añadieron dependencias en M2 ni se modificó la pantalla de bienvenida.

### Configuración provisional de generación

Los números siguientes son decisiones de implementación iniciales para hacer comprobable la generación; **no son acuerdos de balance definitivo**. Cambiarlos requiere revisar la versión de generación/configuración antes de publicar partidas.

| Parámetro | Valor inicial usado |
|---|---|
| Población confirmada | 15–20 |
| Preferencia de menores | 2–3; en este generador todos tienen entre 0 y 11 años |
| Adultos de arranque | 18–76 años; no se generan inicialmente edades 12–17 |
| Diferencia progenitor-descendiente | 18–45 años del calendario sintético, incluyendo el efecto de cumpleaños |
| Separación entre hijos | 2–3 años de edad inicial; entre hermanos adultos, 2–6 |
| Diferencia de edades en parejas adultas | Hasta 10 años de edad inicial en hogares de pareja |
| Atributos adultos | 20–75, independientes entre sí |
| Atributos de niños | De 0 a un máximo de `floor(35 × (edad + 1) / 12)` |
| Habilidades adultas | 0–40; dominio histórico inicial igual al actual |
| Habilidades de niños | De 0 a un máximo de `floor(8 × (edad + 1) / 12)` |
| Potencial por oficio | 10–95, sin un potencial general y sin depender del nombre |
| Salud / hambre iniciales | 100 / 0; hambre cero significa ausencia de hambre inicial |
| Viviendas y solares | Propuesta de 3 casas × 5 camas, 2 huertos, 1 almacén y 10 solares |
| Cupos de huerto | 2 por huerto, todavía sin trabajos activos |
| Almacén compartido | Capacidad 600 para comida y madera juntas |
| Reservas | Comida 180–220; madera 80–100, sin producción ni consumo |

Los nombres proceden de catálogos originales de desarrollo, pendientes de revisión artística/cultural. El generador incluye al menos un hogar de cada tipo para asegurar variedad inicial; no es una distribución demográfica definitiva.

La diferencia de edades entre progenitores del hogar con hijos se obtiene de los límites de nacimiento; no se impone ahí el mismo margen de diez años que en los hogares compuestos solo por una pareja. No se infiere matrimonio ni parentesco biológico a partir del apellido compartido del hogar.

Los indicios son reproducibles: un atributo de al menos 65 puede sugerir constitución fuerte o manos hábiles; las pistas de aprendizaje requieren potencial de al menos 70 y un atributo pertinente de al menos 45. No muestran la cifra, no anuncian «el mejor oficio» ni garantizan éxito futuro. La pista genérica se usa cuando no hay otras señales. Estos umbrales también son provisionales.

### Verificación ejecutada al cerrar M2

- `npm test`: **135 pruebas pasaron en 5 archivos**, incluyendo las 92 comprobaciones de M1. Los criterios GEN-01..15 están cubiertos por casos de generación, invariantes, proyecciones e integración.
- Se generaron y validaron **1000 semillas**, con población siempre entre 15 y 20, 2–3 menores, parentescos recíprocos y edades plausibles, 15 camas ocupadas como máximo y personas sin vivienda contadas exactamente. Todos los menores generados quedaron alojados junto con sus progenitores.
- Cien ejecuciones de una semilla producen mundos idénticos. El reloj real y llamadas a `Math.random` no intervienen. El RNG posterior a la generación se conserva al serializar y continuar.
- Pruebas de datos dañados: IDs duplicados, relaciones rotas o cíclicas, fechas imposibles, viviendas ausentes/duplicadas, exceso de camas, inventario negativo o excesivo, valores inválidos y registros incoherentes se rechazan.
- Las proyecciones muestran los valores reales y permiten ordenar/inspeccionar sin consumir RNG ni mutar el mundo; los potenciales secretos no figuran en sus datos.
- Una aldea completa recorre 336 días con cumpleaños correctos y sin activar sistemas de versiones posteriores.
- `npm run build`: correcto, con comprobación TypeScript de código y pruebas.
- No se repitieron pruebas visuales ni se declara probado Android: M2 no modifica pantallas y aún no existe flujo de partida visible, guardado real ni instalación offline.
- Los cambios de M1 y M2 siguen locales. No se hicieron commits, push, etiquetas ni publicaciones en esta entrega.

## M3 — Interfaz interactiva y sesión temporal

### Qué puede hacer el usuario

- Desde la bienvenida: «Explorar mi aldea» → elegir uno de tres espacios → semilla opcional → «Fundar aldea». Si no se escribe semilla, la interfaz propone una con `crypto.getRandomValues`; la generación sigue siendo completamente sembrada.
- Consultar la población, las reservas iniciales, camas ocupadas y personas sin vivienda. Los edificios iniciales muestran ocupación, capacidades y conservación reales, sin simular obras ni economía.
- Abrir un hogar o la lista de habitantes, buscar por nombre/familia, filtrar por familia, vivienda, edad y oficio sin asignar, y ordenar por nombre o edad.
- Abrir una ficha con cinco atributos, cuatro habilidades, cumpleaños, salud/hambre iniciales, vivienda, familiares navegables, indicios y registro personal. No hay botones ficticios de trabajo ni números de potencial oculto.
- Avanzar 1/7/28 días desde la aldea, lista, ficha o registro. La fecha permanece visible, los sucesos aparecen en el registro y el mensaje de avance informa días realmente procesados, no solo los solicitados.
- Cambiar entre tres aldeas independientes **durante la misma sesión**. Crear sobre una aldea ocupada exige confirmar «Reemplazar aldea»; cancelar o pulsar Escape conserva los datos y restaura el foco.

### Límites que la pantalla comunica

**No existe todavía persistencia.** Los tres espacios son estados en memoria; al cerrar o recargar se empieza con espacios vacíos. Hay aviso visible en bienvenida, cabecera y creación, junto con indicador «Sin guardado». Se solicita el aviso nativo de salida cuando el navegador lo permite. Esto no sustituye guardado ni protección ante cierres forzados.

Los sistemas de oficios, producción, consumo, frío, construcción, deterioro y combate siguen inactivos. El apartado de edificios es de consulta y los avisos de edad solo informan. La prueba de borrado persistente de ranura, validación de guardados y UI de error de almacenamiento corresponden a M4.

### Organización y archivos

- `src/app/session.ts`: estado de la sesión, espacios y reductor puro de creación, navegación, inspección, filtros y avances. La generación se completa antes de reemplazar el estado anterior.
- `src/app/mount.ts`: eventos DOM, diálogos nativos, manejo de foco, errores de interfaz, semilla opcional y aviso temporal de salida.
- `src/ui/{format,residents,village}.ts`: formatos, proyecciones y vistas de aldea, espacios, habitantes, ficha y registro. `welcome.ts` mantiene la bienvenida y añade acceso al prototipo.
- `src/ui/game.css`: estilos de pantallas y controles; conserva colores y tipografías existentes. Se compactaron cabecera, ficha y tarjetas para pantallas horizontales cortas.
- `public/orchard.svg` y `public/warehouse.svg`: iconos vectoriales originales con el mismo estilo del favicon existente, que sigue representando las casas.
- `src/main.ts`: montaje de la aplicación y limpieza de eventos durante desarrollo.
- `tests/app/session.test.ts` y `tests/ui/views.test.ts`: sesión, aislamiento de espacios, reemplazos, fallos, navegación sin mutaciones, filtros, datos reales y escape de texto/potenciales.
- Actualizados `README.md`, `AGENTS.md` y este seguimiento. No se añadieron dependencias ni se migró a React.

### Verificación ejecutada al cerrar M3

- `npm test`: **149 pruebas pasaron en 7 archivos**, incluidas las pruebas de M1/M2 y sus 1000 semillas.
- `npm run build`: correcto. La versión compilada se probó además en una vista previa local, creando una aldea sin semilla manual, accediendo a un hogar y su ficha y avanzando siete días.
- Brave, en contexto aislado: creación de tres aldeas, fechas independientes, comparación del panel y los nueve indicadores de ficha con datos del generador, navegación familiar, búsqueda, filtros, ordenación, registro y continuar/reemplazar/cancelar.
- Se probaron +1/+7/+28, dos pulsaciones consecutivas, cambio a verano y registro de ese cambio. Cancelar el reemplazo conservó la aldea y su fecha.
- Teclado: apertura de diálogo con Enter, foco inicial, recorrido Tab por cancelación/confirmación, Escape y retorno del foco. El campo de búsqueda mantiene el foco al filtrar.
- Toque emulado: creación, avance, navegación y ficha en contexto móvil aislado. Recargar confirmó el inicio de una sesión vacía, conforme al aviso temporal.
- Diseño: 1440×900, 844×390, 390×844 y 320×568, revisando aldea, habitantes, registro y ficha. Sin desbordamiento horizontal de página; controles de tiempo visibles y de al menos 44 px. Tras revisar capturas se compactó la cabecera y la ficha, y el acceso inicial «Crear aldea» quedó visible sin scroll en 844×390.
- Opera GX: creación, avance, filtros, ficha y regreso a habitantes correctos en 844×390. Brave y Opera GX no reportaron errores ni advertencias de consola en las comprobaciones realizadas.
- Una semilla con texto HTML se mostró literalmente y no creó nodos ejecutables. Las vistas no incluyeron claves de habilidades privadas ni sus valores centinela. Los iconos locales de casa, huerto y almacén cargaron con HTTP 200 en la compilación.
- No se declara probado un Android físico, la instalación, modo avión ni continuación tras cerrar: todavía pertenecen a M4/M5. Tampoco se ejecutaron ESLint/Prettier, que no están configurados.
- No se hicieron commits, push, etiquetas ni publicaciones. M1–M3 siguen como cambios locales.

## M4 — Persistencia, recuperación y PWA

### Implementación y decisiones

- Tres ranuras independientes en IndexedDB, base `aldea-viva` versión 1, tabla `slots` con clave `slot`. Cada creación y avance se guarda automáticamente. Borrar y reemplazar exigen confirmación en la interfaz; cancelar conserva los datos.
- Sobre de guardado versión 1: identificador de formato, versión del juego, ranura, revisión, UUID de escritura, fecha ISO y mundo completo (incluido RNG, relaciones, inventario, viviendas, registro y potenciales ocultos). El UUID y el reloj pertenecen al almacenamiento; no influyen en el mundo inicial ni en su avance.
- Zod valida datos desconocidos sin coerción y con objetos estrictos. Después se comprueban invariantes del dominio, referencias, cumpleaños y coherencia temporal del registro. Los rangos de población inicial no se fuerzan para siempre.
- No hay formatos anteriores publicados con una migración conocida. El lector acepta el esquema 1 y protege cualquier versión desconocida; no se inventó una migración desde un formato inexistente. SAVE-10 queda sin caso de migración histórica aplicable. La apertura de la base y creación de tabla son versionadas.
- Las escrituras usan transacciones con preferencia de durabilidad `strict`; la aplicación confirma solo en `oncomplete`, nunca al terminar una petición `put`. La garantía final ante fallo de disco/energía corresponde al navegador y dispositivo.
- Cada escritura compara revisión y UUID previo dentro de la misma transacción. Una pestaña antigua no sobrescribe avances, reemplazos ni una ranura borrada y recreada con revisión igual.
- Durante una escritura se bloquean acciones. Si falla, el candidato permanece pendiente y la pantalla conserva el último mundo confirmado. Reintentar escribe ese mismo candidato; descartar requiere confirmación y vuelve a leer. No hay historial de partidas para retroceder resultados.
- Una ranura dañada/incompatible se protege sin borrar ni ocultar las sanas. Un error global de lectura bloquea creación/avance hasta reintentar con éxito. Al salir solo se avisa si existe un cambio pendiente.
- Los guardados pertenecen al origen y al perfil del navegador. 5173 y 4173 son almacenamientos distintos. No se promete sincronización, respaldo externo ni conservación si el usuario borra datos del sitio.

### Offline y actualización

- Manifiesto en español, orientación horizontal preferida, modo standalone e iconos PNG 192/512 exportados del SVG existente, manteniendo la identidad visual.
- Registro de service worker exclusivamente en producción y contexto seguro. El modo de desarrollo sigue permitiendo guardar pero no prepara la PWA.
- La compilación produce una lista exacta de HTML, JS/CSS con hash, manifiesto, iconos y SVG. El identificador de caché depende de su contenido y del generador. Si falta HTML o un activo requerido, la preparación falla; no se anuncia una caché incompleta como disponible.
- Se corrigió un fallo observado al cortar internet: las respuestas de Vite con `Vary: Origin` no coincidían con las solicitudes de módulos. La búsqueda ignora esa variación únicamente para activos propios de la lista precargada. La prueba offline se repitió con éxito.
- La PWA sirve la aplicación sin red y guarda en IndexedDB por separado. No cachea partidas ni solicitudes arbitrarias. Las rutas son relativas, también probadas bajo `/aldea-viva/` en un servidor local.
- Una actualización espera al botón «Actualizar aplicación» y solo se activa sin cambios pendientes. No borra la base de partidas. La limpieza se limita a cachés de la aplicación y su ámbito; conserva versiones previas cuando hay otros clientes abiertos.

### Archivos de esta entrega

- Nuevos: `src/game/models/save.ts`; `src/storage/{schema,repository,indexedDb}.ts`; `src/app/{persistence,offline}.ts`; `vite.config.mjs`; `public/manifest.webmanifest`; `public/icons/icon-{192,512}.png`; `tests/storage/{schema,repository}.test.ts`; `tests/app/persistence.test.ts`.
- Modificados: `src/app/{session,mount}.ts`, `src/ui/{welcome,village}.ts`, `src/ui/game.css`, `index.html`, `package.json`, `package-lock.json`, `README.md`, `AGENTS.md` y este seguimiento. Los cambios previos M1–M3 se conservan.
- Dependencias justificadas: Zod en ejecución para validar guardados desconocidos; fake-indexeddb solo en desarrollo para probar transacciones, abortos y conexiones. No se añadió framework ni librería PWA.

### Evidencia y límites

- `npm test`: **184 pruebas pasaron en 10 archivos**, incluidas las 149 de M1–M3 y 35 nuevas de formato, transacciones y coordinación persistente. La continuación con reapertura a mitad de año produjo exactamente el mismo mundo que 336 avances diarios continuos (incluidos registro, RNG e identidades).
- `npm run build`: correcto, con TypeScript y generación de activos/worker. `npm run check` también pasó durante el desarrollo. No se omitieron errores de tipos para generar la aplicación.
- Brave aislado: creación y recuperación de tres aldeas con días independientes; comparación completa de registros antes/después de recarga; fallo real de transacción inducido después del éxito de `put`; reintento sin duplicar días; conflicto entre dos pestañas y descarte/relectura; borrado confirmado y cancelado; versión futura protegida sin controles de edición; error de permisos simulado, bloqueo de creación y recuperación con reintento.
- Offline real mediante desconexión del contexto de navegador: recargar, abrir otra pestaña y recuperar la misma aldea, avanzar y guardar, con recursos gráficos disponibles. La segunda pestaña comparte un perfil de pruebas; esto no equivale al cierre del navegador/proceso Android.
- Actualización de service worker mediante nueva compilación: apareció el botón, se activó y recargó; comparación completa de IndexedDB idéntica antes/después, incluida una ranura incompatible protegida. La aplicación continuó funcionando offline tras actualizar.
- Brave con toque emulado en 844×390, servido bajo `/aldea-viva/`: creación, avance, recarga offline, lista/ficha de habitante y nuevo avance guardado. Ámbito del worker correcto, sin desbordamiento ni errores de ejecución.
- Diseño revisado con capturas en escritorio y móvil; mediciones en 1440×900, 844×390, 390×844 y 320×568 sin desbordamiento horizontal; controles de avance de 46 px y visibles dentro de la pantalla.
- Opera GX aislado, 844×390: crear, avanzar 28, recargar desconectado, recuperar día 28 y avanzar/guardar un día más. Las sesiones finales verificadas de Brave y Opera no reportaron errores ni advertencias de consola. El fallo de caché inicial quedó corregido y se distingue de estas comprobaciones finales.
- No se ejecutaron ESLint/Prettier porque no están configurados. No hubo commits, push, etiquetas ni publicación.

## M5 — Validación y preparación del corte

Se preparó y realizó una prueba guiada con el usuario en Android físico. La evidencia y sus límites se detallan a continuación y en `08_ACEPTACION_0_1.md`. Los commits, etiquetas, push y alojamiento permanente necesitan autorización explícita. No empezar sistemas de 0.2 mientras se decide el corte de esta candidata.

### Preparación de prueba Android por HTTPS (2026-11-02)

- El usuario autorizó explícitamente un enlace público temporal de Cloudflare para esta prueba. Se conectó únicamente a la compilación local en `127.0.0.1:4173`, usando cabecera de origen `localhost:4173`. No se expuso el servidor de desarrollo ni se modificaron permisos de GitHub.
- Se descargó el ejecutable oficial cloudflared 2026.10.7 para Windows x64 en `.tools.local/`, carpeta ya ignorada por Git. Su SHA256 coincidió con el digest del activo de la publicación oficial. No se instaló como servicio ni se modificaron ajustes del sistema. El registro del proceso está en `.tools.local/tunnel.log`.
- El enlace de esta sesión es `https://therapeutic-drawing-republican-div.trycloudflare.com`. Es temporal y deja de funcionar al detener el proceso; no es una dirección estable para distribuir el juego. Las partidas creadas allí pertenecen a ese origen y no se trasladan automáticamente a otra dirección futura.
- Verificado en Brave con perfil aislado a través de ese HTTPS: carga de la aplicación, creación, avance de siete días, confirmación de guardado, preparación del worker, recarga sin red, continuación con fecha exacta y recursos gráficos disponibles. Contexto seguro confirmado, sin errores ni advertencias de consola. Estas pruebas se hicieron en el PC; todavía falta el resultado del Android del usuario.
- En esta preparación solo cambió este seguimiento entre los archivos del proyecto; herramienta y registro quedaron ignorados. No hubo cambios de código, commits ni push.

### Primera comprobación en Android comunicada por el usuario

- El usuario confirmó que el enlace abre correctamente en su Android y que el juego funciona también sin conexión: «sip, funciona genial y tambien sin conexion». Es evidencia comunicada por el usuario; no una inspección directa del teléfono por el agente.
- El usuario identificó Brave como navegador en Android. Tras añadir el juego a la pantalla de inicio confirmó que, al abrirlo desde el icono, no aparece la barra de direcciones y se aplica orientación horizontal. Esto confirma por su testimonio el inicio como aplicación sin interfaz del navegador y la orientación prevista en ese dispositivo.
- Ante la prueba guiada de avanzar siete días y esperar «Guardado», anotar la fecha, cerrar desde aplicaciones recientes, activar modo avión con Wi-Fi apagado y continuar desde el icono, el usuario confirmó que recuperó la misma aldea con la fecha exacta. La recuperación offline tras ese cierre queda comprobada por su testimonio en Android físico. No se interpreta como prueba de reinicio del teléfono, detención forzada desde ajustes ni terminación por falta de memoria.
- El usuario confirmó también la prueba de crear las tres aldeas, anotar sus fechas, avanzar siete días solo en el espacio 1, cerrar/reabrir y comprobar que ese espacio conserva su avance mientras los otros dos mantienen sus fechas anteriores. La independencia persistente de las tres ranuras queda comprobada por su testimonio en Android.

### Revisión del corte candidato

- Añadidas dos pruebas de integración en `tests/app/persistence.test.ts`: conservación de ficha/identidad/familia al avanzar y reabrir (E2E-01), y un año completo en una sola de tres ranuras con cuatro cambios estacionales, cumpleaños individuales y tres lecturas sin duplicar registro (E2E-02/06).
- Verificación final: **186 pruebas aprobadas en 10 archivos** y `npm run build` correcto con TypeScript. No cambió el código de juego, la compilación mantiene los mismos activos y no se requiere actualizar la aplicación del teléfono para estas nuevas pruebas.
- `08_ACEPTACION_0_1.md` recoge los veinte criterios AV01, las fuentes de evidencia, los casos E2E y sus límites. E2E-03 (comparación completa del mundo de una misma semilla entre PC y Android físico) permanece pendiente; no se marca aprobado por inferencia.
- README y AGENTS actualizados para reflejar las pruebas físicas completadas. La candidata sigue sin etiqueta ni commits nuevos; aún no se declara superada toda la auditoría ampliada.

### Autorización del punto de guardado en GitHub

- Tras revisar los resultados, el usuario autorizó explícitamente crear un commit y subir esta candidata al repositorio privado `FerAlfaro24/aldea-viva`.
- Antes de prepararlo se consultó el remoto: `main` y `origin/main` coincidían en `ff0c8bf`, sin trabajo remoto nuevo que integrar, y la API de GitHub confirmó visibilidad privada.
- El punto de guardado incorpora motor, generación, interfaz, persistencia, PWA, pruebas y documentación preservada. Se excluyen la herramienta del túnel, registros, dependencias instaladas, compilación y datos de pruebas del navegador. La revisión de patrones de credenciales no encontró coincidencias en los archivos del proyecto revisados.
- Este punto se guarda como candidata, no como etiqueta de versión final. E2E-03 y los límites del documento 08 siguen documentados. Consultar el historial Git y el resultado de la subida para identificar el commit efectivo.
