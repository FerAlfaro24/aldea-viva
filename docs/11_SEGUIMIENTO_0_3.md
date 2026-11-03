# Aldea Viva 0.3 — Oficios, obras y aprendizaje

Estado: candidata local `0.3.0-dev`, implementada y comprobada en PC. Pendientes: prueba del usuario en Android real y ajustes de equilibrio jugando. No publicada ni subida a GitHub.

## Alcance implementado

- Cuatro menús específicos. Primer nombramiento, cambio y retirada de oficio siempre manuales. Edades: agricultura 12, construcción 14, tala 15, guardia 16. Los cumpleaños nunca contratan.
- Agricultores fijados a un huerto y sus plazas reales; leñadores al bosque; guerreros a dos plazas en la aldea y dos en el bosque, cupos provisionales aprobados por el usuario. Sin muralla inexistente.
- Constructores flexibles únicamente entre tareas autorizadas o exclusivos sobre una obra/reparación. Una tarea exclusiva terminada, cancelada o revocada queda pendiente de una nueva decisión; no cambia de oficio ni se redestina automáticamente. Reautorizar el mismo mantenimiento recupera su orden anterior.
- Las obras avanzan por días de trabajo real, pagan la reserva una sola vez al empezar y crean edificios utilizables con IDs estables al finalizar. Pausar conserva progreso y detiene trabajo. Las casas nuevas quedan vacías; las viviendas manuales se conservan.
- Cancelación antes del inicio libera toda la reserva. Después del inicio libera el solar y pierde el progreso, sin devolver madera consumida. Política provisional elegida bajo la autorización del usuario para resolver ajustes sencillos sin más preguntas; el botón lo explica.
- Reparaciones autorizadas consumen madera y restauran conservación hasta 100. Prioridad flexible: mantenimiento alto, obras, mantenimiento normal. Reserva mínima aplicable al reparto flexible; una reparación exclusiva manual puede utilizarla, pero nunca consume materiales reservados para otras obras. Sin deterioro espontáneo todavía.
- Práctica diaria de agricultura, tala y guardia; los constructores solo aprenden si realizan trabajo efectivo. No se añaden alimentos/madera por estas prácticas: producción y consumo siguen en 0.4, ataques en 0.6.
- Habilidades, XP y atributos separados. Aprendizaje principalmente individual, moderadamente influido por edad; sin jubilación automática. Maestría histórica preservada, desuso muy lento y recuperación acelerada. El potencial permanece oculto en listas, fichas y menús.

## Equilibrio provisional

El usuario autorizó decidir estos ajustes y corregirlos jugando. Parámetros centralizados en `src/game/rules/work.ts`, sin alterar decisiones confirmadas:

- Trabajo de obra: casa 60, huerto 40, almacén 80 unidades. Máximo tres constructores por tarea. Costes ya aprobados: 30/20/40 de madera. Capacidades conservadas: 5 camas, 2 trabajadores, 600 unidades.
- Esfuerzo diario: 3 + habilidad × 0,08 + promedio de atributos pertinentes × 0,04, redondeado y mínimo 1. No se promete duración fija: depende de las personas y las pausas. La carga de una obra iniciada queda guardada.
- Reparación: una madera por constructor que trabaja ese día; restaura esfuerzo × 0,5 puntos, hasta 100. Al alcanzar 100 deja de gastar.
- XP diario: redondeo de (4 + potencial × 0,24) × factor de edad; factor 1 antes de 45, 0,9 desde 45, 0,8 desde 60. Ganancia de habilidad XP/100, doble durante recuperación, con techo individual que preserva la maestría previa. XP acumulado acotado a un millón por oficio.
- Atributos pertinentes suben XP × 0,0002; desde los 60, fuerza/resistencia/agilidad/vitalidad declinan muy lentamente según edad y vitalidad. Desuso de habilidades practicadas: 0,001 por día sin practicarlas; no borra XP ni maestría.

## Guardado y comprobaciones

- Lectura de sobres v1–v5; escritura v5 al confirmar una acción. No cambia la versión física de IndexedDB. Leer partidas antiguas no regenera ni escribe; se conservan población, configuración, viviendas y proyectos.
- Tick de calendario separado del avance completo de aldea, que procesa trabajo una sola vez por día. Los avances 1/7/28 usan el mismo motor, respetan decisiones pendientes y no consumen azar para órdenes o trabajo.
- Batería final completa: 236 pruebas aprobadas en 17 archivos. Compatibilidad actualizada al nuevo motor, conservando la comparación histórica del calendario 0.1 con su fixture original. Compilación TypeScript/Vite correcta.
- Nuevos casos agrupados en `tests/app/work.test.ts` y `tests/core/workDay.test.ts`: edades/cumpleaños, cupos, cambios de oficio, automatización, pago único, pausa/cancelación/fin de obra, reparación y reserva, aprendizaje/desuso, equivalencia de avances, compatibilidad y fallo/reintento sin doble trabajo.
- Brave aislado, 1440×900 y 844×390: asignar los cuatro oficios, llenar puestos, cambiar destino, filtrar y consultar fichas. Obra real: 6/60 tras un día, pausa de siete días conservando 6/60, reanudación y Casa 5 terminada; madera 62 antes/después de reanudar, sin segundo cobro. Constructor recuperado con 190 XP tras recargar sin red. Actualización de PWA conservó órdenes. Sin desbordamiento horizontal ni errores/advertencias de consola en estas comprobaciones.
- Android físico y compatibilidad Opera de esta versión no comprobados. No se repiten aquí las pruebas de versiones anteriores como si fueran de 0.3.

## Archivos y vista previa

- Nuevos: `src/game/{commands/work,rules/work,selectors/work,core/workDay}.ts`, `src/ui/professions.ts`, los dos archivos de pruebas y este seguimiento.
- Modificados: modelos, validación y esquema; construcción/mantenimiento/almacén; sesión/persistencia/montaje; selectores/fichas/vistas/estilos; expectativas pertinentes de pruebas anteriores; versiones de package y lock, README y AGENTS. Sin dependencias nuevas.
- Compilar: `npm run build -- --outDir dist-0-3.local`; servir: `npm run preview -- --outDir dist-0-3.local --port 4176`.
- Vista previa: http://127.0.0.1:4176. Tiene partidas propias por ser otro origen. Las compilaciones y partidas de 0.2 (4175) y del enlace Android (0.1) se conservan. No se ha trasladado ningún guardado personal.
- El siguiente trabajo es probar esta candidata y ajustar sus parámetros, antes de iniciar la economía de 0.4. No hubo commits, push, etiquetas ni nuevas publicaciones.
