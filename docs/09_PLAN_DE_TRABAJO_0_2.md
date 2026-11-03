# Aldea Viva — Organización de la versión 0.2

Fecha: 2026-11-02. Estado: **implementación 0.2 completada en local; comprobación final Android pendiente**. Ver [seguimiento 0.2](10_SEGUIMIENTO_0_2.md).

El usuario pidió organizar lo que hará la 0.2 y después autorizó «sip, dale, arranca con la 0.2». Queda autorizado desarrollar lo acordado, incluido el calendario visual. Las propuestas pendientes no se convierten en reglas confirmadas ni se autorizan nuevos commits, push o publicaciones por esa petición.

## 1. Objetivo y fuentes

**Gestionar físicamente el asentamiento: edificios, viviendas, solares y almacén.** El jugador podrá consultar cada edificio, decidir dónde vive cada habitante y preparar las obras y ampliaciones permitidas por sus recursos.

Referencias de diseño:

- [Biblia, decisiones 02 y 21–23/27 y apartado de versión 0.2](01_BIBLIA_DE_DISENO_0_1_A_1_0.md).
- [Hoja de ruta, sección 0.2](06_PLAN_DE_VERSIONES_0_1_A_1_0.md).
- [Índice de decisiones y pendientes](05_DECISIONES_Y_PENDIENTES_RAPIDOS.md).

Las fuentes originales se conservan sin reescribir. En este plan: **C** = regla confirmada; **R** = propuesta de trabajo/implementación; **P** = decisión pendiente; **D** = activación diferida.

## 2. Punto de partida comprobado

- Base en Git: `fc0783f0517604f656386edab314c7892d11a64b`, rama `main`, sincronizada al iniciar esta planificación y sin modificaciones locales.
- El usuario dio por cerrada la validación funcional de la 0.1 y confirmó también el funcionamiento por semilla. La extracción/comparación automática completa del mundo entre PC y Android no se ejecutó; no se reinterpretan los registros históricos como si el agente la hubiese realizado.
- Edificios existentes: casas, huertos y almacén, todos con ID, solar y conservación. Los solares y edificios se referencian mutuamente.
- Configuración de la 0.1: 3 casas de 5 camas, 2 huertos con 2 puestos cada uno, 1 almacén de 600 unidades y 10 solares. El usuario aprobó 4 casas/20 camas para las aldeas nuevas de la 0.2, ya implementadas en el primer tramo de desarrollo. Las otras cifras conservan su condición provisional.
- Las viviendas ya registran residente, casa o ausencia de casa, origen `system/player` y protección `locked`. El reparto automático actual se realiza solo al generar la aldea.
- El almacén ya valida `alimentos + madera <= capacidad compartida`. La interfaz muestra cantidades reales, pero no existe gestión de excedentes ni reservas para obras.
- Aún no existen comandos para cambiar vivienda, proyectos de obra, tareas de mantenimiento, catálogo con costes ni ampliación de grado.
- Guardados con esquema 1, validación estricta y tres ranuras. Cambiar los modelos sin migración dejaría las partidas antiguas incompatibles; la compatibilidad es parte de esta versión.
- Base de comprobación anterior: 186 pruebas y compilación correctas. No se volvieron a ejecutar por redactar este plan.

## 3. Qué podrá hacer el jugador

| Función | Entrega 0.2 | Estado de diseño |
|---|---|---|
| Solares | Ver los libres, ocupados y reservados para un proyecto; abrir su detalle | C; composición visual R |
| Edificios | Consultar casa, huerto y almacén con ocupación, capacidad y conservación reales | C |
| Viviendas | Elegir una persona y moverla a una casa con plaza; la orden queda protegida | C |
| Familias | Ver familiares y convivencia al decidir un traslado; no alterar parentescos al mudar a alguien | C; disposición de la pantalla R |
| Huertos | Ver cupos de trabajo; su asignación y producción se activarán en las versiones correspondientes | C/D |
| Almacén | Ver cantidades, total ocupado, espacio libre y recursos comprometidos si se aprueba esa política | C; reservas R/P |
| Obras | Elegir tipo y solar, revisar materiales, preparar y pausar/reanudar un proyecto | C; política de pago/cancelación P |
| Conservación | Mostrar estado real y preparar tareas de mantenimiento coherentes | C; avisos y prioridades concretas P |
| Ampliación | Consultar requisitos de grado y ampliar solares al cumplir los requisitos aprobados | C; costes, grados y cupos P |
| Persistencia | Conservar decisiones y continuar partidas 0.1 mediante migración probada | C |

**Límite de la entrega:** una obra no avanzará ni completará edificios sin constructores autorizados. La recomendación de la hoja de ruta es dejar los proyectos preparados o pausados en 0.2 y activar el trabajo en 0.3. La pantalla explicará esta dependencia. No habrá una cuenta atrás ficticia.

## 4. Seis bloques de desarrollo

Cada bloque debe terminar con una parte comprobable, sus pruebas pertinentes y un informe breve. El orden evita conectar pantallas a datos que todavía no se pueden guardar. Los cambios locales de desarrollo se realizarán tras acordar el inicio de implementación; los commits y subidas mantienen su permiso separado.

### B1 — Compatibilidad y reglas de base

**Resultado:** la 0.2 puede abrir las tres partidas de la 0.1 conservando habitantes, familias, RNG, calendario, viviendas e inventario.

- Diseñar solo los campos adicionales necesarios: estado de solar, proyecto, compromisos de recursos y requisitos de grado; sin módulos vacíos para sistemas futuros.
- Preparar lectura de esquema 1 y del nuevo formato; migración pura, validación antes y después, confirmación transaccional y control de conflictos entre pestañas.
- Mantener separadas la versión del guardado, la versión del generador y los parámetros iniciales. Modificar camas de aldeas nuevas no regenera aldeas existentes ni reinicia su RNG.
- Aplicar la decisión aprobada de 4 casas de 5 plazas a aldeas nuevas. Conservar los 15–20 habitantes y el reparto familiar inicial, de modo que todos puedan alojarse. Si se mantienen los otros edificios y los 10 solares provisionales, habrá 7 solares ocupados y 3 libres; no aumentar los solares automáticamente para compensar la cuarta casa.
- No hace falta cambiar la versión física de IndexedDB si sigue bastando la tabla actual; decidirlo al implementar.

**Pruebas:** equivalencia de todos los datos anteriores al migrar, tres ranuras independientes, migración repetida sin duplicar nada, formato desconocido protegido, fallo de escritura y conflicto con una pestaña antigua. La versión 0.1 debe bloquear un guardado futuro en lugar de intentar sobrescribirlo.

### B2 — Solares y fichas de edificios

**Resultado:** una vista de la aldea permite reconocer los espacios disponibles y abrir cada edificio o proyecto.

- Mostrar grado, solares totales y estado de cada solar sin contar como libre uno reservado por una obra.
- Fichas de casa, huerto y almacén alimentadas por selectores reales.
- Propuesta visual: un plano sencillo mediante tarjetas/casillas, con los colores y tipografías existentes. No requiere mapa caminable ni motor gráfico nuevo.
- Catálogo inicial propuesto: los tres tipos ya existentes. Las defensas futuras no tendrán acciones jugables antes de su versión.

**Pruebas:** correspondencia edificio/solar, imposibilidad de ocupación doble, estados visibles correctos, navegación táctil/teclado, escritorio y móvil horizontal, consola y guardado tras recarga.

### B3 — Vivienda manual protegida

**Resultado:** el jugador puede cambiar la vivienda de una persona y la aldea respeta su decisión.

- Mostrar moradores, plazas libres, familiares y habitantes sin vivienda.
- Traslado individual a una casa con plaza. Un cambio de residencia no cambia el ID del habitante, su familia ni sus relaciones.
- Mantener la vivienda anterior si el destino es inválido o está lleno; no expulsar a otra persona automáticamente.
- Marcar el movimiento como orden del jugador protegida. El paso del tiempo, la recarga y cualquier rutina automática deben respetarlo.
- No añadir un botón de reasignación automática general por inercia. El alcance de permitir dejar a alguien sin vivienda o mover una familia de una vez se decidirá expresamente antes de añadir esas acciones.

**Pruebas:** casa llena, persona ya alojada en ese destino, referencias inválidas, ausencia de duplicados, traslado preservado al avanzar y reabrir, ninguna mutación de parentescos ni RNG, fallo de guardado con recuperación del estado confirmado.

### B4 — Almacén compartido y recursos comprometidos

**Resultado:** el jugador entiende cuánto tiene, cuánto cabe y qué materiales puede utilizar.

- Una sola capacidad para comida y madera, sin topes independientes.
- Preparar un contrato para entradas/salidas de recursos y resolución explícita del excedente; no añadir botones de crear recursos a la interfaz.
- **C — P2:** aceptar la parte de una entrada que quepa y rechazar el sobrante, avisando de la cantidad no almacenada. El usuario aprobó el ejemplo de guardar 10 y rechazar 5 cuando llegan 15 y solo hay 10 unidades libres. No se borra inventario anterior ni se inventa almacenamiento exterior. Se aplica a las operaciones de entrada de la 0.2 tanto en aldeas nuevas como migradas; no modifica sus reservas al cargarlas.
- **C — P3:** los materiales reservados para un proyecto siguen físicamente en el almacén: `disponible = existencias - comprometido`. Siguen ocupando capacidad y no pueden comprometerse en una segunda obra. Pausar mantiene la reserva; cancelar antes de empezar la libera íntegra, sin crear recursos ni requerir una devolución a un almacén que pudo llenarse.
- **C — P3:** los materiales se consumen una sola vez al comenzar el trabajo real de los constructores en 0.3. Preparar un proyecto en 0.2 no gasta esa madera. La cancelación tras haber empezado una obra queda por definir para la versión en que sea posible.

**Pruebas:** límites exactos de capacidad compartida; entrada parcial 15/10 con 10 almacenados y 5 rechazados; almacén lleno con cero aceptado; cantidades negativas/insuficientes rechazadas; reserva doble impedida; conservación de recursos al reservar/liberar y persistencia tras fallos. Toda cantidad mostrada debe salir del mismo inventario autoritativo.

### B5 — Proyectos de obra, mantenimiento y ampliación

**Resultado:** el jugador puede preparar una obra válida y entender sus requisitos y su estado.

- Elegir edificio y solar, mostrar coste/capacidad y confirmar una orden antes de comprometer recursos.
- Reservar el solar y aplicar una sola vez la política de materiales aprobada. Pausar/reanudar conserva progreso y compromisos; no vuelve a cobrar.
- En 0.2 no hay constructores operativos: el tiempo no aumenta el progreso, no termina edificios ni aplica reparaciones.
- Conservar el estado de los edificios y preparar tareas autorizadas de mantenimiento. No activar deterioro, inoperancia o derrumbe sin el sistema conectado y sus reglas aprobadas.
- Mostrar requisitos de ampliación y ejecutarla solo cuando se cumplan los criterios acordados. Añadir solares exige IDs nuevos estables y no reubica edificios ni moradores.
- Los primeros requisitos deben poder alcanzarse con los sistemas disponibles en 0.2. No exigir visitantes, producción, profesiones o edificios que no puedan terminarse todavía.

**Pruebas:** solar reservado dos veces, materiales insuficientes, pago/reserva única al reanudar, progreso cero sin trabajadores, conservación al recargar, acciones no autorizadas rechazadas, ampliación que no cobra/desbloquea dos veces y bloqueo íntegro si falla cualquier requisito.

### B6 — Integración, migración real y Android

**Resultado:** la versión se puede probar como conjunto, con sus límites visibles y partidas anteriores conservadas.

- Pruebas de integración que combinen migrar, mudar, reservar materiales, preparar/pausar una obra, avanzar y cerrar/reabrir.
- Conservar las pruebas de calendario, RNG, generación, persistencia y conflictos de la 0.1; actualizar expectativas solo ante una decisión explícita de diseño.
- Ejecutar los scripts de tipos, pruebas y compilación; verificar interfaz y errores de consola con Brave aislado y compatibilidad con Opera GX donde corresponda.
- Repetir en Android físico instalación/actualización, controles, modo avión y persistencia de órdenes y tres aldeas.
- Preparar seguimiento y revisión de aceptación de 0.2. No crear etiqueta ni publicación por el hecho de haber pasado pruebas.

## 5. Decisiones pendientes, una por vez

| Orden | Decisión | Momento en que importa |
|---|---|---|
| P1 — Resuelta | **4 casas/20 camas en aldeas nuevas**, aprobado expresamente por el usuario; partidas existentes sin redistribución | Aplicar y probar al modificar generación en B1/B2 |
| P2 — Resuelta | **Almacenar lo que quepa y rechazar el sobrante con aviso**, aprobado expresamente por el usuario | Aplicar y probar en B4 |
| P3 — Resuelta | **Reservar al preparar, conservar al pausar, liberar al cancelar antes de empezar y consumir una sola vez al iniciar el trabajo real**, aprobado por el usuario | Aplicar y probar en B4/B5; consumo real desde 0.3 |
| P4 — Costes aprobados | **Casa 30, huerto 20 y almacén 40 unidades de madera**, como valores provisionales de prueba. Capacidades actuales conservadas; plazos de trabajo para 0.3 | Aplicar y probar al conectar B4/B5 |
| P5 — Resuelta | Grado 1→2: 15 habitantes, 150 alimentos, conservación mínima 80 %, coste 50 de madera disponible y 4 solares nuevos. Provisional aprobado por el usuario | Implementado en B5 |
| P6 | Acciones adicionales de vivienda: dejar sin casa y mover grupos familiares | Solo si se desean dentro de B3 |
| P7 — Controles preparados | Autorizar/retirar mantenimiento por edificio, prioridad normal/alta y reserva mínima editable (0 por defecto). Sin reparación ni gasto en 0.2 | Implementado; tasas y trabajo real diferidos a las versiones con constructores |

**Decisión P1 confirmada:** el usuario eligió «4 casas y 20 camas: todos empiezan alojados». Es una regla aprobada e implementada para el arranque de aldeas nuevas de la 0.2; no es un ajuste retroactivo de las partidas existentes.

**Decisión P2 confirmada:** el usuario eligió «Guardar 10 y rechazar las 5 sobrantes, con aviso». Queda aprobada la aceptación parcial de entradas. La política está documentada; todavía no está implementada.

**Decisión P3 confirmada:** el usuario respondió «me parece bien» a la política de reserva, pausa, liberación antes de comenzar y consumo único al inicio del trabajo real. No define el reintegro de una obra parcialmente ejecutada de versiones posteriores. La política está aprobada, todavía no implementada.

**Alcance de P1:** el cambio a cuatro casas se aplica a aldeas nuevas. Las existentes mantienen sus edificios, camas, habitantes y viviendas al migrar; cualquier cambio retroactivo exigiría una decisión específica. No se añaden casas silenciosamente.

**Decisión P4 confirmada:** el usuario aprobó «sip, está bien» los costes provisionales de prueba de 30 unidades de madera para casa, 20 para huerto y 40 para almacén. Se conservan las capacidades actuales de 5 camas, 2 puestos y 600 unidades, respectivamente; las dos últimas siguen siendo provisionales. Las cantidades permiten preparar varias obras con las reservas de arranque de 80–100 unidades de madera. Se reservarán según P3 y no se gastarán antes de comenzar el trabajo real. Están aprobadas para probar, pero todavía no implementadas ni fijadas como balance definitivo. El plazo/carga de trabajo se concretará con los constructores de 0.3, sin mostrar una duración inventada en 0.2.

Las cifras que se aprueben para pruebas se marcarán como provisionales cuando corresponda; no se presentarán como equilibrio definitivo de la 1.0. No se pedirán todas las decisiones juntas.

## 6. Protección de las partidas y de la semilla

- Un movimiento de vivienda o la preparación de una obra no consume azar de simulación salvo regla explícita que lo requiera.
- Una partida antigua no vuelve a pasar por el generador al actualizarse. Se preservan RNG y versiones de origen.
- Si cambia la distribución de edificios iniciales, usar una configuración/generación identificable para aldeas nuevas y mantener la referencia histórica de las antiguas.
- Migrar no añade coste, progreso ni orden manual ficticios al mundo anterior.
- Si una escritura falla, la interfaz no presenta la mudanza, reserva u obra como confirmada; reintentar conserva exactamente la misma operación.
- Las dos versiones pueden convivir en pestañas del mismo origen: el control de versión y revisión debe impedir una sobrescritura silenciosa.
- La actualización de la PWA no cambia el origen de los guardados. Crear otro enlace temporal o pasar a otro dominio no traslada las partidas del teléfono; la forma de distribuir la prueba se decidirá antes de cambiar la dirección utilizada.

## 7. Qué pertenece a versiones posteriores

- 0.3: primer oficio manual, puestos, constructores operativos, habilidades y aprendizaje.
- 0.4: producción de huertos, tala efectiva, consumo y políticas alimentarias.
- Supervivencia/deterioro completo, daños y derrumbes: según sus dependencias y decisiones de las siguientes versiones; no activarlos como consecuencia secundaria de añadir una ficha de conservación.
- Combate, visitantes, nacimientos, personalidad compleja, economía comercial y APK: conservan su lugar o exclusión en el plan maestro. No se incluyen en esta planificación de 0.2.

## 8. Condición de salida propuesta

La 0.2 estará lista para revisión cuando se pueda abrir una partida 0.1 sin perder datos; inspeccionar solares y capacidades; mudar habitantes respetando cupos y órdenes; gestionar el almacén compartido según política acordada; preparar y pausar obras sin cobros duplicados ni progreso sin constructores; consultar/ejecutar la ampliación aprobada; y recuperar todo tras cerrar, actualizar o usar modo avión en los escenarios probados.

La revisión distinguirá funciones activas, estructuras preparadas y sistemas diferidos. Este documento organiza el trabajo; no acredita que ya se haya implementado o probado la 0.2.

## 9. Consulta del usuario: calendario visual

El usuario preguntó en qué versión será visual el calendario. La hoja de ruta original asigna el motor temporal a 0.1, pero no fija una versión específica para una pantalla de calendario mensual.

**C — Inclusión aprobada:** el usuario aceptó añadir el calendario visual a 0.2 y autorizó comenzar el desarrollo. Vista mensual de los 28 días, día actual destacado, mes/año, estación y cumpleaños de habitantes conocidos. Navegar por los meses no adelanta la simulación; los botones de avance siguen siendo las únicas órdenes de paso del tiempo.

El calendario reutiliza las fechas y cumpleaños existentes. No añade predicciones de eventos aleatorios, clima futuro, producción ni reglas nuevas de calendario. Su primera implementación y pruebas están documentadas en el seguimiento.
