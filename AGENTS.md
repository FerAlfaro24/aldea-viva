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
- El documento maestro de diseño está en docs/Aldea_Viva_Documento_Maestro.md y es la referencia para las mecánicas. Léelo antes de implementarlas. Distingue las reglas confirmadas de los parámetros propuestos o pendientes de balance y no inventes decisiones.
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

- La base usa TypeScript + Vite, sin framework de interfaz. Las únicas dependencias de desarrollo son TypeScript y Vite.
- `src/main.ts` inicia la aplicación, `src/ui/` contiene la interfaz y `src/style.css` sus estilos. Crea módulos separados para simulación y persistencia cuando se autoricen esas mecánicas.
- `npm install` instala dependencias; `npm run dev` sirve la aplicación en http://127.0.0.1:5173.
- `npm run check` revisa TypeScript; `npm run build` revisa los tipos y compila; `npm run preview` sirve la compilación en http://127.0.0.1:4173.
- En PowerShell usa `npm.cmd` si la política de ejecución impide usar `npm.ps1`.
- Todavía no hay ESLint, Prettier ni pruebas automatizadas de mecánicas configurados. No afirmes haberlos ejecutado.
- Hay una pantalla inicial adaptable con un desplegable informativo accesible. Calendario, generación de habitantes, semilla, avance del tiempo y guardado siguen pendientes para la versión 0.1.
- El funcionamiento sin conexión, la instalación y el empaquetado APK aún no están implementados.
