# Aldea Viva

Juego de simulación de aldeas, pensado primero para Android.

**Jugar en la web:** [aldea-viva.pages.dev](https://aldea-viva.pages.dev/). Publicación de pruebas de la candidata 1.0; configuración en [Cloudflare Pages](docs/17_PUBLICACION_PAGES.md). Las partidas pertenecen al navegador y a esta dirección.

**Manual y referencia completa:** [Todo lo que contiene la candidata 1.0](ALDEA_VIVA_1_0_DOCUMENTACION_COMPLETA.md). Incluye pantallas, reglas, fórmulas, guardados, arquitectura, pruebas y pendientes.

## Base del proyecto

- TypeScript + Vite.
- Desarrollo local con VS Code y Codex.
- Candidata 1.0 (`1.0.0-rc.2`): sistemas 0.1–0.7 integrados, guía opcional y mejoras de rendimiento. Ocho partidas de cinco años comprobadas; publicada para pruebas en Pages, pendiente aceptación física en Android. Sin APK nueva.

Empieza por [LEEME_PRIMERO.md](LEEME_PRIMERO.md), sigue con la [Biblia de diseño](docs/01_BIBLIA_DE_DISENO_0_1_A_1_0.md) y la [especificación ejecutable 0.1](docs/02_ESPECIFICACION_EJECUTABLE_0_1.md). El [documento maestro anterior](docs/Aldea_Viva_Documento_Maestro.md) se conserva como referencia.

El [seguimiento de la 0.1](docs/07_SEGUIMIENTO_0_1.md) distingue lo implementado de los próximos hitos y documenta las decisiones técnicas.

La [revisión de aceptación](docs/08_ACEPTACION_0_1.md) reúne los veinte criterios AV01, las 186 pruebas automáticas, la evidencia de Android y los límites pendientes. No hay etiqueta final de versión.

El [plan 0.2](docs/09_PLAN_DE_TRABAJO_0_2.md) recoge las decisiones aprobadas y el [seguimiento 0.2](docs/10_SEGUIMIENTO_0_2.md) documenta su cierre. El [seguimiento 0.3](docs/11_SEGUIMIENTO_0_3.md) conserva sus antecedentes. El [seguimiento 0.4](docs/12_SEGUIMIENTO_0_4.md) conserva las decisiones económicas y sus valores provisionales. Los resultados de Android de la 0.1 no se atribuyen automáticamente a versiones posteriores.

El estado actual, las comprobaciones y los pendientes están en la [candidata 1.0](docs/16_CANDIDATA_1_0.md). El [seguimiento 0.7](docs/15_SEGUIMIENTO_0_7.md) conserva los antecedentes de sucesos. El [historial de cambios](CHANGELOG.md) resume las versiones. El [seguimiento 0.6](docs/14_SEGUIMIENTO_0_6.md) conserva los antecedentes de defensa. El [seguimiento 0.5](docs/13_SEGUIMIENTO_0_5.md) conserva los antecedentes de supervivencia.

## Probar la candidata 1.0

```sh
npm run build -- --outDir dist-1-0.local
npm run preview -- --outDir dist-1-0.local --port 4176
```

Abre http://127.0.0.1:4176, la misma dirección que 0.3–0.7. Recarga y pulsa «Actualizar aplicación» si aparece. «Ayuda» explica cómo jugar y «Primeros pasos» muestra consejos ligados a tu aldea. «Sucesos» reúne oportunidades, visitantes y descubrimientos; «Registro» permite filtrar por persona, familia, año y estación. Las decisiones importantes detienen el tiempo y se guardan al resolver. La práctica revela talentos en dos etapas. Los visitantes llegan muy raramente, sin oficio; puedes aceptar o rechazar el grupo y ver cuántas camas faltan antes de decidir.

Se leen partidas v1–v9 y se guarda en v9. Las anteriores continúan sin regenerarse ni aplicar efectos retroactivos. Consultar no escribe ni consume azar. La primera comprobación de sucesos llega 14 días después de activarse; no hay una cuota obligatoria de eventos. Otras direcciones mantienen sus propios guardados. El enlace antiguo de Android conserva su compilación anterior.

## Compilaciones anteriores

Se conservan `dist/` (0.1 del teléfono), `dist-0-2.local` (0.2 en 4175), `dist-0-3.local`, `dist-0-4.local`, `dist-0-5.local`, `dist-0-6.local` y `dist-0-7.local`. No contienen automáticamente cambios posteriores. Reconstruir esas carpetas con el código actual generaría la versión actual. Las aplicaciones antiguas protegen los guardados nuevos como incompatibles en lugar de sobrescribirlos.

## Requisitos

- Node.js 22.12 o superior (incluye el requisito de Vitest).
- npm (incluido con Node.js).

## Ejecutar en tu PC

Abre una terminal en esta carpeta y ejecuta:

```sh
npm install
npm run dev
```

Abre http://127.0.0.1:5173 en el navegador. Para detener el servidor, pulsa Ctrl+C en la terminal.

En PowerShell puedes usar `npm.cmd` en lugar de `npm` si Windows bloquea el archivo `npm.ps1`.

## Comprobaciones

```sh
npm run check
npm test
npm run build
npm run preview
```

- `check` revisa los tipos de TypeScript.
- `test` ejecuta las pruebas del motor con Vitest, sin navegador. `npm run test:watch` las ejecuta durante el desarrollo.
- `build` revisa TypeScript y genera la versión de producción en `dist/`.
- `preview` sirve la compilación en http://127.0.0.1:4173.

No hay ESLint ni Prettier configurados todavía. Las pruebas cubren calendario, RNG, generación sobre 1000 semillas, familias, viviendas, proyecciones sin secretos, sesión, filtros, validación de guardados, transacciones, fallos, reintentos y conflictos entre pestañas. El seguimiento documenta por separado las comprobaciones en navegador.

## Organización

- `src/main.ts`: punto de entrada.
- `src/app/`: coordinación de sesión, persistencia, pantallas y registro de la PWA.
- `src/ui/`: bienvenida, espacios, aldea, habitantes, fichas, registro, formatos y estilos del juego.
- `src/game/core/`: calendario, RNG y motor diario puros, sin DOM ni almacenamiento.
- `src/game/models/`: contratos temporales y estado serializable mínimo.
- `src/game/rules/`: constantes de calendario y edades laborales confirmadas.
- `src/game/generation/`: habitantes, familias, nombres, pistas, alojamiento y creación de aldeas por semilla.
- `src/game/validation/`: invariantes del dominio y de creación.
- `src/storage/`: esquema de guardado validado con Zod y repositorio IndexedDB transaccional.
- `src/game/selectors/`: datos derivados para la futura interfaz, sin exponer potenciales secretos.
- `src/style.css`: estilos adaptables.
- `public/`: recursos estáticos, manifiesto e iconos de instalación.
- `vite.config.mjs`: ruta relativa y generación de una caché de aplicación versionada para producción.
- `docs/`: diseño del juego.
- `tests/`: pruebas del motor y datos sintéticos exclusivos de pruebas.

El motor no guarda partidas ni depende de la interfaz. La aplicación confirma una transición solo cuando IndexedDB termina su transacción.

## Estado actual

La bienvenida conserva la presentación del juego y permite abrir «Acerca del juego» o empezar a explorar una aldea.

M1 implementa internamente el calendario 12×28, edades derivadas, avisos de oficios, registro temporal, RNG versionado y avances diarios con interrupciones. M2 genera 15–20 habitantes con familias coherentes y características individuales, los aloja dentro de las 15 camas propuestas y registra a quienes no tienen vivienda. También crea las reservas y edificios iniciales.

M3 conecta los dos bloques a pantallas reales. Puedes crear hasta tres aldeas durante una sesión, consultar viviendas, familias y fichas, filtrar habitantes, leer el registro y avanzar 1/7/28 días. Los rangos de generación, capacidades y recursos iniciales siguen siendo provisionales; consulta el seguimiento para ver las cifras y sus límites.

M4 añade guardado automático al crear y avanzar, recuperación tras recargar/cerrar y estados reales de guardando/guardado/error. Reemplazar y borrar requieren confirmación. Los datos incompatibles se protegen, y los fallos permiten reintentar el mismo cambio o descartarlo y releer lo último confirmado. Una pestaña desactualizada no sobrescribe otra.

Las partidas pertenecen a **este navegador y esta dirección**, incluyendo su puerto. Las direcciones de desarrollo (5173) y vista previa (4173) mantienen partidas distintas. Borrar los datos del sitio puede eliminarlas; no hay respaldo en la nube.

## Qué puedes probar ahora

1. Abre el proyecto con `npm run dev` y entra en http://127.0.0.1:5173.
2. Pulsa «Explorar mi aldea», elige un espacio y pulsa «Crear aldea».
3. Escribe una semilla o déjala vacía para obtener una nueva. Confirma «Fundar aldea».
4. Revisa «Habitantes», abre una ficha y navega por sus familiares. Los filtros permiten buscar por nombre, familia, vivienda, edad y oficio sin avanzar el tiempo.
5. Prueba +1/+7/+28 y consulta «Registro». Espera «Guardado», recarga y continúa desde «Tus aldeas»: la fecha y los habitantes se conservan.

## Probar sin conexión

1. Ejecuta `npm run build` y después `npm run preview`.
2. Abre http://127.0.0.1:4173 y espera «Disponible sin conexión en este dispositivo».
3. Crea una aldea, avanza y espera «Guardado». Recarga con la conexión desactivada desde las herramientas del navegador: puedes continuar y guardar localmente.
4. Al detectar una nueva compilación aparece «Actualizar aplicación». La actualización se aplica con ese botón cuando no hay cambios pendientes y conserva las partidas.

El modo de desarrollo no registra el service worker. Offline e instalación requieren HTTPS o localhost; abrir el HTML desde el disco no basta. El manifiesto pide orientación horizontal, su cumplimiento depende del dispositivo.

El usuario confirmó en su Android con Brave la apertura desde el icono sin barra del navegador, orientación horizontal, recuperación de fecha exacta al cerrar desde recientes y reabrir en modo avión, y la independencia de las tres aldeas tras cerrar/reabrir. Son pruebas comunicadas por el usuario, no una inspección remota del teléfono. No se han probado todos los dispositivos, reinicio o cierre forzado del sistema, ni la comparación completa de un mismo mundo entre PC y Android físico.

El enlace temporal de Cloudflare se habilitó con autorización para las pruebas. No hay alojamiento permanente ni APK, y la candidata todavía no tiene etiqueta final. Si cambia la dirección, las partidas no se trasladan automáticamente al nuevo origen.

No hay trabajos, producción, consumo, construcción, combate ni mortalidad activos en este prototipo.
