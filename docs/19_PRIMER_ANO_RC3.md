# Primer año — Candidata 1.0.0-rc.3

Mejora autorizada el 3 de noviembre de 2026 para responder al informe de jugabilidad. El usuario solicitó subirla a GitHub, aunque sigue sin estar satisfecho con la experiencia. No es aceptación final de jugabilidad ni de Android físico. El informe 18 se conserva como diagnóstico histórico.

## Qué ha cambiado

- **Una prioridad ejecutable:** la guía distingue puestos libres, obras, materiales, reparaciones, personas sin vivienda, amenazas y destinos pendientes. Identifica el edificio deteriorado que bloquea ampliar y acompaña la reparación, en vez de volver a una lista genérica de requisitos.
- **Plan de invierno:** objetivo aproximado de comida con alimentación normal o superior, cosecha invernal actual, demanda alta y margen del 20 %. Cuenta los 84 días antes de empezar o solo los días futuros que quedan durante el invierno. No utiliza la severidad oculta ni reduce el objetivo por racionar por debajo de la necesidad normal.
- **Espacio suficiente:** calcula capacidad para la comida objetivo y la madera que realmente ocupa espacio, además de la reserva prevista. Cuando el objetivo cabe, deja de recomendar almacenes por cada exceso de cosecha. Reconoce que el grado 2 es el límite de esta versión.
- **Tareas revisables:** hay una propuesta independiente para pausar tala excesiva o devolver constructores con destino en conflicto al reparto flexible. Muestra los nombres y motivos y requiere «Confirmar estos cambios de tareas». No se aplica sola al pasar días; el reparto inicial sigue completando solo personas sin oficio.
- **Madera con el almacén casi lleno:** explica cuándo conviene priorizar temporalmente la entrega de madera. El acceso directo preselecciona esa prioridad en Economía; el jugador tiene que guardar la política. Esto permite reunir materiales sin que las cosechas ocupen todo el espacio antes de entrar la madera.
- **Víspera de invierno:** evita recomendar huertos para compensar la caída de cosecha de mañana. En los últimos catorce días prioriza reservas; no propone un almacén nuevo en la última semana. Las obras ya preparadas conservan su gestión.
- **Aprender por fases:** capítulos de primavera, verano, otoño e invierno, hitos de primera jornada, obra, mes y año. El plan de invierno aparece plegado el día de fundación para mantener el foco en la primera acción.
- **El avance cuenta una historia:** resumen de cambios de comida/madera, acontecimientos importantes y una persona que haya mejorado su habilidad actual. La portada muestra tres hechos recientes y reconoce el primer año superado. Los almacenes se agrupan en una tarjeta de reserva compartida.
- **Móvil horizontal más claro:** encabezado compacto y acción principal inmediatamente bajo el consejo. Se conserva el tema oscuro, los controles de tiempo y el tamaño táctil de los botones; las propuestas se desplazan por debajo de la barra de navegación.
- **Sucesos con más espacio entre ellos:** las comprobaciones pasan de 7–14 a 14–24 días; la primera sigue a los catorce días. Si hay otro tipo elegible, se evita repetir el último ofrecido. No hay una cuota obligatoria de oportunidades o visitantes.
- **Decisiones defensivas con consecuencias legibles:** negociar cobra el mayor entre el tributo base y el 6 % de cada reserva libre. Antes de elegir se muestra la comida que podría quedar si fracasa cada táctica y se compara con el objetivo de invierno.
- **Pérdidas recuperables en el arranque:** el robo base al perder un asalto es del 10–25 % durante el primer año; desde el segundo vuelve al 15–40 %. Los multiplicadores de táctica y los riesgos personales siguen aplicándose. No se garantiza éxito ni se ocultan probabilidades.
- **Ampliación como paso de progreso:** grado 2 requiere completar 28 días, además de los requisitos de población, comida, madera y conservación. Las aldeas que ya tenían grado 2 lo conservan.
- **Final coherente:** una aldea extinguida muestra su memoria y «Una historia concluida», sin indicadores de crecimiento, objetivos de gestión o reservas futuras.
- **Visitantes con contexto:** antes de acogerlos se explica cuánto aumentaría el objetivo de comida y capacidad para invierno. La decisión sigue siendo del jugador, incluidas las consecuencias de aceptar sin camas suficientes.

## Relación con el informe

| Hallazgos | Tratamiento |
|---|---|
| 001–002: ampliación imposible y almacenes por inercia | Límite reconocido, objetivo de capacidad, revisión de tala, diagnóstico de reparación para desbloquear ampliación |
| 003: huerto en víspera de invierno | Umbrales estacionales y objetivo de reserva; sin nueva obra tardía sugerida |
| 004: dificultad inicial variable | Primeros pasos explícitos, previsión real y tercer huerto cuando hace falta; se mantiene la variedad de semillas |
| 005: preparación invernal poco clara | Plan visible con supuestos, margen, comida, espacio y días restantes |
| 006 y 012: mensajes de final | Estado memorial y ranura concluida |
| 007: oficio sin trabajo | Contadores de conflictos/reposo y propuesta específica revisable |
| 008: interrupciones repetidas | Intervalo mayor y alternancia cuando otro tipo es elegible |
| 009: negociación demasiado cómoda | Tributo relacionado con reservas y comparación del impacto; robos iniciales menos devastadores |
| 010–011: progreso e identidad | Ampliación tras el primer mes, capítulos, logros, resumen de avance y hechos con nombres |

Estos cambios abordan el primer año. No convierten el equilibrio en definitivo ni homogeneizan todas las aldeas. La diversión y el ritmo necesitan la valoración del jugador; ninguna muestra de pruebas garantiza sobrevivir con cualquier decisión o secuencia de azar.

## Verificación

- **298 pruebas aprobadas en 25 archivos**, incluida la aceptación del primer año en seis aldeas, y compilación TypeScript/Vite correcta. Nuevos casos para planificación, transición de estación, límite de solares, reserva de madera ya acumulada, ajustes confirmados, guardado fallido/reintento, prioridad de entregas y textos de final.
- **Seis partidas del motor hasta el día 336**, con generación y órdenes públicas, sin regalar materiales ni regenerar personas. Siguen la guía, aplican sus propuestas, resuelven sucesos y eligen tácticas con una política sencilla de reservas. No son seis partidas de navegador ni un jugador óptimo.
- Todas terminaron sin hambre media, con salud media superior a 90, tres o cuatro almacenes y solares libres. Las llegadas explican las poblaciones finales superiores a las iniciales.
- En el navegador se completó un año con una comunidad de veinte habitantes; se comprobaron obras, ajustes confirmados, ampliación, sucesos, asaltos y resumen anual. También se comprobó actualizar una partida en marcha: la guía pasó a señalar la casa que bloqueaba la ampliación y permitió continuar hasta primavera del año 2.
- Brave aislado en escritorio y móvil horizontal; recuperación offline y consola sin excepciones en los recorridos comprobados. Emulación móvil, no teléfono físico.

| Semilla | Población inicial → final | Alimentos al cierre | Salud media | Hambre media | Almacenes | Solares libres | Oportunidades / asaltos |
|---|---:|---:|---:|---:|---:|---:|---:|
| `opinion-jugador-2026-11-02` | 20 → 20 | 168,60 | 94,68 | 0 | 4 | 3 | 10 / 4 |
| `analisis-inicio-7` | 16 → 20 | 279,28 | 100 | 0 | 4 | 3 | 8 / 4 |
| `analisis-inicio-14` | 15 → 20 | 207,48 | 100 | 0 | 3 | 1 | 8 / 4 |
| `analisis-inicio-0` | 16 → 19 | 752,66 | 100 | 0 | 4 | 3 | 8 / 4 |
| `analisis-inicio-20` | 15 → 15 | 558,27 | 100 | 0 | 3 | 1 | 13 / 3 |
| `analisis-inicio-31` | 20 → 20 | 220,97 | 98,60 | 0 | 4 | 3 | 9 / 3 |

Aceptación reproducible: `tests/integration/firstYear.test.mjs` (unos dos segundos; no es la antigua integración de cinco años). Datos completos de la comprobación final en `.tools.local/primer-ano-mejorado.json`, ignorados por Git. La comparación no pretende estimar la tasa de victoria de todos los jugadores. Se mantuvo el azar y se ajustó el daño económico inicial tras detectar una sucesión de derrotas que dejaba hambre extrema pese a una preparación razonable.

## Compatibilidad y alcance

No hay dependencias nuevas, cambios de formato de guardado ni generación retroactiva. Lector v1–v9 y escritor v9 conservados. Calendario de 336 días, oficios inicialmente vacíos, potenciales por profesión, órdenes manuales y fin solo al morir todos conservados.

Los nuevos valores provisionales afectan a futuras comprobaciones y decisiones, incluso en partidas existentes. No se recalculan ataques ya resueltos, no se reprograma una comprobación pendiente al cargar y no se modifica una partida solo por consultarla. Los ajustes de trabajo siguen el guardado transaccional existente.

Archivos principales: `game/selectors/{planning,guidance,workAdjustments,recommendedWork,defense}.ts`, `game/commands/{recommendedWork,expansion,defense}.ts`, `game/core/storyDay.ts`, reglas de sucesos/defensa, integración de sesión/persistencia y pantallas. Nuevas vistas de planificación y capítulos en `ui/{planning,chapter}.ts`. Pruebas en `tests/app/firstYear.test.ts` y actualización de casos de ampliación/defensa.

Entrega `1.0.0-rc.3` a GitHub autorizada expresamente por el usuario; los cambios en `main` activan la actualización automática de Pages. Pendientes: mejorar la experiencia según las observaciones del usuario, prueba física en Android y regulación de años posteriores. Subir esta candidata no la convierte en una 1.0 final aceptada.
