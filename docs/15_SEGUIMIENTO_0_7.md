# Aldea Viva 0.7 — Sucesos, visitantes y crónica

Estado: candidata local `0.7.0-dev`, comprobada en PC. Android físico y equilibrio de partidas largas pendientes. Sin commits, push, etiquetas ni publicaciones nuevas.

## Implementado

- Nueva sección **Sucesos**. Oportunidades elegibles por oficio activo, aptitud física, estación, reservas y destino. No recluta ni modifica puestos por su cuenta; los bandoleros tienen prioridad y no se generan decisiones superpuestas durante una amenaza.
- Ensayo agrícola fuera del invierno y ruta difícil del bosque: dejar pasar, intento prudente o mayor riesgo. Se muestran inversión, recompensa, XP y probabilidades calculadas por el mismo selector que resuelve el motor. Fracaso consume inversión, puede causar heridas o muerte; éxito puede rechazar excedentes por falta de almacén.
- Reparación urgente: un constructor flexible o autorizado para ese edificio elige entre apuntalar y reforzar. Consume únicamente madera libre y conserva su destino. No aparece para un constructor exclusivo dedicado a otra tarea.
- Pequeños aprendizajes automáticos durante jornadas con práctica real. Quedan en la crónica y no generan una decisión. Los sucesos importantes detienen los lotes exactamente en el día de su oferta; resolverlos no avanza otro día ni repite producción/raciones.
- Talentos por profesión y trayectoria: primera señal prometedora, después confirmación. La cifra de potencial solo se muestra tras confirmar; no se revela por abrir una ficha ni por un sorteo sin práctica. Fichas e historial conservan los descubrimientos y Sucesos los destaca visualmente, sin animaciones repetitivas.
- Visitantes muy raros: individuos o familias con parentescos, edades y habilidades persistentes antes de decidir. Aceptar/rechazar el grupo completo; vista previa de necesidades y camas insuficientes. Solo se asignan camas libres utilizables a los nuevos; todas las asignaciones anteriores permanecen. Llegan desempleados, comen desde el próximo día y no sustituyen automáticamente a fallecidos. Sin nacimientos.
- Edades de visitantes referidas a su fecha de llegada; se mantienen cumpleaños y edad real aunque la aldea lleve décadas fundada. El calendario histórico no inventa cumpleaños anteriores a su incorporación.
- Crónica por persona, familia, año, estación y tipo; 25 entradas por página. Balance diario disponible con «Todo» o «Balances económicos». Los combatientes ilesos nuevos también pueden figurar en la historia de su asalto; en registros antiguos no se inventan participantes ausentes.
- Fichas con últimas 40 entradas y acceso a toda la trayectoria filtrada. Fallecidos continúan consultables; final con duración, obras, asaltos, llegadas, descubrimientos y nombres, derivados de sucesos registrados. Filtros disponibles incluso al finalizar la aldea.

## Parámetros provisionales

Centralizados en `rules/story.ts` y selectores; ajustes sencillos autorizados por el usuario:

- Primera comprobación: 14 días después del primer día nuevo con la versión. Después, cada 7–14 días. 75 % de considerar una oportunidad si existe contexto; orientación de unas dos decisiones mensuales, sin cuota ni garantía.
- Visitantes: 1 % por comprobación, nunca por día, y al menos 336 días entre ofertas. No depende de las muertes. Si no hay contexto útil, no se inventa una decisión para llenar el calendario.
- Prudente: 3 alimentos, recompensa 8 unidades, 120/60 XP por éxito/fracaso. Arriesgado: 6 alimentos, recompensa 20, 300/160 XP. Éxito según habilidad y destreza: base 60/35 + habilidad ×0,25 + destreza ×0,1, limitado a 10–95 %.
- Lesión o muerte condicionada al fracaso: 5/25 %. Entre afectados, muerte 0/2 %. El porcentaje visible combina estas ramas con la probabilidad de fracaso. Heridas: hasta 10–35 de salud perdida, conservando al menos la salud actual si ya estaba bajo 1; reposo mínimo 7–28 días, recuperado con las reglas médicas existentes.
- Apuntalar: 2 maderas, +4 conservación y 60 XP. Reforzar: 5 maderas, +12 conservación y 120 XP. Aprendizaje menor automático: 20 XP. Todas las mejoras de habilidad respetan el techo individual y la maestría histórica.
- Talento prometedor: potencial ≥70, al menos 400 XP y habilidad efectiva ≥30. Confirmado: señal previa, al menos 1500 XP y habilidad ≥50. Solo se descubre en una jornada/decisión que aumentó la experiencia del oficio.

Orden diario conservado: calendario → supervivencia inicial → trabajo → economía → salud → defensa → sucesos y descubrimientos. Los sorteos y candidaturas se guardan; consultar no consume RNG. La gestión queda fijada mientras haya una decisión, con navegación y crónica disponibles.

## Guardado y comprobaciones

- Lector v1–v9, escritor v9. Los esquemas v1–v8 siguen estrictos. Nuevos campos opcionales: fecha de llegada, descubrimientos y estado de sucesos; historial de accidentes y participantes de asaltos nuevos. IndexedDB física sin cambios. Cargar no escribe ni regenera, y el reintento guarda exactamente el mismo resultado y UUID.
- **278 pruebas aprobadas en 21 archivos**, compilación TypeScript/Vite correcta. Diez pruebas nuevas agrupadas en `tests/core/story.test.ts`: elegibilidad/pausa, determinismo, riesgos/costes/XP, reparación/almacén, aprendizaje automático, descubrimiento gradual, incorporación tardía, rareza, crónica extensa y compatibilidad/reintento.
- 400 resoluciones para contrastar la probabilidad mostrada; 1000 comprobaciones para limitar la frecuencia de visitas y verificar la espera anual. Prueba de llegada en año 41, parentescos/edades/camas y vuelta de guardado. Crónica sintética de diez mil entradas, mostrando 25 en el HTML, sin efectos sobre RNG. No se atribuye a esto un balance longitudinal ni rendimiento de Android real.
- Pruebas anteriores de obra/aprendizaje/economía aíslan su contexto aplazando la siguiente comprobación de sucesos cuando necesitan avanzar sin decisiones. Los riesgos siguen activos en el motor normal.
- Brave aislado: actualización desde 0.6 conservó formato v8 sin escribir al consultar, semilla, día 9, 17 vivos y dos heridos de la prueba anterior.
- Oportunidad sintética: tres respuestas, tiempo bloqueado, escritorio 1440×900 y móvil 844×390 sin desbordamiento. Botones de al menos 46 px y navegación móvil de 61 px. Sin conexión, recarga conservó la decisión; intento arriesgado al 44 % tuvo éxito, consumió 6 alimentos, almacenó 20 y concedió 300 XP. Se guardó una única resolución v9 sin avanzar el día; otra recarga y el filtro por persona funcionaron.
- Familia visitante sintética de cinco miembros: vista previa avisó de dos camas libres y tres personas sin vivienda. Aceptar pasó de 18 a 23 habitantes, todos los nuevos sin oficio, hogares previos intactos; ficha visitante y parentescos disponibles. Solo datos sintéticos del perfil aislado, sin sesiones personales.
- Cero errores/advertencias de consola en los flujos comprobados. Inspección visual de `07-sucesos-desktop.png`, `07-sucesos-mobile.png` y `07-cronica-mobile.png` en la carpeta de trabajo. Android físico y Opera pendientes.

## Archivos y ejecución

- Nuevos: `src/game/{models/story,rules/story,selectors/story,selectors/chronicle,core/storyDay,commands/story,validation/story,generation/visitors}.ts`, `src/ui/events.ts`, `tests/core/story.test.ts` y este seguimiento.
- Modificados: calendario y selector mensual, generador RNG, modelos y esquema, motor diario, validación, selección de fichas, registro de combate, sesión/persistencia/montaje, vistas/formatos/estilos, fixture y pruebas afectadas, package/lock, README y AGENTS. Sin dependencias nuevas ni cambios a los documentos maestros.
- `npm run build -- --outDir dist-0-7.local` y `npm run preview -- --outDir dist-0-7.local --port 4176`. Se conserva el origen y las compilaciones anteriores, incluida la del enlace antiguo de Android. «Actualizar aplicación» recibe la nueva candidata sin trasladar partidas entre orígenes.
- Siguiente tramo: integración, equilibrio y pulido hacia 1.0. No se ha iniciado en esta entrega.
