# Aldea Viva — Candidata 1.0

Estado actual: `1.0.0-rc.2`, preparada localmente. **No es todavía una 1.0 final aceptada en Android.** La subida del código y su documentación a GitHub está autorizada por el usuario para esta entrega. No hay etiqueta final, publicación web nueva ni APK.

## Ajuste visual rc.2

A petición del usuario, se sustituye el fondo claro por un tema oscuro de bosque por defecto: fondo #151b19, paneles #1e2723, texto suave y acentos verdes/ámbar. Tarjetas de indicadores, navegación activa más clara, formularios y diálogos oscuros, avisos diferenciados y controles menos brillantes. Colores del navegador y arranque PWA actualizados. Paleta centralizada en variables de `src/style.css`; detalles en `src/ui/game.css`, `index.html` y `public/manifest.webmanifest`. Preferencia persistente de diseño, sin cambiar datos del sistema.

Compilación TypeScript/Vite correcta. Brave 1440×900 y 844×390, inspección visual de `10-oscuro-desktop.png` y `10-oscuro-mobile.png`, sin desbordamiento. Revisados Aldea, Oficios, Economía, Calendario, Ayuda, selección de día y diálogo/cancelación. Recarga sin conexión mantiene la paleta; cero errores/advertencias de consola. Sin simulaciones nuevas ni repetición de la batería de motor por tratarse de presentación. Prueba física de Android pendiente. Las comprobaciones funcionales siguientes corresponden a rc.1 y no se atribuyen a otra ejecución.

## Cambios de esta candidata

- Guía opcional desde portada y navegación, incluso sin partida. En la aldea, primeros pasos consultables con agricultores aptos, previsión de consumo, días de reserva y capacidad actuales. Abierta el día inicial y plegada en días posteriores; no asigna oficios ni modifica políticas.
- Explica que hacen falta reservas para 84 días de invierno, más producción y almacenamiento, madera para tareas autorizadas y atención a raciones reducidas. Los consejos derivan de las mecánicas existentes, sin imponer una secuencia obligatoria ni revelar potenciales.
- Portada y descripción actualizadas: ya no anuncian economía/trabajos como funciones futuras. Indicador «Candidata 1.0» y `CHANGELOG.md` con el recorrido de versiones.
- Rendimiento: sucesos y asaltos se comprueban con índices temporales por ID, conservando las verificaciones de duplicados/referencias. La economía diaria usa entregas internas sin repetir una validación completa del mismo mundo antes/después de cada recurso; el avance valida el mundo completo a la entrada y a la salida de cada día. La API pública de entregas y la persistencia siguen validando completamente.
- Se conserva formato v9, lector v1–v9 e IndexedDB física. Cambia la versión de aplicación escrita a `1.0.0-rc.1`; cargar/consultar no actualiza sobres ni regenera. Sin dependencias ni sistemas nuevos.

## Equilibrio longitudinal observado

Ocho partidas con cinco años de 336 días cada una: **40 años simulados y 40 reaperturas anuales**, usando generación normal y solo órdenes públicas. No se añadieron recursos, se desactivaron peligros ni se consultó potencial oculto para escoger trabajadores.

Dos jugadores sintéticos: «reservas», con seis agricultores y hasta cuatro guardias; «huertos», con hasta ocho agricultores y dos guardias. Ambos autorizan mantenimiento, construyen huerto/almacenes, amplían si cumplen los requisitos, limitan tala cuando sobra madera, eligen intentos prudentes y negocian cuando hay reservas. Son escenarios de intervención activa, no garantías de supervivencia al abandonar la aldea. La rutina vive solo en las pruebas y no automatiza partidas del usuario.

| Semilla | Estrategia | Población inicial | Vivos al año 5 | Asaltos resueltos | Sucesos resueltos |
|---|---|---:|---:|---:|---:|
| integracion-1 | Reservas | 19 | 19 | 17 | 89 |
| integracion-1 | Huertos | 19 | 20 | 16 | 85 |
| integracion-2 | Reservas | 19 | 20 | 22 | 79 |
| integracion-2 | Huertos | 19 | 19 | 18 | 93 |
| integracion-3 | Reservas | 18 | 18 | 17 | 89 |
| integracion-3 | Huertos | 18 | 18 | 25 | 86 |
| extremo-9 | Reservas | 15 | 19 | 20 | 87 |
| extremo-3 | Huertos | 20 | 20 | 20 | 87 |

Los aumentos de población proceden de visitantes aceptados con camas disponibles, sin nacimientos ni reemplazos automáticos. En total, 155 asaltos y 695 oportunidades resueltos. Hay inviernos ajustados: la muestra de 18–19 personas llegó a mínimos anuales de 11–20 alimentos en algunos casos y hambre media de hasta 38,3. Ambas estrategias llegaron al quinto año, por lo que no se cambiaron tasas de producción, hambre o ataques por intuición. Quedan ajustes subjetivos de dificultad y diversión al jugar.

Los ocho escenarios tardaron aproximadamente 31,8 segundos de motor/órdenes en este PC, con hasta 2380 entradas de crónica. Es una medición de ejecución local, no FPS ni rendimiento de Android. El informe generado queda ignorado en `.tools.local/balance-10.json`.

## Comprobaciones realizadas

- **280 pruebas regresivas aprobadas**, incluida la ayuda, y **dos pruebas de integración aprobadas por separado** con las ocho partidas anteriores: 282 pruebas en total, 23 archivos. Se evitó repetir la simulación larga al ejecutar la batería restante.
- Compilación TypeScript/Vite correcta en `dist-1-0.local`. Sin ESLint/Prettier configurados ni nuevas dependencias. La verificación conserva pruebas de migración, errores/reintentos, muertes, RNG, pausas, vivienda y secretos de interfaz de versiones previas.
- Brave aislado: actualización desde 0.7 conservó exactamente UUID/revisión/versión del sobre consultado, día 0 y 23 personas de la partida sintética anterior, sin escribir al consultar. Acceso a las doce secciones, incluida la ayuda.
- Otro perfil aislado limpio: guía accesible sin fundar; creación normal, consejos contextuales y plegado manual. Escritorio 1440×900 y móvil 844×390 sin desbordamiento de página; controles de guía de al menos 44 px. Capturas en la carpeta de trabajo: `10-inicio-desktop.png`, `10-inicio-mobile.png`, `10-ayuda-desktop.png` y `10-ayuda-mobile.png`.
- Sin conexión: recarga, apertura de la ayuda y de la aldea, avance de un día y guardado correctos. La guía queda plegada al pasar del día inicial. Cero errores/advertencias de consola en lo comprobado. Solo perfiles y datos sintéticos, sin sesiones personales.
- La compilación y el enlace antiguos del teléfono no se han sustituido. Android físico y Opera no probados en esta candidata.

## Pendiente para cerrar la 1.0

1. Prueba real del usuario en Android horizontal: legibilidad, controles, instalación/actualización, reapertura y guardado sin conexión.
2. Corregir los problemas que aparezcan y confirmar que la dificultad y el ritmo resultan agradables, especialmente el primer invierno y la ocupación del almacén.
3. Aceptación final del usuario. La subida del código a GitHub está autorizada para esta entrega; etiquetas de versión final, publicación web y APK requieren autorización adicional.

Las simulaciones acotadas no garantizan ausencia de errores en cualquier partida futura. Se mantienen fuera del alcance los nacimientos, mercado, medicina profunda, mapa masivo, bosque finito y combate individual.

## Archivos y ejecución

- Nuevos: `src/ui/help.ts`, `tests/ui/help.test.ts`, `tests/fixtures/managedVillage.ts`, `tests/integration/longGame.test.mjs`, `CHANGELOG.md` y este seguimiento.
- Modificados: entregas/economía y validación de sucesos/defensa; rutas/montaje, portada/aldea/estilos; versión en package/lock y sobre; README/AGENTS. Los documentos maestros y las compilaciones anteriores se conservan.
- Compilar `npm run build -- --outDir dist-1-0.local`; servir `npm run preview -- --outDir dist-1-0.local --port 4176`. Mismo origen que 0.3–0.7. «Actualizar aplicación» activa la candidata.
- Comprobación rápida completa de regresión: `npm test -- --exclude tests/integration/longGame.test.mjs`. Integración longitudinal: `npm test -- tests/integration/longGame.test.mjs`. El `npm test` normal incluye ambas.
