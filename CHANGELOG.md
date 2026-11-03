# Cambios de Aldea Viva

## 1.0.0-rc.3 — Primer año guiado

- Plan de invierno con comida, capacidad, madera real acumulada y margen del 20 %; reserva nutritiva independiente de raciones reducidas.
- Guía sin ampliaciones imposibles ni huertos de última hora; reparaciones y materiales concretos para desbloquear el siguiente paso. Ajustes de tala/destinos requieren revisar y confirmar.
- Capítulos por estación, hitos y resumen del avance con nombres; almacenes agrupados y final de partida coherente. Impacto de visitantes sobre la reserva explicado antes de aceptar.
- Sucesos separados 14–24 días y alternancia de tipos elegibles. Negociación ligada al 6 % de reservas libres; comparación de comida restante si falla cada táctica. Robo base del primer año limitado al 10–25 %; 15–40 % desde el segundo.
- Grado 2 tras el primer mes; se conservan los grados existentes. Mismos guardados v9 y generación inicial, sin nuevas dependencias.
- 298 pruebas y build aprobados, incluida aceptación reproducible de seis primeros años sin hambre al cierre y recorrido de un año en Brave, con actualización, móvil horizontal y recuperación offline. Detalle, límites y resultados en `docs/19_PRIMER_ANO_RC3.md`.

## Base de rc.3 — Orientación inicial y oficios recomendados

- «Tu siguiente paso» permanece visible en Aldea y responde al estado real: puestos libres, déficit de comida, obras, madera, almacén, salud, refugio y amenazas. Incluye balance previsto, reservas y progreso; no se oculta tras el primer día.
- Propuesta revisable de oficios, aplicada una vez: prioriza agricultura, hasta dos constructores según necesidad, un leñador si procede y guardia. Usa capacidad actual pública, edades y aptitud; completa puestos con habitantes sin oficio y conserva todos los nombramientos previos. No cambia órdenes al avanzar, no consulta potenciales ocultos ni promete un óptimo global.
- Accesos a la obra recomendada con solar y tipo preseleccionados, sin gastar hasta preparar; ampliación al grado 2 después del plano y aviso al terminar una obra.
- Lector/escritor v9 conservados, sin nuevas dependencias ni cambios en reglas económicas. El reparto completo se guarda en una única operación y conserva el reintento existente.
- Archivos: `src/game/selectors/guidance.ts`, `src/game/selectors/recommendedWork.ts`, `src/game/commands/recommendedWork.ts`; integración en `src/app/{session,persistence,mount}.ts`, `src/ui/{help,professions,buildings}.ts` y `src/style.css`; pruebas en `tests/app/guidance.test.ts` y `tests/ui/help.test.ts`.
- Comprobados 21 casos pertinentes y compilación. Recorrido real en Brave aislado escritorio y móvil horizontal: revisar/aplicar, preparar huerto, terminar, ocupar nuevos puestos y recuperar el día 4 tras recargar. Sin publicar todavía; pendiente prueba física en Android.

## Publicación de pruebas — Cloudflare Pages

- Compilación desde el repositorio privado, Node fijado en `.node-version` y encabezados para revalidar las actualizaciones de la PWA.
- Web pública: https://aldea-viva.pages.dev/. Procedimiento y configuración en `docs/17_PUBLICACION_PAGES.md`.
- Normalizada la respuesta HTML del service worker para permitir recargar cuando Pages redirige `index.html` a `/`. Compilación, recarga y modo offline comprobados reproduciendo esa redirección.

### Corrección AV-UX-001

- La portada de la aldea solo muestra el aviso de salud si hay personas vivas con hambre ≥25, salud <75 o incapacidad; el aviso de falta de refugio sigue usando las asignaciones reales.
- Se conserva el resumen de final de partida. Corregido el mensaje que atribuía una crisis a todas las aldeas sanas.
- Seis pruebas de vistas y compilación correctas. Reproducido y comprobado después de actualizar por el enlace temporal, sin desbordamiento a 844×390. No se han cambiado economía ni primeros pasos.

## 1.0.0-rc.2 — Interfaz oscura

- Fondo verde carbón, texto suave y superficies diferenciadas; formularios, calendario, avisos y diálogos oscuros.
- Indicadores en tarjetas, navegación activa más clara, botones menos brillantes y texto auxiliar algo mayor.
- Colores oscuros de inicio y barra del navegador/PWA. Sin cambios en mecánicas ni guardados.
- Compilación y revisión visual en Brave escritorio/móvil; comprobadas selección de calendario, diálogo, recarga offline y consola. Sin repetir simulaciones largas para este cambio visual.

## 1.0.0-rc.1 — Candidata local

- Integración de los sistemas 0.1–0.7, manteniendo las reglas y guardados existentes.
- Guía opcional «Cómo cuidar tu aldea», accesible antes de fundar, y primeros pasos vinculados al estado real de la partida.
- Indicaciones sobre reservas invernales, almacén compartido, raciones y decisiones manuales; textos antiguos de la portada actualizados.
- Menos validaciones completas repetidas por entrega diaria; comprobación completa al entrar y salir del avance y al guardar/cargar. Índices temporales para comprobar la crónica sin comparar cada suceso con todos los demás.
- Ocho simulaciones de cinco años, dos estrategias y poblaciones iniciales de 15–20; reapertura anual, sucesos, asaltos y crecimiento excepcional activos. Detalles y límites en `docs/16_CANDIDATA_1_0.md`.
- Formato de guardado v9 conservado, lector v1–v9. Sin dependencias nuevas.
- Pendientes para declarar 1.0 final: prueba física y aceptación del usuario en Android, y ajustes que surjan jugando. Sin APK ni publicación nueva.

## 0.7

Sucesos contextuales, aprendizaje extraordinario, talentos por etapas, visitantes muy raros y crónica con filtros y paginación.

## 0.6

Defensa por puestos, indicios, asaltos y decisiones con riesgos calculados; robos, daños, heridas y bajas persistentes.

## 0.5

Hambre, salud, invierno, incapacidades, deterioro, derrumbes, muertes permanentes y final sin supervivientes.

## 0.4

Producción y consumo diarios, raciones, prioridades, balances y almacenamiento compartido en centésimas.

## 0.3

Cuatro oficios manuales, aprendizaje, construcción efectiva y mantenimiento autorizado.

## 0.2

Viviendas y solares, reservas de obra, ampliación, mantenimiento configurable y calendario visual.

## 0.1

Generación de familias, calendario de 336 días, fichas, tres ranuras, guardado local y funcionamiento sin conexión.
