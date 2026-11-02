# ALDEA VIVA — BIBLIA MAESTRA DE DISEÑO Y CONTINUIDAD

**Edición de transferencia:** 2026-11-02 · **Estado:** preproducción, antes de implementar desde cero la 0.1 · **Idioma:** español.  
**Destino:** nueva conversación de ChatGPT, Codex, VS Code y repositorio GitHub `aldea-viva`.  
**Alcance:** decisiones confirmadas, razonamientos, contexto narrativo, sistemas futuros, límites, contradicciones conocidas y hoja de ruta 0.1–1.0.

> **LEER ANTES DE PROGRAMAR.** Este documento no es una licencia para implementar todo ya: la prioridad inmediata es la 0.1. El documento técnico `02_ESPECIFICACION_EJECUTABLE_0_1.md` define la ejecución, pruebas y criterios de aceptación de esa primera entrega. El código FMS CEO y los HTML antiguos son **referencias y antecedentes**, no el código base de Aldea Viva.

## 0. Procedencia, fiabilidad y cómo resolver diferencias

Esta memoria reconstruye las **29 decisiones de diseño** que quedaron acordadas en la conversación sobre Aldea Viva, ampliándolas con el material local revisado: los dos archivos `Aldea_Viva_Documento_Maestro*.md`, los HTML `aldea_v01` a `aldea_v04`, los prototipos `npc_arena_v01` a `v05` y el archivo `FMS_CEO-main.zip`, junto con `README.md`, `CHANGELOG.md`, `index.html`, `main.js`, `sw.js` y el manifiesto de FMS CEO que acompañaban al paquete. Las especificaciones de ingeniería y los ejemplos que aparecen aquí y que **no fueron confirmados expresamente** están señalados como **RECOMENDACIÓN**, **PROPUESTA** o **PENDIENTE**. No se atribuye al usuario haber definido detalles numéricos o técnicos que nunca fijó.

**Jerarquía de autoridad para decisiones de diseño:** (1) decisiones explícitas más recientes del usuario; (2) decisiones anteriores del usuario que no hayan sido sustituidas; (3) el presente documento como memoria consolidada; (4) documento maestro original; (5) antecedentes/prototipos como inspiración *no normativa*. **En caso de discrepancia, no adivinar ni corregir en secreto.** Dejar incidencia documental y preguntar solo si bloquea la entrega. Es válido crear un valor técnico provisional encapsulado, documentado y testeado, siempre que no contradiga una regla confirmada.

**Etiquetas:** **C** = confirmado; **R** = recomendación técnica/no confirmada; **P** = pendiente de balance, decisión o verificación; **D** = descartado o diferido; **A** = antecedente no vinculante.

### Lo que NO debe confundirse

- **La versión del juego** 0.1/0.2/…/1.0 es el plan futuro; **`aldea_v01.html` a `aldea_v04.html`** son pruebas anteriores de otra aproximación. No son entregas canónicas del nuevo juego.
- **Año confirmado = 336 días, meses = 28 días**. Un prototipo usa 120 días/año y otro bloques de 30 días; esos valores son obsoletos.
- **Todos empiezan sin oficio**. Prototipos anteriores autoadjudicaban trabajo; no heredar esa mecánica.
- **Cuatro profesiones iniciales**: agricultura, tala, construcción, combate. «Recolección» y otros oficios de pruebas previas no están aprobados como quinto oficio para 1.0.
- **Madera natural ilimitada** durante 1.0; el agotamiento/regeneración forestal se pospone.
- **Sin nacimientos y sin sistema complejo de personalidad** durante 1.0.
- **Guardado automático, tres ranuras, sin retroceder decisiones**, con robustez razonable; no prometer invulnerabilidad al borrado de datos del navegador.

---

# PARTE I — IDENTIDAD DEL JUEGO

## 1. Visión y promesa al jugador [C]

**Aldea Viva** es un juego de gestión, supervivencia y narrativa emergente de una comunidad medieval pequeña. Se juega principalmente en **Android horizontal**, con una experiencia local/offline una vez instalada o cargada correctamente; la APK vendrá después de consolidar la experiencia web/PWA. El usuario dirige la aldea, no mueve a cada personaje manualmente. Nace de una afinidad por simulaciones de números, porcentajes, consecuencias impredecibles pero honestas y descubrimientos emocionantes. Debe generar historias que valga la pena contar: *una anciana experta sostiene la cosecha; un aprendiz sorprende a todos; una familia se sacrifica para proteger a otra; el invierno no perdona un almacén mal gestionado*.

**Pilares:**

1. **Personas antes que fichas**: habitantes con nombres, parentescos, edades, historia, aprendizaje y capacidades distintas. Sus pérdidas importan.
2. **Decisiones estratégicas con consecuencias**: recursos escasos, responsabilidades en conflicto y riesgo razonablemente legible.
3. **Automatizar rutina, no voluntad del jugador**: el usuario da instrucciones, fija prioridades y asigna responsabilidades; el motor ejecuta lo repetitivo.
4. **Azar honesto y legible**: probabilidades dependientes del estado simulado; tiradas reproducibles, sin resultados predeterminados para impresionar.
5. **Tiempo y estaciones con significado**: el invierno convierte decisiones pasadas en consecuencias.
6. **Interfaz estimulante, no abrumadora**: números, cambios, barras, probabilidades, indicios y revelaciones puntuales; prioridad a claridad táctil.
7. **Crecimiento sostenible del proyecto**: versiones pequeñas, validadas, no promesas gigantescas.

El juego **no necesita una victoria convencional** ni una campaña con final obligatorio. La supervivencia puede ser indefinida. **Fin de partida únicamente si fallecen todos los habitantes**; la pobreza, destrucción de edificios, pérdida de economía o que solo queden menores/ancianos no son derrota automática. Al finalizar, una crónica/resumen memorial de la aldea es deseable como entrega posterior.

### Qué significa «inspiración gacha» [C]

El usuario quiere la emoción de descubrir resultados raros, potenciales desconocidos y probabilidades expresadas visualmente. **No implica caja de botín de pago, monetización, apuestas ni falsificación de tasas**. Se puede usar una animación especial al descubrir un talento, ganar una situación adversa o sobrevivir a una crisis. No repetir efectos dramáticos por cada clic o cada día.

## 2. Plataforma, ergonomía y experiencia de uso [C/R]

**C:** Android como destino prioritario; orientación horizontal; offline; paso posterior a APK. **R:** comenzar con TypeScript + Vite + React, PWA estable y un motor de simulación desacoplado; usar una publicación de prueba para Android en HTTPS, sin necesidad de APK inicial. React es recomendación, no decisión de mecánicas. **P:** resolución base exacta, estilo gráfico, tipografía, iconografía y nombre de paquete Android.

- **Menú Aldea:** estado del asentamiento, fecha, habitantes, reservas, alertas, edificios.
- **Menú Habitantes:** lista/filtros, ficha individual, familias, asignación y seguimiento.
- **Menús separados por oficio:** agricultura, leñadores, constructores y guerreros, con capacidad y acciones específicas.
- **Construcciones:** solares, obras, reparaciones y mejoras.
- **Alimentación:** raciones y prioridades.
- **Defensa:** puestos, alertas, opciones tácticas.
- **Crónica:** incidentes menores y momentos decisivos, con fecha y participantes.

Los menús pueden incorporarse progresivamente; en 0.1 no aparentar operatividad de funciones de 0.2+. Debe ser fácil averiguar **qué cambió, por qué cambió y cuál fue la decisión que lo causó**. Se desea visualizar cifras reales y cambios porcentuales cuando tengan significado. Mostrar rangos de predicción, no falsos valores exactos de un futuro aleatorio.

---

# PARTE II — REGISTRO ÍNTEGRO DE LAS 29 DECISIONES

Cada entrada preserva el núcleo confirmado, matices de conversación y consecuencias técnicas. La numeración debe mantenerse estable.

## Decisión 01 — Población inicial aleatoria [C]

La aldea arranca con **15 a 20 habitantes aleatorios**. No basta variar el número: cada semilla cambia nombres, edades, aptitudes, habilidades, potenciales y relaciones. Deben existir grupos familiares, algunas familias de cinco personas, parejas, hermanos y solitarios. Se desea **preferiblemente 2–3 niños** y adultos suficientes para una partida viable. La mezcla no debe forzar una cantidad imposible de trabajadores o familias incoherentes. El RNG de la generación debe ser sembrado y persistente. **P:** listas de nombres, distribución de edades, criterios exactos de plausibilidad y mínimos de adultos.

## Decisión 02 — Alojamiento familiar automático, reversible manualmente [C]

Al comienzo, el sistema distribuye viviendas priorizando familias —sobre todo con niños— y usa camas libres con personas no emparentadas si hace falta. El jugador puede mover a cualquiera y **lo decidido manualmente queda protegido** frente a nuevas reorganizaciones automáticas. Vivir sin techo tendrá riesgos, especialmente en invierno (no simular aún en 0.1). **P importante:** con tres casas de cinco camas hay 15 plazas, insuficientes para algunas aldeas de 16–20; no cambiar ninguna cifra en secreto.

## Decisión 03 — Asignación distinta para cada oficio [C]

**Agricultor:** trabaja en un huerto **determinado**, con puestos finitos; permanece asignado hasta orden nueva. **Leñador:** trabaja en bosque, sin asignación a huerto. **Constructor:** puede estar en automático y repartirse en tareas de mantenimiento/obras autorizadas, o dedicarse manualmente a una sola construcción/reparación; las órdenes exclusivas no se reasignan. **Guerrero:** se asigna a destinos defensivos (muralla, bosque, aldea, según disponibilidad). Cada profesión tendrá **su propio menú**, no un selector genérico que oculte diferencias. Se conservan experiencias previas si alguien cambia de oficio.

## Decisión 04 — Primeras profesiones siempre manuales [C]

**Todos los adultos comienzan desempleados.** El usuario elige su primera profesión uno por uno para conocer nombres y características y familiarizarse con menús. Niños sin edad suficiente tampoco trabajan. La automatización posterior resuelve rutinas **una vez asignados**, pero **nunca recluta automáticamente a un desempleado para cubrir un oficio**. No confundir modo automático de un constructor con contratación automática. **D:** prototipos antiguos que asignan profesión por algoritmos automáticos.

## Decisión 05 — Tres capas del personaje [C con propuestas parametrizables]

1. **Atributos generales:** fuerza, resistencia, agilidad, destreza, vitalidad, en escala propuesta 0–100.
2. **Habilidades de oficio:** agricultura, tala, construcción, combate, escala propuesta 0–100.
3. **Potencial oculto:** distinto para cada oficio; orienta velocidad/techo de aprendizaje, no equivale a una calificación universal de «talento total».

La **salud**, el **hambre** y la **edad** son estados aparte, nunca se confunden con «vitalidad» u otro atributo. La ejecución de trabajo combina habilidad y atributos con ponderación inicial ilustrativa **60%/40%**, **no regla numérica definitiva**. Se ven pistas narrativas de potencial al inicio, pero la cifra real se descubre gradualmente con experiencia. Un veterano competente no debe resultar automáticamente el de mayor potencial a largo plazo.

## Decisión 06 — Desarrollo físico y envejecimiento [C]

Atributos generales mejoran **despacio** con actividades pertinentes; a medida que avanza la edad algunas capacidades físicas decaen gradualmente y de forma individual. Las habilidades de oficio ganan experiencia más rápido que los atributos. Hay límites individuales y diferencias de aprendizaje. Evitar saltos arbitrarios de atributos cada día.

## Decisión 07 — Sin jubilación forzada [C]

Los mayores pueden seguir trabajando mientras salud y capacidades lo permitan; conservan experiencia y saber hacer incluso con declive físico. Una mecánica de maestro/mentor o profesión exclusiva para ancianos puede explorarse después, **no es requisito de 1.0**.

## Decisión 08 — Aprender haciendo, eventos excepcionales muy formativos [C]

El trabajo diario concede progreso habitual; los acontecimientos relevantes pueden dar experiencia **muy superior**, con resultados buenos y malos. Un agricultor que experimenta un método arriesgado puede aprender mucho y perder cosecha; un guardia gana algo con patrullar y mucho más en batalla, aun sufriendo una herida. La UX debe presentar riesgo/recompensa con porcentajes honestos cuando proceda y mostrar resultados memorables, sin inundar de animaciones cada turno.

## Decisión 09 — Eventos de formas diferentes [C]

No todos los sucesos deben forzar la misma caja de elección. Tipos: **riesgo graduable**, **aceptar/rechazar**, **elección entre alternativas forzadas** y **resolución automática**. Las alternativas dependen del contexto simulado. En episodios importantes se pausa y decide; sucesos menores alimentan crónica sin parar.

## Decisión 10 — Ritmo orientativo, no cuota [C]

Se busca aproximadamente **1–3 decisiones importantes por mes de 28 días**, en promedio, sin generarlas artificialmente para cumplir cuota ni bloquear la partida si no aparece ninguna. En un avance de 28 días, un evento importante ocurrido el día 9 **interrumpe en día 9**, no después de procesar los 28. La continuación del avance debe ser explícita y respetar la elección. La notificación de una decisión pendiente es una barrera contra avanzar más días.

## Decisión 11 — Mortalidad permanente y rescates excepcionales [C]

Morir es definitivo; hambre, frío, enfermedad, bandidos y otros riesgos son capaces de matar. Algunas crisis críticas pueden permitir rescates **raros**, con heridos que sobreviven a **1 punto de salud**, meses/años de incapacidad, secuelas permanentes o pérdida práctica de aptitud laboral. Los avisos deben permitir intervenir cuando sea razonable, pero **no garantizar prevención**. No introducir por adelantado traumatología detallada, prótesis, amputaciones o carrera médica: ideas futuras, fuera de 1.0 salvo refinamiento mínimo aprobado.

## Decisión 12 — Llegada excepcional de personas [C]

Nuevos individuos o familias llegan por **eventos muy raros**; el jugador acepta o rechaza. No hay recambio automático que mantenga la población. Rescate de cautivos, comercio, nacimientos, incorporación de bandidos reformados y contratación en tránsito son **ideas futuras**, no mecánicas aprobadas para 1.0. **Sin nacimientos en 1.0**.

## Decisión 13 — Fin de partida solo con extinción [C]

Una aldea puede quedar con recursos cero, sin edificios, con solo ancianos o niños: sigue siendo partida mientras alguien esté vivo. Solo termina cuando la población viva = **0**. No hay victoria obligatoria, ni derrota por llegar a cero en una métrica económica, ni límite de años.

## Decisión 14 — Edades mínimas específicas [C]

- **0–11:** sin trabajo.
- **12+:** agricultura.
- **14+:** construcción.
- **15+:** tala.
- **16+:** guerrero.

Al cumplir edades, el jugador recibe aviso de nuevas opciones; **no se asigna profesión automáticamente**. Los jóvenes pueden producir menos al principio y mejorar por aprendizaje. Las asignaciones voluntarias por parte del jugador siguen requisitos vigentes.

## Decisión 15 — Velocidad de aprendizaje principalmente individual [C]

El factor dominante es el potencial de cada oficio; la edad puede influir moderadamente, no determinar toda carrera. Una persona de mediana edad puede revelar talento sorprendente. Evitar la simplificación de «jóvenes siempre mejores».

## Decisión 16 — Pérdida muy lenta de habilidad en desuso [C]

Las competencias abandonadas declinan **muy lentamente** y recuperan rendimiento más rápido al retomarse. Puede distinguirse entre **maestría histórica** y **eficacia actual**, evitando borrar para siempre la experiencia. No forzar rotaciones para prevenir pérdidas exageradas.

## Decisión 17 — Sistema de personalidad complejo diferido [D]

Rasgos como valiente, precavido o resistente al frío no deben implementarse por ahora. No transformarlos clandestinamente en bonificaciones permanentes; las pistas de potencial profesional no equivalen a un árbol de personalidad.

## Decisión 18 — Consumo alimentario individual variable [C]

Cada persona consume según edad, trabajo/actividad y condición; hay pequeñas fluctuaciones diarias **limitadas y comprensibles**. Mostrar cifras reales y pronósticos con **rangos**, porque no debe sorprender una hambruna por fluctuaciones arbitrarias sin señales. La comida es un problema de decisiones, no una lotería injusta.

## Decisión 19 — Cuatro raciones generales [C]

**Abundante, normal, reducida y emergencia**. Más alimento puede mejorar recuperación/rendimiento, menos alimento reduce productividad y puede dañar salud; emergencia minimiza consumo pero implica riesgos severos. La aldea aplica automáticamente el régimen que eligió el jugador y **no lo cambia sin permiso**. Los factores exactos permanecen por equilibrar.

## Decisión 20 — Prioridades alimentarias simples [C]

Además de la ración general, poder escoger prioridades como **reparto equilibrado, priorizar niños, priorizar trabajadores o priorizar ciertas casas**. No distribución individual grano a grano. Prioridad no fabrica comida: proteger a un grupo puede perjudicar a otro. Los menos prioritarios reciben lo que quede, no un corte arbitrario absoluto. **P:** detalle de prioridad por casa y resolución de empates, interfaz y fórmulas.

## Decisión 21 — Almacenamiento de capacidad compartida [C]

Comida y madera consumen la **misma capacidad** del almacén. Almacenar mucha madera puede impedir guardar cosecha. El jugador podrá más adelante definir prioridades/reservas automáticas sin microgestionar cada unidad. **P:** qué pasa si entra producción con almacén lleno, prioridades exactas, pérdida o rechazo del excedente. No inventar capacidad por recurso separada.

## Decisión 22 — Construcción con trabajadores, materiales y tiempo [C]

Construir consume materiales y exige trabajadores durante tiempo; más constructores acelera hasta un máximo por obra, influido por habilidades. Obras se pueden **pausar y reanudar sin perder progreso**. Constructor automático atiende tareas autorizadas; asignación manual puede ser exclusiva y protegida. **P:** costes, velocidades y cupos por edificio. No construir estratégicamente sin autorización.

## Decisión 23 — Deterioro, mantenimiento y derrumbe [C]

Cada edificio tiene estado de conservación **0–100**. Pierde eficiencia al deteriorarse, luego puede dejar de operar y, tras abandono prolongado, derrumbarse y perderse definitivamente. Daños/ataques aceleran deterioro; deben existir **advertencias oportunas** antes de derrumbe por desgaste normal. Reparación manual o automática, con **reserva mínima configurable de madera** para no consumir materiales estratégicos.

## Decisión 24 — Madera natural ilimitada [C]

El bosque **no se agota** durante la versión 1.0. La extracción no es instantánea ni gratis: depende de leñadores, habilidad, jornada, riesgos y almacenamiento. La reserva natural agotable y la regeneración del bosque quedan **expresamente aplazadas**.

## Decisión 25 — Estaciones e inviernos variables [C]

Primavera con producción agrícola moderada creciente; verano alta; otoño decreciente; invierno **prácticamente nula**. Los inviernos pueden ser suaves, normales o muy duros; el otoño puede dar **indicios imperfectos**, dando tiempo para prepararse. El frío afecta especialmente a habitantes sin vivienda; enfermedad, desgaste y riesgo de muerte pueden aumentar, sin volver imposible la supervivencia por puro azar opaco. **P:** intensidad/tasas exactas.

## Decisión 26 — Defensa con elecciones tácticas, no combate manual [C]

Bandoleros atacan ocasionalmente. Algunas amenazas se anuncian con indicios (huellas, exploradores, viajeros sospechosos), otras sorprenden. Guerreros colocados en puestos defensivos actúan automáticamente de acuerdo con habilidad, atributos, salud, posición y defensas. En ataques importantes, el jugador decide **proteger muralla/almacén, negociar, salida ofensiva**, etc. Mostrar estimaciones de éxito y riesgo ligadas al motor; incluso el 80% puede fallar. Heridas, muertes, recursos y construcciones dañadas son consecuencias posibles. **P:** equipamiento, fórmulas y selección de tácticas; no inventar inventario de armas complejo.

## Decisión 27 — Ampliación de grado mediante requisitos [C]

Subir grado de aldea requiere **población, reservas, estado de edificios y materiales** u otros requisitos bien visibles, no solamente pagar una cifra. Desbloquea más solares y mejores edificios sin que toda mejora implique una construcción nueva. **P:** número de grados, umbrales, coste y espacios otorgados. **A:** grado 1 con 10 solares es propuesta inicial, no parámetro equilibrado.

## Decisión 28 — Recursos iniciales levemente aleatorios [C]

Año 1, primavera, día 1, edificios iniciales en buen estado y **reservas de comida y madera ligeramente variables**, pero siempre dentro de rangos de arranque jugables. Se busca diversidad sin partidas condenadas por la semilla. **P:** unidades iniciales, capacidad de almacén, interacción con población de 15–20 y camas limitadas.

## Decisión 29 — Guardado automático y consecuencias irreversibles [C]

Guardado local **automático** tras cada avance/decisión; **tres espacios de partida**; un estado reciente por espacio; continuar exactamente donde se dejó; indicador visible de guardado y protección técnica del último estado válido contra escrituras interrumpidas. Sin lista de guardados antiguos para retroceder batallas o muertes. Offline. **R:** IndexedDB transaccional, validación de esquema, versiones/migraciones, botón exportar/importar copias externas de seguridad (la exportación sería mejora útil, no un mecanismo de *save-scumming* dentro del juego). **Importante:** el almacenamiento del navegador es local al origen/app y puede borrarse por intervención del sistema/usuario. No prometer persistencia absoluta.

---

# PARTE III — SISTEMAS TRANSVERSALES Y CONEXIONES

## 3. Ontología del dominio: cosas que existen

**Entidades conceptuales:** `GameSave/Partida`, `Village/Aldea`, `Calendar/Fecha`, `Resident/Habitante`, `Family/Familia`, `House/Vivienda`, `Building/Edificio`, `BuildingSlot/Solar`, `Worksite/PuestoTrabajo`, `Assignment/Asignación`, `Job/Profesión`, `ResourceInventory/Inventario`, `RationPolicy/Racionamiento`, `FoodPriority/PrioridadAlimentaria`, `ConstructionProject/Obra`, `MaintenanceTask/Reparación`, `Threat/Amenaza`, `Event/Acontecimiento`, `Decision/Decisión`, `ChronicleEntry/EntradaCrónica`, `RngState/EstadoRNG`. Estos nombres son **recomendación de modelado**; Codex puede renombrarlos con coherencia.

**Invariantes recomendadas:**

- Todo ID persistente es estable, único dentro de la partida y no depende del índice del arreglo.
- Las referencias entre habitante/familia/vivienda/obra/destino usan ID, no copia anidada que se desincroniza.
- Una persona muerta no trabaja ni consume desde la fecha de fallecimiento; sigue registrable en crónica y genealogía.
- `age` derivada de fecha de nacimiento + fecha actual o almacenada con control de coherencia; los cumpleaños nunca duplican incrementos.
- Una persona ocupa a lo sumo una cama y un oficio/destino laboral activo, sujeto a requisitos de edad y cupo.
- El potencial de oficio no aparece en vistas de usuario antes del descubrimiento; no exponerlo inadvertidamente en tooltips, exportaciones públicas, telemetría o atributos HTML visibles. El estado de guardado local podrá incluirlo necesariamente: es **secreto de interfaz**, no criptográfico.
- Inventario jamás negativo; si el almacén está lleno, una política expresa determina qué ocurre.
- Todos los cálculos aleatorios del motor provienen de flujos reproducibles; el renderizado no tira dados.
- La decisión pendiente bloquea el avance; resolverla transforma estado de modo trazable.
- No confundir **simulación**, **informe estimado**, **observación factual** y **texto narrativo**.

## 4. Flujo del jugador, de inicio a décadas futuras

1. Crear aldea (semilla, habitantes, familia, viviendas y reservas).
2. Conocer vecinos y descubrir aptitudes iniciales sin ver las cifras ocultas.
3. Asignar primeras profesiones **manualmente** (cuando el sistema de oficios esté implementado).
4. Elegir qué construir y qué mantener; vigilar almacén compartido.
5. Definir raciones y prioridades; producir al ritmo de estaciones.
6. Prepararse para invierno, sin certeza total de su dureza.
7. Afrontar eventos significativos, heridas, pérdidas, aprendizaje excepcional, rescates poco frecuentes y raros visitantes.
8. Cumplir requisitos para ampliar el grado de aldea y mejorar edificios.
9. Construir una crónica propia sin triunfo obligatorio; al morir el último habitante, cierre memorial.

La **0.1 solo ejecuta los pasos iniciales de generación/observación/calendario/guardado**, no los pasos 3–9, salvo estructuras preparadas y registros de calendario. La supervivencia plena empieza a emerger con 0.4/0.5.

## 5. Calendario como contrato no negociable

- 12 meses de 28 días = 336 días/año.
- Días de año 1…336 y meses 1…12; días de mes 1…28.
- Primavera meses 1–3, verano 4–6, otoño 7–9, invierno 10–12.
- Primavera ordinales 1–84; verano 85–168; otoño 169–252; invierno 253–336.
- Un avance visible de 7 o 28 días es un **bucle de ticks diarios**, no un cálculo agregado inaccesible.
- Al cumplirse 336 días debe haber exactamente un año de envejecimiento natural; las personas cumplen años según su **cumpleaños individual**, no en una misma fecha colectiva.
- Una notificación importante futura impide simular por accidente más allá del día señalado.
- Se puede iniciar partida con contador de días absolutos 0 y fecha visible día 1 o con contador 1, pero **una convención única documentada y probada**; evitar errores de límites.

## 6. Aleatoriedad, probabilidades y justicia

**C:** semilla reproducible, tiradas reales, consecuencias honestas. **R:** RNG determinista explícito con estado serializable o flujos separados por sistema (`worldgen`, `events`, `production`, `combat`) derivados de semilla, facilitando que cambios cosméticos no alteren resultados. Todos los caminos del motor reciben una instancia RNG; ninguna llamada directa a `Math.random()` dentro de lógica reproducible. No usar `Date.now()` para tomar decisiones del mundo; sí puede usarse para metadatos de cuándo se guardó. Mantener orden estable de procesamiento (IDs, prioridades, tareas) antes de ejecutar tiradas que dependen del orden.

Para porcentajes de éxito en versiones posteriores, distinguir **probabilidad calculada** de **estimación del jugador**. Si se muestra «80% de éxito», el motor debe usar el mismo fundamento probabilístico. Si la información es incompleta, mostrar «estimado 65–80%» y explicar condiciones. Redondeos de pantalla no deberían implicar falsa certeza. Deben ser comprobables estadísticamente en tests de equilibrio, además de deterministas en partidas individuales.

**La semilla no es el resultado**: dos partidas con misma semilla pero decisiones diferentes pueden divergir; dos con igual semilla y misma secuencia de acciones deben reproducirse.

## 7. Diseño de habitantes: carácter sin rasgos complejos

La individualidad se expresa inicialmente por edad, familia, nombre, salud, atributos, habilidades, potencial y experiencias. Las pistas narrativas pueden surgir de combinaciones de datos consistentes; no requieren sistema de rasgos tipo «valiente», «pacífico», «tacaño» aprobado. En 0.1 generar pista inicial sin adjudicar un valor fijo simplista que revele el mejor potencial con certeza absoluta. El descubrimiento gradual se activará en versión posterior y debe respetar el historial de profesión, no ser una revelación puramente azarosa inconexa.

Los cinco atributos propuestos son generalistas y distintos de condiciones instantáneas: fuerza ≠ combate; vitalidad ≠ salud actual; destreza ≠ habilidad agrícola; resistencia ≠ energía. Evitar que todos los oficios escalen exactamente con la misma fórmula sin identidad. **R:** futuras funciones por oficio con pesos específicos configurables.

## 8. Trabajo, capacidad y automatización

La automatización debe operar dentro de un **conjunto explícito de permisos**:

- Oficio inicial: solo por orden del jugador.
- Destino del agricultor: huerto concreto, con capacidad.
- Constructores libres: pueden recorrer reparaciones/obras previamente autorizadas; constructores fijados manualmente, no.
- Guerreros: puestos asignados en defensa.
- Asignaciones de vivienda manuales: no reordenar para optimizar camas sin consentimiento.
- Políticas de racionamiento: las fija jugador; el motor aplica en rutina diaria.
- Construcciones/expansiones: jamás crear estratégicamente por iniciativa automática.

**R:** representar la procedencia de cada orden (`source: player|system`) y protección (`locked: boolean`) de forma persistente y auditable. Cuando no pueda completarse la orden (edificio destruido, falta de edad/puesto), mostrar conflicto y pedir intervención o suspender sin reemplazo automático irreversible.

## 9. Alimentación y almacén como tensión de gestión

La escasez debe emerger de la combinación de (a) población y necesidades individuales variables, (b) producción ligada a estación/trabajo, (c) política de ración, (d) prioridades de reparto y (e) almacén de capacidad compartida. Si la aldea tiene suficiente madera pero no comida, eso es una decisión estratégica; si no puede guardar la cosecha porque el almacén está lleno de madera, debe avisarse oportunamente.

**R:** separar `requestedFood`, `allocatedFood`, `consumedFood`, `hungerImpact`, `wastedFood` para explicar cada cambio. En interfaz distinguir unidades almacenadas, consumo diario observado y rango proyectado. Que una casa tenga prioridad alimentaria no significa que automáticamente merezca más alimentos por habitarla: se trata de prioridad **entre moradores** según la orden activa. Niños deben tener una necesidad base propia; no usar una multiplicación ciega de ración adulta.

No confundir «madera del bosque infinita» con madera ya almacenada infinita. Un almacén sigue lleno y las obras consumen madera real.

## 10. Daño, mortalidad y eventos que cuentan historias

Riesgo acumulativo: hambre/frío/edificio roto pueden producir avisos y deterioro gradual; ataques y eventos permiten shocks agudos. Un adulto muy habilidoso puede morir igualmente. Un superviviente de una situación extraordinaria puede aprender mucho y quedar incapacitado. No castigar siempre de la misma manera ni premiar siempre con una subida de nivel; registrar **causa, participantes y consecuencias** para futura crónica. Muerte irreversible dentro de la ranura, no irreversible frente a exportación física hecha por el usuario; no prometer medidas imposibles contra copias de archivos.

El evento debe tener contexto, requisitos, opciones, probabilidades y consecuencias explícitas. El log narrativo se genera **a partir del estado y resultado**, no al revés. El motor decide, la presentación cuenta lo ocurrido.

## 11. Lo que expresamente NO debe añadirse en 1.0 sin acuerdo

- Nacimientos, embarazos, sistema generacional de reproducción.
- Árbol complejo de personalidad o psicología social.
- Agotamiento y regeneración del bosque.
- Medicina compleja, prótesis, mutilaciones sofisticadas, médicos como profesión nueva.
- Comercio general, mercados, reclutamiento ordinario, bandas reformadas, mercenarios como nueva profesión.
- Equipos, inventario personal, armas elaboradas, árboles tecnológicos enormes.
- Mapas grandes, desplazamiento espacial fino, control táctico de cada golpe.
- Monetización, micropagos, gacha de pago.
- Nuevos oficios porque aparecían en prototipos anteriores.

Estas ideas no se prohíben para siempre: quedan **DIFERIDAS**, para decidir después de estabilizar 1.0.

---

# PARTE IV — HOJA DE RUTA DEL PRODUCTO

## 12. Criterio transversal de cada versión

Cada entrega debe ser **integrable, comprobable, guardable y reversible vía Git**, sin romper partidas previas arbitrariamente. Separar: lógica pura de simulación, modelos y reglas, persistencia, interfaz, pruebas, documentación. Cuando cambie el esquema, definir migración y conservar compatibilidad razonable. La UI debe reflejar solo funciones activas; ninguna cifra sin cálculo. Cada versión añade pruebas de regresión.

### Versión 0.1 — Fundación técnica y primera aldea (PRIORIDAD ABSOLUTA)

**Jugable** significa aquí «puedo crear, conocer, avanzar, guardar y retomar», no «ya puedo sobrevivir al invierno». Entregables obligatorios:

1. Repositorio TypeScript, Vite y React (recomendación) con comandos de ejecutar/probar/compilar.
2. Dominios tipados: partida, aldea, calendario, habitante, familia, vivienda inicial, inventario inicial, registro, RNG y guardado versionado.
3. Creación determinista de 15–20 habitantes coherentes por familia, con datos de futuro; todos sin oficio.
4. Estado inicial de aldea grado 1, primavera día 1 año 1; reservas leves aleatorias; edificios iniciales modelados según las propuestas acordadas, marcados si son provisionales.
5. Distribución inicial automática por casas, prioridad familiar; conflicto 15 camas vs 15–20 personas *visibilizado*.
6. Calendario 12×28, avance 1/7/28 con ticks diarios, cumpleaños, cambios de estación, avisos de edades laborales.
7. UI horizontal Android-first: portada/ranuras, vista de aldea, lista de habitantes, ficha completa sin revelar potenciales, registro.
8. Tres ranuras persistentes, guardado automático y manejo de error; carga determinista; validación y versión de esquema.
9. Contrato de eventos pendientes y suspensión de avance, sin obligar a implementar eventos complejos.
10. Pruebas unitarias, integración de guardados, accesibilidad táctil y pruebas reales en Android.

**No implementar**: agricultura real, tala real, consumo, hambre progresiva, deterioro, construcción, oficio asignable funcional, combate, migración entre aldeas, llegada de visitantes, eventos mayores completos. No degradar personas que envejecen en 0.1 por no tener sistema de alimentación aún. Recomendación: mostrar «reservas iniciales — simulación económica disponible en 0.4» para evitar expectativas engañosas.

### Versión 0.2 — Edificios y capacidades

**Objetivo**: convertir el plano inicial en una aldea administrable. Funciones:

- Solares limitados por grado; catálogo de casas, huertos, almacenes, futuras defensas.
- Casas con capacidad definida, ocupación, asignación manual protegida y convivencia.
- Huertos con trabajadores máximos y estados (todavía sin economía completa si depende de 0.3).
- Almacén de capacidad **compartida** madera+comida, reportes de saturación y reglas de excedentes definidas.
- Construcción con madera, tiempo y constructores, incluida obra pausada; definir tareas manuales/automáticas sin obligar a asignaciones complejas antes de 0.3.
- Conservación 0–100, mantenimiento y avisos de derrumbe; su simulación completa puede escalonarse con oficio de constructor, no dejar datos incompatibles.
- Requisitos de expansión de grado; metas claras sin inventar límites permanentes.
- Tests de cupos, obras, persistencia y casos límite.

**Dependencias 0.1:** IDs de edificios y solares, asignación protegida y modelo compartido de inventario. **P:** costes, límites y problema de camas iniciales, a resolver antes de fijar jugabilidad real de vivienda.

### Versión 0.3 — Profesiones, puestos, experiencia y potencial

**Objetivo**: convertir a cada persona en agente de trabajo manejable.

- Asignación inicial **manual** desde menú de habitantes o profesión.
- Cuatro menús específicos y puestos: agricultura a huerto, tala a bosque, constructores a trabajos priorizados/autorizados o tarea manual exclusiva, guerreros a puestos de guardia.
- Cupos por puesto, edad mínima 12/14/15/16, avisos de cumpleaños, desempleados sin autoasignación.
- Productividad a partir de habilidad + atributos pertinentes + salud/edad/condiciones; parámetros centralizados.
- XP por práctica, revelación gradual de talentos específicos, potenciales ocultos, límites individuales, historial y habilidad eficaz.
- Atributos físicos suben lentamente; edad introduce declive gradual, sin retiro obligatorio.
- Recuperación rápida de habilidad olvidada en contraste con pérdida muy lenta.
- Automatización respetando órdenes manuales, sin construir ni inventar profesiones.
- Tests de movilidad entre oficios, cupos, edad, rendimiento, progreso y persistencia.

**Dependencias:** 0.1 ya guarda habilidades/potencial, 0.2 ya tiene puestos físicos; permitir migrar partidas existentes.

### Versión 0.4 — Economía, estaciones y alimentación

**Objetivo**: ciclo productivo con decisiones de reservas.

- Huertos producen según estación, trabajadores, habilidad y clima.
- Bosque produce madera sin agotamiento natural, limitado por trabajadores y espacio.
- Consumo por habitante, edad, trabajo/condición y variación acotada; cálculo diario verificable.
- Raciones abundante/normal/reducida/emergencia, sin autocambios estratégicos.
- Prioridades alimentarias simples: equilibrada, niños, trabajadores o viviendas señaladas.
- Ocupación del almacén compartido, alertas de saturación, reserva mínima de madera para reparaciones.
- Informes de cambio diario y proyección en **rangos**.
- Ritmo primavera/verano/otoño/invierno; sin hambrunas imposibles de prevenir por un número oculto.
- Tests de conservación de recursos, raciones, prioridades y límites del almacén.

**Dependencias:** modelo de inventario y de habitantes ya validado en 0.1.

### Versión 0.5 — Salud, hambre, vivienda e invierno peligroso

**Objetivo**: supervivencia real.

- Salud, desnutrición, recuperación, consecuencias de raciones extremas.
- Vivienda y exposición al frío, especial vulnerabilidad sin techo.
- Inviernos suaves/normales/duros determinados por semilla, pronósticos imperfectos en otoño.
- Enfermedad y mortalidad posibles; muertes permanentes y final únicamente sin supervivientes.
- Heridas/incapacidades conforme al alcance de salud aprobado, sin medicina compleja.
- Avisos proporcionados antes de crisis previsibles; crónica de fallecimientos.
- Tests de supervivencia razonable, alta variabilidad sin imposibilidad sistemática, adulto/menor/anciano, final de partida.

### Versión 0.6 — Seguridad, guerreros y ataques

**Objetivo**: defensa táctica de alto nivel.

- Asignación de guerreros a muralla/bosque/aldea con plazas y efectos concretos.
- Amenazas y asaltos ocasionales, algunos anticipados.
- Resolución según habilidades, atributos, salud, puestos, estructura defensiva y RNG.
- Opciones tácticas con riesgos y porcentajes honestos; sin combate individual por turnos.
- Daño a almacenes/edificios, heridos, muertes, rescates excepcionales.
- Interrupción del avance por amenazas de decisión y reanudación tras resolver.
- Tests de consistencia estadística y determinismo; no prometer seguridad al 100%.

### Versión 0.7 — Eventos, crónica profunda y pulido de experiencia

**Objetivo**: hacer que la simulación cuente historias singulares.

- Sistema de eventos por contexto y requisitos, con opciones de riesgo graduable/aceptar/rechazar/obligadas/automáticas.
- 1–3 decisiones importantes/mes como orientación, no cuotas rígidas; incidentes cotidianos a crónica.
- Eventos raros de llegada de nuevos habitantes, con aceptar/rechazar.
- Subidas de habilidad especialmente relevantes en sucesos extraordinarios, heridas y trayectorias personales.
- UI de revelación visual para talentos/acontecimientos verdaderamente importantes.
- Crónica navegable por habitante, familia y fecha; explicación de cambios y probabilidades.
- Ajustes de interfaz horizontal, claridad de alertas y accesibilidad.
- Tests de resolución de decisiones, reanudación de simulación, eventos infrecuentes y rendimiento.

### Versión 1.0 — Equilibrio, compatibilidad, estabilidad y publicación

**Objetivo**: integrar y pulir, no disparar el alcance.

- Ajuste de población, cupos de casas, reservas iniciales, rendimientos, meses y alimentación, probabilidades de daño y muerte.
- Partidas de 1, 5, 20 y más años; distintos perfiles de juego y semillas aleatorias.
- Test de que un progreso razonable es posible sin diseñar una «semilla ganadora» fija.
- Migraciones de partidas, respaldo/exportación si se incorpora, recuperación de errores, offline real.
- Rendimiento Android en orientación horizontal y con listas/historias extensas.
- Eliminación de datos de prueba falsos, iconos/sonidos si aprobados, tutorial integrado, accesibilidad.
- Publicación PWA y, si procede, empaquetado APK probado en dispositivo.
- Sin nacimientos, rasgos complejos, recursos forestales agotables ni otras ideas diferidas.

## 13. Dependencias para no rehacer [R]

| Si la 0.1 prepara… | En la 0.2–1.0 evita rehacer… |
|---|---|
| IDs únicos y relaciones por ID | Viviendas, genealogías, muertes, crónicas y traslados |
| Calendario 336 días + tick diario | Estaciones, hambre, producción, cumpleaños, eventos |
| RNG serializable y determinismo | Combates, eventos, potencial, dificultad de invierno |
| Modelo de guardado versionado | Compatibilidad entre todas las versiones |
| `status` y `assignment` con procedencia | Protección de trabajos y viviendas manuales |
| Skills y potenciales por profesión | 0.3 aprendizaje sin alterar personajes existentes |
| Inventario flexible con capacidad compartida | 0.4 alimentación + madera + excedentes |
| Construcciones y slots con IDs | Obras, daños, reparaciones y expansión |
| Crónica persistente tipada | Historias, búsquedas, muerte y resumen final |
| Simulación pura sin acceso a UI | Pruebas, cambios visuales, APK, velocidades |
| Evento pendiente serializable | Pausa a mitad de avance y reanudación sin inconsistencias |
| Constantes y balance desacoplados | Cambiar rendimientos sin reescribir lógica |

---

# PARTE V — SEGUIMIENTO, HUECOS Y CONTRATOS CON CODEX

## 14. Asuntos abiertos que no deben ocultarse

| ID | Asunto | Estado y tratamiento recomendado |
|---|---|---|
| P-01 | 15–20 habitantes vs 3 casas × 5 = 15 camas | **P**. Mantener propuesta inicial y mostrar desamparo si procede, sin activar penalizaciones hasta 0.5; decidir diseño final antes del balance 0.2/0.5. |
| P-02 | 10 solares, 3 casas, 2 huertos, 1 almacén | **P**. Propuesta de arranque, no regla numérica cerrada. |
| P-03 | Nombres, parentescos y edades realistas | **P/R**. Proponer tablas y pruebas generativas; preservar diversidad y viabilidad. |
| P-04 | Salud/hambre exactas, escala de energía, XP | **P**. Estado inicial persistente desde 0.1, fórmulas en entregas respectivas. |
| P-05 | Tiempo de construcción, recursos, capacidad de almacén | **P**. Valores configurables, no fijar por accidente en 0.1. |
| P-06 | Probabilidades de ataques/eventos/inviernos | **P**. Balance en 0.5–1.0. |
| P-07 | Edad exacta de nacimiento en un calendario sintético | **R**. Diseñar fechas relativas robustas y comprobar aniversarios. |
| P-08 | Atributos/skills 0–100 y fórmula 60/40 | **C estructura + R ponderación**. Escalas propuestas, fórmula no definitiva. |
| P-09 | Guardados exportables, restauración y copia de seguridad | **R**. Muy recomendable para Android; no equivale a guardar «hacia atrás» dentro del juego. |
| P-10 | UX final, botones, arte, escala del mapa | **P**. Horizontal táctil imprescindible; estilo gráfico no cerrado. |
| P-11 | Riesgo de falsificar porcentajes al redondear | **R**. Evitar mostrar riesgos que no derivan de modelo real. |
| P-12 | Arquitectura React/IndexedDB/API de WebView | **R**. Se recomienda y debe validarse en PC/Android; no es decisión narrativa inmutable. |

## 15. Reglas de colaboración con Codex

1. **No comenzar por 1.0**; ejecutar de forma incremental 0.1.0, 0.1.1… en ramas o PRs pequeños.
2. Hacer cambios en GitHub, con commits descriptivos; mantener `main` estable.
3. Antes de implementar una fase, enumerar hechos confirmados usados y supuestos técnicos provisionales.
4. Si contradice el contrato de 336 días, primeros oficios manuales, RNG, familias, guardado y no monetización, **parar la implementación** de ese aspecto y corregir.
5. Nunca escribir lógica aleatoria de partida en componentes React, ni en renderizadores de texto.
6. Escribir pruebas de aceptación antes o junto con funcionalidad, demostrar salidas y estado de compilación sin simular evidencias.
7. No considerar terminada una tarea solo porque se vea bonita; verificar que soporta cerrar/reabrir y reproduce semilla.
8. No inventar assets de FMS CEO ni portar código o datos de tercero sin evaluar derechos y necesidad.
9. Evitar añadir habilidades o subsistemas porque un prototipo antiguo los tenía.
10. Cuando pida el usuario «qué sigue», dar una única tarea concreta y su razón, no 30 preguntas.

## 16. Referencias disponibles y usos válidos

**[R1] `Aldea_Viva_Documento_Maestro.md` / `-1.md`:** compendios anteriores de 29 decisiones; este documento aporta los matices y conflictos conocidos.  
**[R2] Conversación de diseño:** decisiones numeradas 01–29 y matices en la sección II. Las formulaciones completas de todas las intervenciones anteriores no están todas reproducidas literalmente en los archivos; esta memoria pretende conservar lo esencial, no fingir transcripciones.  
**[R3] `FMS_CEO-main.zip` y su README:** ejemplo real de videojuego de gestión con PWA, Android WebView horizontal, guardados en varias ranuras, importación/exportación, eventos y avance por días; ver análisis técnico del anexo 03.  
**[R4] `aldea_v01.html`–`aldea_v04.html`:** pruebas previas de presentación y sistemas; **no** bases de código ni reglas vigentes por sus divergencias de calendario y empleo.  
**[R5] `npc_arena_v01.html`–`npc_arena_v05.html`:** prototipos de combate/IA distintos; fuera del alcance actual; no inferir mecánica de combate para Aldea Viva.  
**[R6] `README.md`, `CHANGELOG.md`, `main.js`, `sw.js`, `manifest.webmanifest.txt` del paquete aportado:** contexto FMS CEO y despliegue, no diseño de Aldea Viva.

## 17. Contrato de cierre del documento

La **memoria funciona como preservación de visión**; la **especificación 0.1** es la instrucción operativa. Todo dato que se afirme como implementado debe demostrarse en repositorio y pruebas. A fecha de esta memoria, **no se presume que la nueva 0.1 esté implementada**. El objetivo más inmediato no es demostrar supervivencia, sino conseguir que una aldea generada de manera coherente pueda **crearse, explorarse, avanzar 336 días correctos, guardarse, cerrarse y recuperarse** en Android y PC. Sin eso, toda mecánica futura se apoyaría en arena.
