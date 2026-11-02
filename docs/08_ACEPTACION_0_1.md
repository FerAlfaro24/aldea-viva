# Aldea Viva — Revisión de aceptación 0.1

Fecha: 2026-11-02. Estado: **candidata 0.1 jugable; pruebas básicas de Android completadas**. No hay etiqueta de versión ni publicación permanente. Esta revisión no cambia las reglas del diseño ni amplía el alcance a 0.2.

## Comprobaciones finales

- `npm test`: 186 pruebas aprobadas en 10 archivos.
- `npm run build`: correcto; incluye comprobación TypeScript de código y pruebas.
- ESLint y Prettier: no configurados, no ejecutados.
- Brave y Opera GX: evidencia de las pruebas previas en `07_SEGUIMIENTO_0_1.md`; no se confunden con las pruebas físicas del usuario.
- Android con Brave: el usuario confirmó inicio desde icono sin barra de direcciones, orientación horizontal, funcionamiento offline, recuperación de fecha exacta tras cerrar desde recientes y abrir en modo avión, y aislamiento de las tres aldeas después de reabrir. No se conocen modelo del teléfono ni versiones de Android/Brave; no se generaliza el resultado a otros dispositivos.

## Matriz AV01

La evidencia siguiente corresponde a lo ejecutado durante M1–M5. «Pruebas» significa pruebas automatizadas salvo donde se identifica navegador o testimonio del usuario.

| Criterio | Evidencia disponible |
|---|---|
| AV01-001 — Repositorio y build | Proyecto existente preservado, instalación de dependencias realizada durante desarrollo, pruebas y compilación finales correctas |
| AV01-002 — Calendario | Casos de límites 12×28, estaciones, cambio anual y edades en `tests/core/` |
| AV01-003 — RNG | Secuencia sembrada, restauración de estado y continuación tras guardado comprobadas |
| AV01-004 — Modelo de partida | Validación estricta y recuperación de mundo completo, no solo semilla |
| AV01-005 — Habitantes | 1000 semillas validadas, 15–20 habitantes al inicio y atributos dentro de rangos |
| AV01-006 — Familias | Referencias recíprocas, identidades, parentescos y edades plausibles probados |
| AV01-007 — Viviendas | Capacidades, asignaciones y habitantes sin vivienda comprobados; sin camas ficticias |
| AV01-008 — Recursos | Reservas acotadas y capacidad compartida del almacén probadas; sin economía activa |
| AV01-009 — Tick diario | Avances equivalentes y continuación a mitad de año comparada con 336 pasos diarios |
| AV01-010 — Cumpleaños | Fechas, incremento individual y ausencia de duplicados en un año comprobados |
| AV01-011 — Registro | Fundación, cumpleaños, estaciones y habilitaciones persistidos y ordenados |
| AV01-012 — Interrupciones | Contrato y parada en decisión sintética probados; no se inventaron eventos activos |
| AV01-013 — Horizontal | Navegadores con tamaños de móvil y orientación horizontal en Android confirmada por el usuario |
| AV01-014 — Lista y ficha | Datos reales, familiares navegables, filtros y proyecciones sin secretos; ficha conservada tras reapertura |
| AV01-015 — Tres ranuras | Recuperación e independencia comprobadas por transacciones y por el usuario en Android |
| AV01-016 — Guardado seguro | Abortos, reintentos, confirmación de transacción, conflictos y formatos incompatibles probados; fallos inducidos también en Brave |
| AV01-017 — PWA/offline | Precarga y recarga offline en navegadores aislados; instalación e inicio offline confirmados en Android |
| AV01-018 — Accesibilidad | Teclado/foco y controles táctiles emulados probados; controles de avance de 46 px y sin desbordamiento en tamaños revisados; prueba real de uso del usuario |
| AV01-019 — Documentación | Diseño preservado, README, instrucciones del proyecto, seguimiento y esta revisión |
| AV01-020 — Contratos futuros | Separación de simulación, interfaz y persistencia; modelos de profesión, edificios, vivienda, inventario y decisión sin activar sistemas posteriores |

## Integración y pruebas que no deben darse por supuestas

| Caso | Resultado y alcance |
|---|---|
| E2E-01 | Integración sin navegador: creación, ficha, +28, nueva conexión y recuperación completa; edad solo cambia si cruza el cumpleaños. La navegación y las fichas se probaron además en navegador durante M3/M4 |
| E2E-02 | Integración sin navegador: 336 días solo en la ranura 2, las otras dos idénticas antes/después; el usuario confirmó además independencia tras avanzar siete días en una sola ranura en Android |
| E2E-03 | **Pendiente de comparación completa entre PC y Android físico**: no se ha extraído y comparado el mundo entero de una misma semilla en ambos dispositivos. La igualdad por semilla está probada automáticamente, pero eso no sustituye este caso entre dispositivos |
| E2E-04 | Integración sin navegador: reapertura a mitad de año y continuación idéntica a 336 avances diarios continuos |
| E2E-05 | Transacción abortada después de `put`, alerta y reintento sin duplicar avance; probado automáticamente y en Brave |
| E2E-06 | Cumpleaños y cuatro cambios estacionales con fechas exactas; tres cargas sucesivas conservan el mismo registro sin duplicados, probado en integración |

SAVE-10 no tiene una migración histórica aplicable: esta es la primera versión de guardado. El esquema 1 se lee y valida; los desconocidos se conservan bloqueados. No se declara probada una migración inventada.

## Límites del corte

- La prueba física de cierre fue desde aplicaciones recientes; no se probaron reinicio del teléfono, detención forzada desde ajustes, falta de memoria, pérdida de energía o disco lleno real.
- La actualización del service worker conservando partidas se probó en Brave de escritorio; no se repitió esa actualización en Android físico.
- No hay alojamiento permanente ni APK. El enlace Cloudflare fue autorizado solo para pruebas, depende del PC mientras está en línea y su dirección cambia al crear otro túnel. Los guardados no se trasladan a otro origen automáticamente.
- El funcionamiento offline depende de que la aplicación se haya cargado y preparado previamente. Borrar los datos del sitio puede eliminar las partidas.
- No hay oficios asignables, producción, consumo, construcción, deterioro, combate ni mortalidad activos. Las capacidades, recursos y rangos provisionales siguen identificados en el seguimiento.
- El usuario autorizó crear un commit de esta candidata y subirlo a `FerAlfaro24/aldea-viva`. Se comprobó que el repositorio sigue privado y que la rama remota coincidía con la base local antes de preparar el commit. La autorización no incluye etiquetas, release final ni alojamiento permanente; el resultado de la subida se verifica en el historial Git.

La prueba básica del dispositivo está superada según el testimonio del usuario. El estado se mantiene como **candidata** hasta resolver o aceptar expresamente los límites de la auditoría ampliada; no se certifican todos los casos E2E ni todos los Android.
