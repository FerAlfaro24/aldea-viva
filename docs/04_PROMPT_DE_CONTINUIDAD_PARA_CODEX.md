# INSTRUCCIONES DE CONTINUIDAD PARA LA NUEVA CONVERSACIÓN / CODEX

> **COPIAR EL TEXTO DE ESTE DOCUMENTO** en la nueva conversación o compartirlo junto con los documentos adjuntos. No basta con decir «haz la 0.1»: la nueva sesión debe leer el material y reconocer las decisiones previas.

---

## Mensaje inicial recomendado

Estoy desarrollando **Aldea Viva**, un juego original de gestión y supervivencia de aldea medieval, Android-first y horizontal. Ya terminamos una fase extensa de diseño y cerramos **29 decisiones principales**. Migré de una conversación anterior y **no quiero perder ninguna de esas decisiones** ni reinventar reglas que ya discutimos.

He adjuntado un paquete con:

1. `01_BIBLIA_DE_DISENO_0_1_A_1_0.md`: memoria detallada del proyecto hasta la 1.0, 29 decisiones y dependencias.
2. `02_ESPECIFICACION_EJECUTABLE_0_1.md`: instrucciones exhaustivas para implementar **0.1**; contiene arquitectura sugerida, modelos, algoritmos, calendario, almacenamiento, interfaz, pruebas y aceptación.
3. `03_REFERENCIAS_Y_AUDITORIA_FMS_CEO.md`: análisis verificable del código FMS CEO y los prototipos antiguos; sirven de referencia técnica, **no** de base de código.
4. `05_DECISIONES_Y_PENDIENTES_RAPIDOS.md`: reglas inmutables, riesgos y pendientes.
5. `LEEME_PRIMERO.md`: guía de lectura.

### Lo que quiero que hagas al comenzar

**Primero revisa el repositorio real** de GitHub/VS Code, si ya existe. No lo borres, no lo reinicialices y no sobreescribas trabajo que se haya hecho en otras sesiones. Identifica estado del código, rama, dependencias, pruebas, guardado y documentación; dime qué hay, qué falta y qué implementarías a continuación.

Después desarrolla la **versión 0.1**, no la 1.0 de golpe. El primer hito es M1: **calendario 12 meses × 28 días, RNG sembrado persistible y motor de avance diario**, con pruebas; posteriormente M2 familias/habitantes, M3 interfaz, M4 guardados/PWA y M5 revisión/release. Prefiero commits y entregas pequeñas verificables a un megaproyecto que aparente funcionar.

### Reglas de diseño que NO puedes cambiar sin consultar

- Años de 336 días; primavera 1–84, verano 85–168, otoño 169–252, invierno 253–336.
- Avanzar 1, 7 o 28 días, procesando cada día; eventos significativos futuros detienen la simulación en el día preciso.
- 15–20 habitantes iniciales aleatorios con familias, preferentemente 2–3 niños; personas suficientemente distintas en edad/atributos/potenciales.
- Todos los adultos empiezan **sin profesión** para que yo les asigne su primer oficio cuando estén implementados los trabajos.
- Cuatro oficios: agricultura vinculada a huerto, tala de bosque, construcción, guerra/defensa. Edades mínimas 12/15/14/16 respectivamente.
- Potenciales de aprendizaje **ocultos e independientes por profesión**, con pistas narrativas; no “potencial global”. Aprendizaje por práctica y eventos decisivos en versiones futuras.
- Automatización para rutinas **sin pisar órdenes manuales**; no construye ni contrata nuevos trabajadores por su cuenta.
- Edificios con espacios y capacidades limitadas; almacén futuro compartido por comida y madera; bosque sin agotamiento de madera en 1.0.
- Alimentación con ración general y prioridades sencillas por niños, trabajadores o casas; escasez con efectos reales en versiones futuras.
- Inviernos variables; muerte permanente; final de partida únicamente si mueren todos; guerreros con decisiones tácticas de alto nivel.
- Sin nacimientos, sistema complejo de personalidad ni agotamiento forestal en 1.0.
- Guardado automático, tres ranuras, offline, sin historial para revertir decisiones; persistencia robusta y con versión.
- La propuesta antigua de **3 casas de 5 camas** enfrenta **15–20 habitantes**; es un pendiente de balance, no la arregles silenciosamente.
- **FMS CEO y viejos HTML de Aldea Viva no son el nuevo juego**: contienen calendarios de 120 días, oficios autoasignados u otros supuestos incompatibles. No los copies.

### Forma de trabajo y comunicación

- Háblame en **español**, de forma clara; evita jerga innecesaria sin explicación.
- Mantenme informado de avances reales, errores y pruebas realizadas; no inventes resultados ni fechas de entrega.
- Si falta un dato de equilibrio, usa una **constante provisional claramente documentada** si no contradice lo confirmado. Pregunta **una sola cosa a la vez** únicamente cuando sea esencial para continuar.
- Separa lógica de juego, UI, persistencia y pruebas. Recomendación: TypeScript + React + Vite + Vitest + IndexedDB, salvo que revisar el repositorio existente sugiera una opción comparable con razones.
- No te limites a propuestas: cuando tengas acceso al repo, realiza cambios concretos pequeños, comprueba que compila y ejecuta pruebas. Antes de acciones destructivas, solicita confirmación.
- No introduzcas sistemas de 0.2–1.0 antes de terminar 0.1, salvo contratos mínimos que eviten rehacer.

### Primera respuesta que espero

1. Confirmar qué documentos pudiste leer y qué repo inspeccionaste.
2. Resumen breve de invariantes y conflictos abiertos.
3. Plan de M0→M1 adaptado al estado real.
4. Si puedes trabajar sobre el repo: iniciar M1 con pruebas verificables. Si no, indícame el paso único para conectarlo o compartirlo.

---

## Lista de solicitudes de Codex, una por hito

### Prompt M0 — Auditoría y preparación

«Inspecciona el repositorio sin sobrescribir archivos. Resume árbol del proyecto, scripts, commits pendientes, dependencias y riesgos. Compara su estado con `02_ESPECIFICACION_EJECUTABLE_0_1.md`. Propón lista de cambios para M1 y confirma que respetarás el año de 336 días y RNG persistente. Añade la documentación al repo si hay permiso. No programes M2 todavía.»

### Prompt M1 — Calendario y simulación

«Implementa M1: modelos base, fechas 12×28, RNG sembrado/versionado/serializable, tick diario y avances 1/7/28, cumpleaños y crónica de calendario, contrato de interrupciones. Escribe y ejecuta CAL-01..16 y tests de replay. La lógica debe ser pura y no depender de React. Reporta archivos, comandos y pruebas reales.»

### Prompt M2 — Habitantes y familias

«Implementa M2 conforme a la Biblia y la especificación: 15–20 vecinos, preferencia 2–3 niños, familias coherentes, fechas de cumpleaños, 5 atributos, 4 habilidades, potencial oculto por oficio, pistas honestas, ID estable, todos desempleados, vivienda inicial con capacidad y conflictos visibles, recursos variables equilibrados. Agrega pruebas generativas 1000 semillas y documenta constantes provisionales.»

### Prompt M3 — UI Android horizontal

«Implementa M3: inicio, tres ranuras, aldea, lista/filtros de habitantes, ficha completa, relaciones familiares navegables, HUD fecha/recursos/vivienda, crónica de calendario, botones +1/+7/+28, diseño táctil horizontal. No reveles potencial oculto, no inventes menús de oficios funcionales ni economía. Prueba tamaños de pantalla y reporta limitaciones.»

### Prompt M4 — Guardado y offline

«Implementa M4: IndexedDB transaccional en tres ranuras, validación/schemaVersion, autoguardado tras acciones, carga segura, sobrescritura confirmada, indicador de guardado real, RNG persistente; PWA offline con caché versionada. Añade pruebas SAVE/E2E y guías para verificar Android real. No declares probado algo que no ejecutaste.»

### Prompt M5 — Release candidata

«Revisa todas las filas P0/P1 de la matriz AV01, tests CAL/GEN/SAVE/UI/E2E, navegación Android horizontal, carga offline y conflictos de camas. Corrige bugs, documenta problemas conocidos, prepara changelog y etiqueta `v0.1.0` solo tras aprobación real de los criterios. No empieces 0.2 mientras haya bloqueos críticos.»

---

## Conducta ante cambios de alcance

**Ejemplo correcto:** «La 0.1 debe mostrar 15–20 habitantes en 15 camas potenciales; cinco pueden quedar sin techo, sin penalización todavía. Lo dejo registrado y no modifico las cifras».

**Ejemplo incorrecto:** «Lo arreglé generando siempre 15 vecinos porque es más cómodo».

**Ejemplo correcto:** «La tasa de generación inicial de atributos no está confirmada; he creado `INITIAL_SKILL_RANGE` provisional con pruebas y se podrá balancear».

**Ejemplo incorrecto:** «El usuario decidió que todos empiezan con 45 puntos de fuerza», si nunca se acordó.

**Ejemplo correcto:** «Las habilidades iniciales y el potencial secreto se generan de manera reproducible, pero los aumentos de XP no se activan hasta 0.3».

**Ejemplo incorrecto:** «He añadido combate, hambre y muerte a la 0.1 para hacerla más divertida».

**Este archivo es un mecanismo de continuidad, no un permiso para reinventar el diseño.**
