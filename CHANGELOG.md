# Cambios de Aldea Viva

## Preparación de publicación de pruebas — Cloudflare Pages

- Compilación desde el repositorio privado, Node fijado en `.node-version` y encabezados para revalidar las actualizaciones de la PWA.
- Procedimiento y configuración en `docs/17_PUBLICACION_PAGES.md`. El éxito y la URL deben confirmarse en el panel de Cloudflare.

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
