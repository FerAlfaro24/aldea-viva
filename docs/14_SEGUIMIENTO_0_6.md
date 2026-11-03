# Aldea Viva 0.6 — Defensa y asaltos

Estado: candidata local `0.6.0-dev`, comprobada en PC. Pendientes: Android físico y balance jugando partidas largas. Sin commits, push, etiquetas ni publicaciones nuevas.

## Qué incluye

- Bandoleros ocasionales, con indicios anticipados o por sorpresa. Los indicios interrumpen lotes de días para preparar puestos; al llegar el asalto se guarda una decisión pendiente y el tiempo queda detenido hasta resolverla.
- Cuatro respuestas: defender la aldea, proteger el almacén, negociar y salida ofensiva. Solo se habilitan opciones posibles: salida con guerreros aptos, protección con almacén utilizable, negociación con alimentos y madera libre suficientes.
- Se conservan los cupos aprobados: dos guardias en la aldea y dos en el bosque. Los guardias de bosque mejoran detección y salidas; los de aldea protegen mejor el almacén. La muralla sigue pendiente porque no existe ese edificio. No se añaden armas, profesiones militares ni combate individual.
- Eficacia según combate efectivo, fuerza/agilidad/resistencia, condición física y destino. Incapacitados no participan ni pierden su orden. Nunca se recluta o traslada automáticamente a nadie.
- Porcentajes de éxito y riesgos calculados por un selector puro compartido con el motor. Consultar no sortea nada ni revela potenciales. Riesgo personal mostrado como probabilidad de lesión o muerte, con muerte indicada como subconjunto. La exposición civil adicional se explica por separado.
- Negociar paga el tributo al intentarlo, incluso si falla. Una negociación aceptada evita robo adicional, heridas y daños. Las demás victorias aún pueden tener pequeñas pérdidas. Robos y tributo se registran separados del balance diario anterior; resolver no produce, consume raciones ni avanza otro día.
- Daños reducen conservación real, generan avisos y vuelven inutilizables los destinos afectados. Se conservan órdenes manuales en conflicto para reparar/restaurar. Los derrumbes continúan por las reglas de 0.5. Si un robo deja madera insuficiente para reservas, se cancelan obras sin iniciar desde la más reciente, sin devolver materiales inexistentes.
- Heridas con pérdida de salud y reposo de 7–42 días como mínimo; recuperación con plazo, salud y alimentación, utilizando la lógica médica existente. Muertes permanentes liberan puesto y cama y conservan identidad, familia e historial. Combate aporta XP adicional limitada por el techo propio del oficio. Sin supervivientes se activa el mismo final de 0.5.
- Al estar el asalto en curso, la gestión queda fijada; se puede consultar cualquier sección y volver a Defensa. Al resolver se guarda antes de aplicar el resultado visible; doble resolución rechazada, fallo/reintento sin repetir RNG ni consecuencias.

## Balance provisional

Cifras decididas bajo la autorización del usuario para ajustes sencillos; centralizadas en `rules/defense.ts` y selectores/comando de defensa.

- El primer día nuevo de una partida sin estado defensivo activa un margen de 28 días hasta la primera comprobación. Cargar o consultar no activa sorteos ni inventa ataques pasados.
- Comprobaciones cada 28–56 días, con 45 % de generar una amenaza en cada comprobación. No equivale a 45 % por día. En grado 1 aparecen 3–6 atacantes, en grado 2, 4–8; fuerza individual 16–24.
- Detección base 40 %, +20 puntos por guardia apto del bosque, máximo 90 %. Aviso de llegada con 2–4 días de antelación. No se revela la próxima comprobación ni una garantía de seguridad.
- Combate: fuerza = equipo básico 10 + habilidad × 0,6 + media de atributos × 0,4, modificada por capacidad física y puesto. Defensa civil básica 10 + vivos × 0,7. Éxito = fuerza propia / fuerza total, redondeado y limitado a 5–95 %. Salida ×1,2; proteger almacén ×0,9 antes del bono del puesto. Negociación: 65–85 % según la relación de fuerzas.
- Tributo: cuatro alimentos y dos maderas por atacante. La madera reservada para obras no se ofrece voluntariamente.
- Derrota: robo del 15–40 % de existencias restantes, multiplicado por táctica: defensa ×1, almacén ×0,45, negociación ×0,8, salida ×1,3. Victoria no negociada: 0–5 %. Redondeo en centésimas.
- Por guerrero, probabilidad de lesión o muerte según victoria/derrota: defensa 12/35 %, almacén 15/45 %, negociación 0/25 %, salida 25/60 %. Entre afectados, muerte: defensa 2/8 %, almacén 3/10 %, negociación 0/5 %, salida 5/18 %. El porcentaje presentado combina las dos ramas con la probabilidad real de éxito.
- Si falla una táctica distinta de salida, un civil al azar queda expuesto: 60 % de lesión o muerte y 6 % de morir. Una salida no sortea esa víctima civil adicional.
- Daños: 20 % tras victoria no negociada, 75 % tras derrota, en un edificio en pie al azar; pérdida de conservación 3–10 o 12–32. Herida superviviente: 10–35 o 25–65 de salud, mínimo 1. XP adicional por participante: 80/40 según victoria/derrota, sin sustituir la práctica diaria.

Orden diario: calendario → clima/desgaste → trabajo → producción y raciones → supervivencia → amenaza/decisión. Validación de decisión completa al cerrar el día y al leer/escribir guardados; las entregas intermedias admiten que el asalto se presente al terminar ese mismo día.

## Guardado y comprobaciones realizadas

- Lector v1–v8, escritor v8. Esquemas históricos v1–v7 conservados estrictos; v8 añade amenaza, calendario defensivo, decisiones, lesiones y causas de combate. IndexedDB física sin cambio. La partida no se regenera al abrir.
- **268 pruebas aprobadas en 20 archivos** y compilación TypeScript/Vite correcta. Diez casos nuevos agrupados en `tests/core/defense.test.ts`: interrupción exacta, indicios/sorpresas, determinismo, cupos/órdenes/incapacidad, tácticas disponibles/tributo, robos/daños/reservas, porcentajes/frecuencia, bloqueo de gestión, compatibilidad/reintento, recuperación y final por última baja.
- Calibración acotada: 600 estados RNG para comparar éxito observado con el porcentaje mostrado y frecuencia con el 45 % por comprobación; 100 resoluciones adicionales comprueban heridas, muertes, daños y cancelación de reservas. No sustituye el equilibrio longitudinal de 1.0.
- Pruebas históricas actualizadas al nuevo escritor. La fixture de calendario/persistencia aplaza la siguiente comprobación defensiva para aislar esos sistemas; un caso de recuperación de hambre también aísla amenazas posteriores. El motor de producción mantiene todos los riesgos activos.
- Brave, perfil aislado `aldea-06-defensa`: aldea sintética de 18 personas, apertura de formato v7 sin escribir ni alterar semilla/fecha/población. Otro espacio sintético con cuatro guardias e indicio: dos avances de siete días se detuvieron en el día transcurrido 9, con cuatro tácticas y botones de tiempo deshabilitados.
- Sin conexión: recarga conservó la decisión; proteger almacén falló con estimación del 68 %, produjo dos heridos, un fallecido, robo de 9,67 alimentos y 15,15 maderas, y daño 15 en un huerto. Resultado guardado en v8 sin avanzar otro día; otra recarga mantuvo 17 vivos y una única resolución, sin ofrecer resolver de nuevo. Solo se usaron datos sintéticos del perfil aislado.
- Escritorio 1440×900 y tamaño móvil 844×390, inspección visual y medición sin desbordamiento de página; botones tácticos de 46 px, navegación horizontal de 61 px de alto. Cero errores/advertencias de consola en lo comprobado. Capturas en la carpeta de trabajo, `06-defensa-desktop.png` y `06-defensa-mobile.png`.
- Android físico y Opera no ejecutados. No se actualizaron la compilación ni el enlace anterior del teléfono.

## Archivos y ejecución

- Nuevos: `src/game/{models/defense,rules/defense,selectors/defense,validation/defense,core/defenseDay,commands/defense}.ts`, `src/ui/defense.ts`, `tests/core/defense.test.ts` y este seguimiento.
- Modificados: modelos de aldea/simulación/supervivencia/guardado, motor diario y limpieza de bajas, validación, esquema, sesión/persistencia/montaje, etiquetas y vistas afectadas, estilos, fixture y pruebas de versiones, package/lock, README y AGENTS. Sin dependencias nuevas ni modificaciones a los documentos maestros.
- Compilar `npm run build -- --outDir dist-0-6.local`; servir `npm run preview -- --outDir dist-0-6.local --port 4176`. Se conserva el origen de 0.3–0.5 y las compilaciones anteriores. Si aparece «Actualizar aplicación», activarlo para recibir la nueva versión.
- Próximo hito: 0.7, eventos contextuales, visitantes y crónica; no implementados en esta entrega.
