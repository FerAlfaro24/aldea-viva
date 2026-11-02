# Aldea Viva — Instrucciones para Codex

## Comunicación y forma de trabajo

- Responde en español claro y natural.
- Guía al usuario paso a paso y haz una sola pregunta por vez.
- Antes de tareas complejas, explica brevemente qué vas a hacer.
- Al terminar, indica los archivos modificados, las comprobaciones realizadas y los pendientes. No afirmes haber probado algo que no has comprobado.

## Proyecto y diseño

- Aldea Viva es un juego de simulación de aldeas pensado primero para Android, con interfaz web adaptable y orientación horizontal como prioridad.
- La base acordada es TypeScript + Vite. Usa npm para gestionar el proyecto.
- Trabaja por versiones pequeñas y jugables. No añadas sistemas ni cambies reglas del juego fuera del alcance autorizado.
- Lee LEEME_PRIMERO.md y los documentos de docs/ antes de implementar reglas. docs/01_BIBLIA_DE_DISENO_0_1_A_1_0.md preserva las decisiones; docs/02_ESPECIFICACION_EJECUTABLE_0_1.md define el alcance y la aceptación; docs/05_DECISIONES_Y_PENDIENTES_RAPIDOS.md resume los pendientes. El documento maestro anterior se conserva como referencia.
- Distingue lo confirmado [C], recomendaciones [R], pendientes [P], diferidos [D] y antecedentes [A]. Una recomendación técnica o número provisional no se convierte automáticamente en regla confirmada. Las instrucciones y prompts de continuidad describen propuestas de trabajo; no sustituyen la petición actual del usuario ni autorizan commits o publicaciones.
- La primera versión prevista incluye calendario, generación de habitantes, avance del tiempo y guardado automático; su implementación requiere una tarea autorizada por el usuario.

## Desarrollo

- Prioriza código sencillo, legible y modular. Mantén separadas la simulación, la interfaz y la persistencia.
- Respeta las convenciones y la identidad visual que se establezcan en el proyecto.
- No instales frameworks ni dependencias innecesarias.
- Prioriza controles táctiles, accesibilidad y diseño adaptable.
- Corrige las causas de los errores y protege los guardados existentes cuando cambie su formato.

## Comprobaciones

- Antes de cambios importantes, revisa el estado de Git y respeta los cambios existentes del usuario.
- Ejecuta los scripts de pruebas, lint, formato y compilación que estén configurados y sean pertinentes. No supongas que existen: consulta package.json primero.
- Usa Prettier y ESLint si están configurados.
- Para cambios visuales importantes, comprueba escritorio y móvil, las interacciones y los errores de consola.
- Prefiere playwright-brave con un perfil de automatización aislado. Usa playwright-opera-gx cuando corresponda comprobar compatibilidad. Si no están disponibles, indícalo.
- Después de corregir un error, repite las comprobaciones relevantes. Distingue lo probado de lo que no pudo comprobarse.

## Permisos y seguridad

- Solicita confirmación antes de modificar la cuenta de GitHub o el repositorio. Una autorización concreta cubre el trabajo descrito; no vuelvas a pedirla para ese mismo trabajo.
- No hagas commits, push, publicaciones ni operaciones destructivas sin autorización explícita.
- No modifiques configuraciones del sistema ni archivos fuera del proyecto sin autorización.
- No accedas a sesiones personales ni a datos sensibles sin autorización. Nunca incluyas contraseñas, tokens o secretos en el código.

## Estado actual y comandos

- La base usa TypeScript + Vite, sin framework de interfaz, y Vitest para pruebas. React sigue siendo una recomendación; no migres la interfaz por inercia.
- `src/main.ts` inicia la aplicación; `src/app/session.ts` contiene el reductor puro y `src/app/mount.ts` conecta el DOM. `src/app/persistence.ts` coordina estado confirmado, operaciones pendientes y reintentos; `src/storage/` valida y persiste. `src/ui/` contiene vistas y estilos. `src/game/` conserva lógica pura sin APIs de almacenamiento ni reloj real.
- `npm install` instala dependencias; `npm run dev` sirve la aplicación en http://127.0.0.1:5173.
- `npm run check` revisa TypeScript en src y tests; `npm test` ejecuta Vitest; `npm run build` revisa los tipos y compila; `npm run preview` sirve la compilación en http://127.0.0.1:4173.
- En PowerShell usa `npm.cmd` si la política de ejecución impide usar `npm.ps1`.
- Todavía no hay ESLint ni Prettier configurados. No afirmes haberlos ejecutado.
- M1 incorpora calendario, RNG serializable, tick diario, cumpleaños y contrato de interrupciones. M2 incorpora generación determinista de familias, habitantes, edificios y viviendas iniciales, inventario provisional, validación y proyecciones públicas sin potenciales ocultos. M3 conecta estos bloques a bienvenida, espacios, aldea, habitantes, fichas familiares, registro y controles de tiempo.
- M4 guarda las tres aldeas en IndexedDB (`aldea-viva`, versión 1, tabla `slots`). Nunca muestres «Guardado» antes de `transaction.oncomplete`. Ante fallo conserva el candidato pendiente y la última partida confirmada; reintentar no vuelve a simular. Reemplazar o borrar exige confirmación. Los datos incompatibles se conservan y bloquean esa ranura; un fallo global de lectura bloquea escrituras.
- El sobre de guardado versión 1 tiene UUID de escritura y revisión; comprueba ambos dentro de la transacción para evitar que otra pestaña sobrescriba progreso, incluso si se borró y recreó la ranura. La fecha de guardado y el UUID son metadatos externos a la simulación. No implementes migraciones inventadas ni sobreescribas formatos desconocidos.
- La interfaz usa las proyecciones públicas y escapa texto al crear HTML. La semilla automática se propone con crypto.getRandomValues fuera del motor; renderizar, filtrar y navegar no consumen el RNG de simulación.
- Para crear aldeas usa src/game/generation/village.ts; para alimentar fichas usa src/game/selectors/village.ts, no expongas el objeto interno Resident. Los parámetros provisionales están centralizados en src/game/rules/initialConfig.ts y documentados en el seguimiento.
- Consulta docs/07_SEGUIMIENTO_0_1.md para el estado de los hitos y convenciones del motor. La serialización de pruebas no constituye guardado persistente.
- `vite.config.mjs` usa base relativa y genera el service worker solo al compilar. Precarga únicamente archivos propios, sin partidas. `src/app/offline.ts` registra en producción y permite actualizar con un botón cuando no hay cambios pendientes. No actives actualizaciones automáticamente ni borres IndexedDB al cambiar cachés.
- Offline, actualización y subcarpeta se comprobaron en navegadores aislados. El usuario confirmó en Android con Brave inicio desde icono sin barra, orientación horizontal, cierre desde recientes y reapertura en modo avión con fecha exacta, e independencia de tres ranuras tras reabrir. Identifica esa evidencia como testimonio del usuario, sin extenderla a cierre forzado del sistema, reinicio ni todos los Android.
- `docs/08_ACEPTACION_0_1.md` contiene la auditoría del corte candidato, 186 pruebas y límites pendientes. E2E-03 (comparación completa entre PC y Android físico), la distribución permanente y el APK no están completados. No declares superada toda la auditoría ni crees etiquetas/commits/push sin la autorización correspondiente. La única exposición autorizada hasta ahora fue el enlace temporal de Cloudflare para pruebas; la herramienta y su registro están ignorados en `.tools.local/`.
