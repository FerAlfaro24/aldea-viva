# Aldea Viva — Seguimiento 0.2

Fecha: 2026-11-02. Base: `fc0783f`, candidata 0.1 guardada en GitHub. El usuario aprobó P1–P5, el calendario visual y completar la 0.2. **Implementación terminada en local; prueba de esta versión en Android físico pendiente.** Las secciones por tramo conservan el historial de desarrollo; el cierre figura al final.

## Estado de bloques

| Bloque | Estado real |
|---|---|
| B1 — Compatibilidad y arranque | Lector v1–v4, escritura v4 y cuatro casas en aldeas nuevas. Las anteriores conservan su configuración |
| B2 — Solares y edificios | Plano, fichas, calendario y solares libres/ocupados/reservados implementados |
| B3 — Vivienda manual | Traslado individual a casa con plaza, protección, registro y autoguardado implementados. No hay acción para dejar sin vivienda ni traslado familiar en bloque |
| B4 — Almacén | Existencias, reservas y madera disponible; contrato de recepción parcial implementado, sin crear recursos desde la UI |
| B5 — Obras y ampliación | Proyectos, ampliación a grado 2 y mantenimiento autorizado con prioridades/reserva mínima. Sin trabajo real de constructores ni deterioro |
| B6 — Integración | 220 pruebas y build correctos; recorrido integrado y reapertura offline en Brave. Validación de esta 0.2 en Android físico pendiente |

## Funciones que se pueden probar

- Fundar una aldea con cuatro casas de cinco plazas: se alojan los 15–20 habitantes sin aumentar los diez solares provisionales. Quedan siete edificios iniciales y tres solares libres.
- Consultar el calendario mensual de 28 días, año, mes y estación, resaltar hoy y elegir otro día. Los cumpleaños permiten abrir la ficha; al volver se conserva la fecha consultada.
- Ir al mes anterior/siguiente, incluido el cambio de año, o volver a hoy. Estas acciones no modifican ninguna ranura ni consumen RNG; el avance real sigue siendo +1/+7/+28.
- Consultar cumpleaños futuros conocidos sin inventar acontecimientos aleatorios. Los sucesos ocurridos proceden del registro real.
- Abrir «Edificios», seleccionar un solar y consultar casa, moradores, huerto, conservación, capacidad del almacén y ocupación combinada de alimentos/madera.
- Trasladar una persona a una vivienda con plaza; el movimiento preserva familia e identidad, se marca como orden protegida del jugador y aparece en el registro. Permanece tras avanzar y reabrir.
- Una casa llena no acepta un traslado ni expulsa a otro morador. Si todas están llenas no hay traslado simple posible: no se añadieron intercambios ni desalojo sin decisión de diseño.

## Compatibilidad de partidas

- Antes de cambiar el generador se creó `tests/fixtures/save-v1.json` con el código de la 0.1: semilla sintética `partida-0.1-conservada`, tres casas y 28 días avanzados. No contiene datos del usuario.
- La 0.2 lee el sobre v1 sin escribirlo ni volver a generar el mundo. Navegar o cargar repetidamente conserva también su formato y metadatos.
- La siguiente acción persistente escribe v2, con validación completa y comparación de revisión/UUID en la misma transacción. El mundo cambia solo por la acción elegida; no se añade una cuarta casa a la partida antigua.
- El formato 2 admite el nuevo identificador inicial y el registro de traslados. El lector v1 sigue restringido a sus tipos/configuración originales. El identificador de generación de familias permanece porque la población y el consumo de azar no cambiaron.
- Las configuraciones `provisional-v1` (tres casas) y `housing-20-v1` (cuatro) están separadas. Una misma semilla produce los mismos habitantes, familias, inventario y RNG con ambos perfiles; cambian edificios y alojamiento según el perfil.
- Si falla el primer guardado a v2, la partida v1 previa sigue intacta y reintentar no duplica días ni movimientos.
- Volver a ejecutar 0.1 sobre un guardado v2 no lo convierte hacia atrás: el cliente antiguo lo protege como formato incompatible. Se comprobó con la compilación real 0.1 en un contexto aislado.
- Consultar calendario/solares no escribe el mundo; las selecciones de pantalla son estado temporal de interfaz.

## Pruebas ejecutadas

- `npm test`: **210 pruebas pasaron en 13 archivos**. Se mantienen las comprobaciones anteriores, adaptando exclusivamente las expectativas de camas/casas/solares a la decisión aprobada. Las 1000 semillas del generador nuevo se validan con 20 camas y todos alojados.
- Nuevas pruebas: 5 de compatibilidad con fixture v1, 12 de calendario y 7 de vivienda/solares. Cubren preservación, serialización, fallo/reintento, selección sin mutación, límites de meses/años, cumpleaños, escape de textos, cupos, órdenes y registro.
- `npm run check`: correcto después de incorporar el formato y la interfaz. `npm run build -- --outDir dist-0-2.local`: correcto, con comprobación TypeScript incluida.
- Brave aislado: nueva aldea con cuatro casas, 28 casillas, navegación doce meses hasta año 2, comparación completa del guardado antes/después de consultar, volver a hoy y avance real con selección que acompaña el día.
- Brave: traslado por formulario, comprobación de `source: player` y protección, residentes/RNG intactos, avance, recarga y recuperación de la vivienda elegida.
- Brave: carga del fixture antiguo en otra ranura, lectura sin modificaciones, avance 28→35 días y escritura v2 conservando tres casas, identidades y RNG.
- Cliente real 0.1, con datos exclusivamente sintéticos: al sustituir la ranura por un sobre v2 e intentar avanzar desde la pestaña antigua, se mostró el error y el registro v2 quedó idéntico. No se tocó el perfil del usuario.
- Se corrigió un desbordamiento del menú en 320 px tras añadir nuevas secciones. Revisadas capturas de calendario y edificios en escritorio/horizontal; medidas de calendario/solares en 320×568 sin desbordamiento y días de al menos 44 px. El encabezado del calendario se compacta en horizontal corto conservando su título accesible.
- Brave con toque emulado 844×390: consultar cumpleaños, abrir la ficha correcta, volver conservando selección; elegir vivienda y guardar; recargar desconectado, comprobar orden protegida, abrir calendario y avanzar/guardar siete días. Sin errores de ejecución.
- Opera GX 844×390: nueva aldea, calendario y selección futura, solares, traslado en casa con plazas, recarga offline y avance guardado. Sin errores ni advertencias de consola en las sesiones comprobadas de Brave y Opera.
- La última corrección de foco al abrir un solar fue comprobada en el flujo táctil: el panel de detalle recibe foco. No se ejecutaron ESLint/Prettier porque no están configurados.

## Archivos y entorno

- Generación/modelos: `src/game/rules/initialConfig.ts`, `models/{village,save,simulation}.ts`, `generation/village.ts`, `validation/village.ts`.
- Nuevos: `src/game/commands/housing.ts`, `src/game/selectors/calendar.ts`, `src/ui/{calendar,buildings}.ts`, pruebas en `tests/{storage/compatibility,ui/calendar,app/housing}.test.ts` y fixture JSON.
- Aplicación: `src/app/{session,persistence,mount}.ts`; formatos/vistas/estilos en `src/ui/{format,village,welcome}.ts` y `src/ui/game.css`.
- `tsconfig.json` habilita importación de JSON para la fixture sin añadir dependencias. `package.json` y su lock identifican el desarrollo como `0.2.0-dev`; no se creó etiqueta Git.
- Documentación: plan 09, este seguimiento 10, README y AGENTS. Los documentos maestros 01–06 y la revisión histórica de 0.1 se preservan.
- Vista previa de este tramo: `npm run preview -- --outDir dist-0-2.local --port 4175`, en `http://127.0.0.1:4175`. Compilación separada para conservar `dist/` y la vista previa 0.1 del enlace del teléfono. `*.local` ya está ignorado por Git.
- Las partidas del puerto 4175 son independientes de 4173 y del enlace HTTPS. La compatibilidad se ha probado con datos sintéticos; no se importan datos del teléfono ni se trasladan a otro origen automáticamente.
- No se han hecho commits ni push de esta 0.2, ni se ha cambiado la versión servida al teléfono. La autorización anterior de Git cubrió el punto 0.1, no una nueva subida.

## Lo siguiente

El usuario aprobó los costes provisionales de casa 30, huerto 20 y almacén 40 unidades de madera. El siguiente bloque es conectar el almacén con proyectos: elegir un solar libre, consultar coste, reservar materiales/solar, preparar, pausar, reanudar o cancelar antes del inicio y recuperar todo al cerrar. Implementar también la política de aceptación parcial de entradas como contrato de recursos, sin añadir botones para crear recursos ficticios.

Probar reserva doble, falta de materiales, liberación al cancelar, ausencia de cobros duplicados y de progreso sin constructores, persistencia y compatibilidad con las partidas del primer tramo. Las capacidades actuales se conservan; tiempos de construcción corresponden al trabajo de 0.3. Después se concretarán requisitos de ampliación y controles de mantenimiento antes de activarlos, y se repetirá aceptación en Android real. Ningún paso activa oficios, producción, hambre ni deterioro de versiones posteriores.

## Segundo bloque — Proyectos y materiales

- Implementados costes provisionales de casa 30, huerto 20 y almacén 40; preparar reserva solar y madera, pausar/reanudar conserva la reserva y cancelar la libera. Las existencias físicas y la ocupación del almacén no cambian. El tiempo no hace avanzar obras sin constructores.
- La ficha del almacén muestra madera almacenada, reservada y disponible. Los solares distinguen libres, ocupados y reservados; las órdenes se registran y guardan.
- `receiveResource` acepta la cantidad que cabe y devuelve la rechazada, compartiendo capacidad comida/madera. Es un contrato para futuras entregas, no producción activa ni un botón de recursos gratuitos.
- Sobre de guardado v3 para proyectos/registro de obra. Se siguen leyendo v1/v2 sin regenerar ni escribir al consultar. La ausencia de proyectos en partidas anteriores equivale a ninguna obra; se actualiza el sobre al guardar una acción. Versiones antiguas no pueden interpretar ni sobrescribir este formato nuevo.
- **215 pruebas pasaron en 14 archivos** y build correcto en `dist-0-2.local`. Solo cinco casos nuevos agrupados: reservas/cupos, pausa/reanudación/cancelación sin doble gasto, entradas parciales, compatibilidad/reapertura y fallo/reintento de guardado.
- Brave aislado: preparar casa, pausar, avanzar siete días, recargar, recuperar pausa, reanudar y cancelar; vuelta al solar libre. Capturas en 1440×900 y 844×390, interacción móvil sin desbordamiento y consola sin errores ni advertencias. No se repitió toda la batería visual anterior ni la prueba de Android físico.
- Archivos principales nuevos: `src/game/{commands/construction,commands/storage,rules/construction,selectors/storage}.ts` y `tests/app/construction.test.ts`. Modificados modelos, validación/esquema, sesión/persistencia/montaje, vistas/formatos/estilos y expectativas de versión de las pruebas existentes.
- Todo sigue local en el puerto 4175. Sin commits, push ni sustitución de la versión del enlace Android. Próximo pendiente: requisitos aprobados para ampliación; después mantenimiento y aceptación del conjunto.

## Cierre de implementación 0.2

- Ampliación aprobada e implementada: grado 1→2, mínimo 15 habitantes y 150 alimentos, todos los edificios al menos al 80 %, coste de 50 de madera libre de reservas y cuatro solares adicionales. Conserva IDs, habitantes, edificios y proyectos; no se puede cobrar dos veces. Solo se ofrece esta ampliación, sin inventar grados posteriores.
- Mantenimiento preparado: autorización por edificio, prioridad normal/alta y reserva mínima de madera editable en el almacén (0 por defecto). No repara, asigna oficio, consume recursos ni degrada edificios. La reserva mínima es una política del mantenimiento futuro, no materiales apartados que bloqueen otras órdenes manuales. Aviso de conservación reducida si el valor real es menor de 100.
- Formato v4 guarda ampliación y configuración/registro de mantenimiento; lectura v1/v2/v3 conservada. El mundo antiguo no se regenera y la escritura sigue siendo transaccional.
- **220 pruebas aprobadas en 15 archivos** y compilación TypeScript/Vite correcta. Solo cinco casos nuevos agrupados en `tests/app/expansion.test.ts`: límites y pago único, requisitos no cumplidos, permisos sin efectos prematuros, reapertura de v3 a v4 con tres ranuras y fallo/reintento sin doble cobro.
- Brave aislado: preparar una casa, ampliar a 14 solares, autorizar mantenimiento con prioridad alta, fijar reserva mínima 20, recargar sin red y recuperar todo, avanzar siete días con proyecto aún sin progreso. Escritorio 1440×900 y tamaño móvil 844×390; sin desbordamiento, errores ni advertencias. Se compactó el aviso de ampliación completada y se comprobó la actualización de PWA conservando los datos.
- Archivos principales de cierre: nuevos `src/game/commands/{expansion,maintenance}.ts` y su prueba; modelos, esquema/validación, sesión/persistencia, montaje, vistas/formatos/estilos y versión `0.2.0` actualizados. README, AGENTS y plan reflejan el cierre; los documentos maestros no se modifican.
- Límites de la entrega: constructores y reparación efectiva se activarán desde 0.3 según sus dependencias; economía, deterioro y supervivencia siguen diferidos. No se incorporan desalojos ni traslados familiares en bloque, que eran ampliaciones opcionales no aprobadas.
- Pendiente externo: verificar esta versión en el Android real del usuario. La prueba física previa fue de 0.1, no se atribuye a 0.2. No hubo commits, etiquetas, push ni actualización del enlace del teléfono; la 0.2 completa se puede probar en `http://127.0.0.1:4175`.
