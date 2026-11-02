# ALDEA VIVA — PLAN DE VERSIONES Y CONTRATOS ENTRE 0.1 Y 1.0

**Documento de planificación, no autorización para programarlo todo de inmediato.**  
**Estado:** los objetivos generales de versión proceden del diseño confirmado; los límites de entrega, contratos de código y pruebas son recomendaciones de ingeniería para minimizar retrabajo.  
**Leer primero:** Biblia completa (01), especificación de 0.1 (02), decisiones rápidas (05).

## 0. Filosofía de versiones

Cada versión debe tener **un bucle que funcione**, guardar lo realizado y conservar compatibilidad con datos anteriores siempre que sea viable. La división es una guía; si una dependencia exige mover un componente entre versiones, se puede hacer sin cambiar las reglas de producto. El principal error que debemos evitar es llenar la 0.1 de sistemas a medio implementar. La segunda equivocación sería diseñar una 0.1 tan aislada que después no pueda soportar aldeanos, trabajos, hambre, invierno o eventos.

**Tres estados del sistema:**

1. **Activado**: cambia realmente el estado del juego, con UI y pruebas.
2. **Preparado**: contrato de datos, IDs y extensión; aún no genera consecuencias jugables.
3. **Diferido**: idea fuera de alcance que no debe infiltrarse en esquemas o menús por inercia.

**Regla de evolución del guardado:** toda versión cambia `schemaVersion` cuando necesita migración de datos; cada nueva fase debe probar carga de una partida guardada en la versión precedente, salvo incompatibilidad anunciada y justificada.

---

# 0.1 — FUNDACIÓN DE LA ALDEA

**Meta:** crear una partida, conocer a sus habitantes, avanzar el tiempo exacto, cerrar y continuar sin pérdida, probar Android horizontal/offline. Ver el desarrollo completo en `02_ESPECIFICACION_EJECUTABLE_0_1.md`.

### Entra

- Repositorio y proyecto TypeScript + Vite + React sugerido.
- `game/core` puro: fechas 336 días, tick diario, RNG sembrado/versionado, estado de decisiones pendientes como contrato.
- 15–20 habitantes aleatorios, familias coherentes, 2–3 niños como preferencia, edad y cumpleaños individuales, pistas sobre talentos, atributos/skills/potenciales por profesión.
- Estado inicial de viviendas, edificios, solares y reservas ligeramente variables, con el desajuste 15 camas vs hasta 20 personas documentado y mostrado.
- Menú de habitantes y ficha navegable por familia; todos sin profesión.
- Tres ranuras, guardado automático local persistente, indicador de error, carga, versión de esquema.
- PWA horizontal usable offline una vez cacheada, pruebas unitarias e integración.

### No entra

Cosecha, tala real, consumo de alimentos, trabajo asignable funcional, progresión de XP, heridas, muertes, combate, construcción jugable, eventos mayores.

### Entrega medible

Una partida puede recorrer 336 días con cumpleaños individuales correctos, guardar, recuperar y repetir mismos resultados con misma semilla y secuencia de acciones.

### Base que entrega a 0.2

`Resident/Family`, IDs estables, `Building`, `BuildingSlot`, `housingAssignments`, `inventory`, modelo de versión de partida, validación y puertos de comandos. Evitar modelar casas como simples contadores: requieren ID y residentes que los referencien.

---

# 0.2 — EDIFICIOS, VIVIENDAS, SOLARES Y ALMACÉN

**Meta:** que el asentamiento se gestione mediante edificios materiales y espacios limitados, preparando trabajos y producción.

## 1. Entidades y estados

`Building` con tipo, condición 0–100, ocupación, capacidad, ID de solar y posibles mejoras. `BuildingSlot` con estado libre/ocupado/en obra. `ConstructionProject` con tipo de edificio, recursos comprometidos/pagados, progreso, trabajadores autorizados y pausa. `MaintenanceTask` con objetivo, materiales previstos y prioridad. `ResourceStorage` con capacidad total combinada y ocupación actual.

## 2. Funciones de producto

- Mostrar solares disponibles/ocupados y grado de aldea.
- Casas con plazas; vista de residentes por vivienda y herramienta de mover habitantes **manualmente**, respetando cupos y preservando órdenes manuales.
- Regla automática inicial de ocupación familiar; no reordenar tras movimiento manual para optimizar.
- Huertos con cupo de trabajadores visible (propuesta 2, confirmar antes del balance).
- Almacén donde **alimentos + madera** consumen la misma capacidad; mostrar saturación por separado y total.
- Construcción requiere recursos, tiempo y constructores; mientras todavía no exista profesión operativa en 0.3, mostrar trabajos y permitir dejarlos preparados/pausados, sin simular constructores inexistentes. Es válido implementar la estructura de obras en 0.2 y activar progreso de construcción en 0.3.
- Deterioro y reparación: introducir modelo, avisos y controles; activar simulación completa de mantenimiento una vez haya constructores y economía suficientemente conectada.
- Ampliación del grado por requisitos visibles (población, materiales, reservas, conservación): definir números provisionales en reglas parametrizadas, sin hacerlos canon irrevocable.
- La cantidad inicial de edificios, solares y camas es **PENDIENTE DE BALANCE**; no ocultar.

## 3. Dependencias con 0.1

- Cada casa y huerto tiene ID estable para que habitantes y trabajadores lo referencien.
- `housingAssignments` permite origen y protección de cambios manuales.
- Los recursos residen en inventario autoritativo; los textos de HUD son selectores.
- Todo comando de obra/movimiento se registra en historial y provoca guardado automático.

## 4. Pruebas obligatorias

- No se ocupa un solar dos veces.
- No se alojan más habitantes que capacidad de una casa.
- Tras mover un habitante manualmente, el asignador automático no lo mueve otra vez.
- El almacén rechaza/gestiona el excedente según política **documentada**; no aparecen recursos de la nada.
- Pausar/reanudar conserva progreso de obra.
- Una obra no progresa sin trabajadores autorizados.
- Materiales no se consumen dos veces al reanudar.
- Al degradarse una casa en el futuro, hay política explícita de moradores, no borrado silencioso.
- Se puede cargar una partida 0.1 con edificios y estructuras iniciales correctas tras migración.

## 5. Riesgo mayor

La 0.2 depende de decidir si un inicio con hasta cinco personas sin vivienda es un desafío intencional o un desequilibrio. **No afecta a los IDs ni al almacenamiento de la 0.1**, pero sí a los números de supervivencia de 0.5. Tratarlo antes de anunciar balance de vivienda definitivo.

---

# 0.3 — PROFESIONES, DESTINOS, HABILIDADES Y APRENDIZAJE

**Meta:** los habitantes dejan de ser fichas observables y pasan a producir, mejorar y asumir responsabilidades, pero el jugador les da su primer oficio.

## 1. Cuatro profesiones (NO agregar más)

- **Agricultor:** vinculado a un huerto concreto; plazas finitas. Permanece allí hasta nueva orden. Cumple edad mínima 12.
- **Leñador:** destinado al bosque. Madera natural inagotable en 1.0, pero producción requiere tiempo y esfuerzo. Edad mínima 15.
- **Constructor:** automático entre tareas **autorizadas** de obra/mantenimiento, o exclusivo manual sobre un edificio/tarea. Edad mínima 14.
- **Guerrero:** asignado a puestos de defensa como muralla, bosque o pueblo; cupos/efectos específicos. Edad mínima 16.

## 2. Primer contacto del jugador

Todos adultos comienzan desempleados. Menú general habitantes y **menús dedicados por oficio** permiten inspeccionar capacidad y escoger personas. El primer nombramiento es manual. Ninguna rutina recluta a los disponibles por su cuenta. Las alertas de cumpleaños informan oficios habilitados y no realizan asignaciones.

## 3. Progresión

- Variables separadas: atributos físicos, habilidades de oficio, salud/hambre y potencial de aprendizaje específico de cada oficio.
- Experiencia por práctica diaria. Eventos significativos dan más experiencia en versiones posteriores.
- Potencial oculto como propensión/techo, con indicios iniciales, descubrimiento posterior sin resultados gratuitos.
- Atributos mejoran más lentamente que habilidades; envejecimiento puede reducirlos gradualmente; no hay jubilación automática.
- Conservación de habilidad al cambiar oficio; desuso muy lento; recuperación más rápida de habilidad previamente dominada.
- El aprendizaje depende principalmente del potencial y moderadamente de edad, no de una regla “mayores ya no aprenden”.
- Rendimiento futura ponderación profesión + atributos, ejemplo 60/40 **no fijado**; pesos distintos por oficio para evitar homogenización.

## 4. Ordenes y automatización

La automatización tiene permisos explícitos; origen `player/system`, marca `manualLock` y estado `authorized`. El sistema puede redistribuir solo trabajadores/tareas autorizados de forma flexible, **nunca** empleados manualmente fijados. Si desaparece un puesto por derrumbe, se marca conflicto y notifica; no convierte al aldeano en otro oficio por arte de magia.

## 5. Pruebas

- Un niño de 11 no puede trabajar; con 12 puede agricultura y no combate.
- Con 14 construcción, con 15 tala, con 16 combate.
- No se asignan dos personas al mismo cupo ni se exceden cupos de huerto/muralla.
- Cambio de oficio preserva habilidades anteriores y potenciales.
- Dos personas con distinta habilidad producen distintos rendimientos bajo condiciones comparables.
- Práctica aumenta XP dentro de límites; no excede máximos propios.
- Potencial secreto no se filtra en UI ni animaciones.
- Modo automático respeta trabajos fijados manualmente.
- En una partida iniciada en 0.1, el modelo de habilidad anterior sigue utilizable tras migración.

---

# 0.4 — PRODUCCIÓN, CONSUMO Y ESTRATEGIA DE RESERVAS

**Meta:** introducir la primera economía real con escasez legible. El jugador descubre que comer y construir compiten por almacenamiento y tiempo.

## 1. Agricultura

- Producción diaria por huerto, trabajadores, habilidades, atributos, estación, condición del edificio y eventos.
- Primavera moderada y ascendente; verano alta; otoño decreciente; invierno casi nula.
- Trabajador asignado a huerto específico; la producción no ocurre si no hay quien trabaje.
- Cada cosecha respeta almacenamiento compartido y política documentada de excedentes.

## 2. Madera

- El bosque no tiene contador de árboles que se agoten en 1.0.
- Leñadores producen según trabajo, habilidades, condiciones y riesgos apropiados.
- La madera en almacén es finita y puede gastarse en construcción/reparaciones. Distinguir reserva natural infinita de inventario limitado.

## 3. Consumo individual

- Edad, actividad/profesión y salud/condición influyen en demanda diaria.
- Variaciones aleatorias pequeñas y **acotadas**; su amplitud es parámetro pendiente.
- No convertir cada día en una lotería de consumo injusta: proyección en rangos y alertas preventivas.

## 4. Política general y prioridades

- Ración elegida: abundante, normal, reducida, emergencia.
- Priorización adicional: equilibrada, menores, trabajadores o viviendas señaladas.
- Grupos menos prioritarios reciben lo disponible; no aplicar castigo absoluto por defecto.
- La elección de política permanece hasta que el jugador cambie; el sistema solo la ejecuta.
- Mostrar unidades solicitadas, servidas, consumidas y faltantes en log y UI.

## 5. Almacén y reparaciones

- Capacidad común para alimentos y madera; la saturación puede impedir cosecha o tala.
- Reserva mínima de madera configurable para impedir mantenimiento automático excesivo.
- Si producción compite con recursos, el jugador puede fijar prioridad/reserva; no imponer microgestión unidad por unidad.

## 6. Pruebas

- Inventario no negativo y no supera capacidad; todo cambio tiene causa registrada.
- Raciones y prioridad alteran distribución sin generar comida.
- Dos hogares con distinta prioridad producen efectos coherentes.
- Producción sin trabajadores es cero o justificada por evento explícito.
- Un mes de invierno casi no produce alimento.
- Consumo de iguales contextos respeta límites diarios publicados.
- Proyección de stock se presenta como rango si el futuro es variable; no prometer fecha exacta inventada.
- Migración de partidas 0.3 con políticas por defecto claramente comunicadas.

---

# 0.5 — HAMBRE, SALUD, VIVIENDA E INVIERNOS

**Meta:** las decisiones económicas tienen consecuencias físicas, pero el juego sigue siendo justo y advertible.

## 1. Salud y hambre

- Estados acumulativos, recuperación, reducción de rendimiento por malnutrición.
- Raciones de emergencia son peligrosas a largo plazo; abundantes consumen más, ayudan a recuperación.
- Edad y condición individual pueden modificar riesgo sin castigos arbitrarios.
- Historial de heridas/incapacidades de duración variable; secuelas persistentes dentro del alcance acordado, sin medicina sofisticada.

## 2. Frío y alojamiento

- Invierno peligroso, sobre todo para quien duerme fuera o en edificio deteriorado.
- Casas degradadas reducen protección; edificio inutilizable no protege como si estuviera sano.
- Avisos previos cuando existe peligro gradual y oportunidad razonable de intervenir.

## 3. Inviernos variables

- Suave, normal, duro, con semillas reproducibles y señales imperfectas en otoño.
- Variación que produce tensión sin decidir la muerte del jugador mediante tirada opaca sin margen.
- No ajustar el resultado después de conocerlo solo para dramatizar.

## 4. Muerte y final

- Muerte permanente y explicada en la crónica. Un personaje muerto ya no trabaja, come ni ocupa cama de modo activo.
- Partida sigue si queda un niño o anciano: no hay derrota automática por falta de trabajadores.
- Fin únicamente si **todos** los habitantes fallecen, con resumen/crónica final.
- Algunos rescates de crisis graves excepcionalmente posibles, con pérdidas o secuelas duraderas.

## 5. Pruebas y balance

- Hambre prolongada daña gradualmente; alimentación suficiente puede recuperar si el estado lo permite.
- No todos sobreviven siempre ni todos mueren siempre; análisis de 100/1000 semillas bajo distintas decisiones.
- Sin techo tiene impacto invernal superior a vivienda adecuada; se respetan camas reales.
- Inviernos duros se anticipan de forma imperfecta antes de llegar.
- Pérdida del último habitante activa fin; pérdida de economía o edificios no.
- Muertes se guardan y no resucitan por reabrir ranura; RNG y evento son estables.

---

# 0.6 — GUERREROS, PUESTOS DEFENSIVOS Y ASALTOS

**Meta:** la seguridad de la comunidad produce decisiones de alto riesgo sin convertir el juego en un combate táctico por turnos.

## 1. Puestos

- Guerreros destinados a muralla, bosque o aldea (dependiendo de edificios disponibles), con capacidad por destino.
- Eficacia derivada de combate + atributos generales pertinentes + salud + puesto + defensas.
- Puestos asignados manualmente se respetan; alertar si se vuelven imposibles.

## 2. Amenazas

- Bandoleros ocasionales; aviso de huellas/exploradores/sospechosos en algunos casos, sorpresa en otros.
- Consecuencias de recursos robados, edificios dañados, lesiones, muerte y aprendizaje.
- Frecuencia y agresividad equilibradas según progreso sin prometer ausencia total de peligros.

## 3. Tácticas de alto nivel

- Defender muralla; proteger almacén; negociar; salida ofensiva; otras opciones solo si se justifican por contexto.
- Cada decisión ofrece información de riesgos y estimaciones calculadas; incluso porcentajes altos pueden fallar.
- Eventos de defensa pausan el avance de días en el momento correcto y se reanudan después de resolver.

## 4. No entrar

- Control individual golpe por golpe, inventarios complejos de armamento, profesiones militares adicionales, formación detallada tipo wargame.

## 5. Pruebas

- Dado el mismo estado/semilla/elección, resultado idéntico.
- Orden táctico cambia distribución de riesgos y puede proteger recursos a costa de personas.
- Un avance 28 días interrumpido por ataque día 9 nunca llega a día 10 sin resolver.
- Asaltos que dañan edificio actualizan estado de edificio, aviso y crónica coherentemente.
- Frecuencias y porcentajes calibrados por simulación de muchas semillas, sin “80%” ficticio.

---

# 0.7 — EVENTOS SIGNIFICATIVOS, DESCUBRIMIENTOS Y CRÓNICA

**Meta:** hacer explícitas las historias que emergen del sistema, no inventar historias sin relación con el estado de la aldea.

## 1. Motor de eventos

- Contexto: disponibilidad por estación, oficios, estado de reserva, familia, salud, edificio, amenazas y acciones anteriores.
- Condiciones de elegibilidad y probabilidades reales, usando RNG versionado.
- Tipos de decisión: aceptar/rechazar, ajustar riesgo, opciones obligadas, resolución automática.
- Ritmo orientativo **1–3 decisiones relevantes por mes**, sin cuotas fijas ni bloquear juego con banalidades.
- Eventos menores al registro sin pausa.

## 2. Aprendizaje extraordinario

- Eventos de gran riesgo dan oportunidades de XP mayores que tareas cotidianas.
- Posibilidad de fracaso, heridas, muertes o pérdidas valiosas. Aprendizaje no equivale automáticamente a recompensa.
- Descubrimientos de talento consistentes con potencial oculto y trayectoria laboral.
- Animaciones/eventos visuales especiales solo para momentos significativos; mostrar probabilidades honestas.

## 3. Visitantes y población

- Llegadas muy raras de individuos o familias, aceptadas/rechazadas por jugador.
- Nuevas necesidades de cama/comida, talentos y relaciones.
- Sin nacimientos; no hay reemplazo automático cuando alguien muere.

## 4. Crónica útil

- Narrativa derivada del resultado de simulación; registrar fecha, participantes, causa, opciones y efecto.
- Consultar por persona, familia, estación y año; conservar muertes y hazañas incluso tras fallecimientos.
- En final de partida resumir duración, hitos y destino de los personajes sin inventar sucesos.

## 5. Pruebas

- No se ofrece una opción que contradiga el estado (p. ej. negociar con un enemigo inexistente).
- Eventos tienen resultados reproducibles, log no duplicado, decisiones no se resuelven dos veces.
- Opciones muestran riesgos basados en motor; datos ocultos no se filtran sin autorización.
- Evento raro de visitantes no se convierte en reclutamiento regular por accidente.
- La crónica puede crecer durante años sin bloquear Android.

---

# 1.0 — EQUILIBRIO, ESTABILIDAD Y LANZAMIENTO

**Meta:** un juego pequeño pero coherente, durable, divertido y honesto, no una acumulación de mecánicas a medio terminar.

## 1. Integración

- Todas las versiones operan sobre el mismo calendario, los mismos IDs, RNG y guardado.
- La interfaz enseña decisiones y causas, no solo números aislados.
- El jugador puede gestionar varias aldeas, iniciar de cero y mantener historias extensas.

## 2. Balance longitudinal

- Simular partidas de muchos años en varias semillas y políticas: equilibrio de alimento, desgaste, envejecimiento, capacidad de casas, acceso a materiales, crecimiento de aldea, dificultad de invierno, mortalidad y defensa.
- Probar distintas estrategias viables; evitar que una sola fórmula maximice siempre resultados.
- Verificar que 15–20 personas iniciales con edificios/reservas configurados no empiezan condenadas por diseño y que la escasez genera decisiones, no imposibilidad absurda.
- Ajustar distribución de potenciales y XP para que casos extraordinarios sean raros pero posibles; edades medias aún capaces de aprender.
- Tratar el valor 60/40 de ejemplo como punto de partida, no verdad confirmada.

## 3. Robustez y plataforma

- Migraciones versionadas de todas las fases; cargar partidas antiguas que deban seguir compatibles.
- Guardado/recuperación, errores de almacenamiento y exportación/importación si se aprobó; reducir riesgo de perder partidas largas.
- Android horizontal, rendimiento y legibilidad con crónicas largas, operación offline tras instalación, actualización de PWA sin borrar estados.
- APK posterior si se decide, con pruebas de WebView/origen/archivos de guardado. No afirmar que PWA y APK comparten almacenamiento automáticamente.

## 4. Accesibilidad y pulido

- Feedback de riesgos y consecuencias, controles grandes, claridad en alertas, prioridades automáticas y bloqueo manual.
- Efectos de revelación dramática para sucesos importantes, no en acciones cotidianas.
- Tutorial breve y opcional, instrucciones de partida y changelog.
- Consistencia en lenguaje, nombres, temporadas y valores.

## 5. Qué no meter para llegar a la meta

Nacimientos, personalidades complejas, medicina profunda, mercado general, bosque finito, mapa masivo, combate por turnos, monetización y cualquier otra idea diferida sin nueva decisión expresa.

## 6. Criterios de publicación

- Motor y guardado estables en partidas largas; no hay corrupción al cerrar o actualizar en escenarios probados.
- Disponibilidad y accesibilidad de todos los menús realmente implementados.
- Tasas de eventos/riesgos no distorsionadas por presentación.
- Muerte definitiva y fin de partida funcionan; partida sigue con menores/ancianos supervivientes.
- Ninguna característica de 0.1 a 0.7 queda disfrazada como “completa” si sigue simulada con datos falsos.
- Conjunto de pruebas regresivas y un historial de cambios entendible.
- Aprobación final del usuario en Android, no solo en vista previa de escritorio.

---

# MATRIZ GLOBAL DE DEPENDENCIAS

| Sistema | Nace en | Se activa | Consume |
|---|---|---|---|
| Semilla/RNG | 0.1 | 0.1 | generación, producción, eventos, defensa, clima |
| Calendario | 0.1 | 0.1 | cumpleaños, estaciones, XP, consumo, ataques |
| Familia/ID | 0.1 | 0.1 | vivienda, visitantes, crónica, mortalidad |
| Potencial por oficio | 0.1 | 0.3 | entrenamiento y descubrimientos |
| Vivienda/ocupación | 0.1 mínima | 0.2 | frío, familias, ampliaciones |
| Edificios/solares | 0.1 mínima | 0.2 | obras, oficios, producción, defensa |
| Almacén compartido | 0.1 inventario | 0.2 | economía y reparaciones |
| Oficios y puestos | 0.1 modelo | 0.3 | producción, mantenimiento, defensa |
| Producción y consumo | 0.1 interfaz de datos | 0.4 | hambre, invierno y economía |
| Salud/mortalidad | 0.1 valores iniciales | 0.5 | eventos, defensa, game over |
| Ataques y tácticas | 0.1 contrato de evento | 0.6 | pérdida de personas, recursos, edificios |
| Eventos y crónica | 0.1 registro mínimo | 0.7 | narrativa y visitas |
| Guardado versionado | 0.1 | 0.1 | TODOS |
| Presentación Android | 0.1 | 0.1 | TODOS |

# REGLA FINAL

**No optimizar para implementar rápido la próxima función a costa de destruir una decisión anterior.** Lo que hace especial a Aldea Viva es que los sistemas se conectan: familia → vivienda → invierno → supervivencia → experiencia → oficio → decisiones → crónica. La arquitectura debe conservar esas relaciones, pero solo activar la complejidad cuando corresponda.
