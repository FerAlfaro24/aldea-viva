# Aldea Viva

Juego de simulación de aldeas, pensado primero para Android.

## Base del proyecto

- TypeScript + Vite.
- Desarrollo local con VS Code y Codex.
- Base técnica preparada; mecánicas de la versión 0.1 pendientes.

Consulta las reglas acordadas y la hoja de ruta en el [documento maestro de diseño](docs/Aldea_Viva_Documento_Maestro.md).

## Requisitos

- Node.js 20.19 o superior en la rama 20, o Node.js 22.12 o superior.
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
npm run build
npm run preview
```

- `check` revisa los tipos de TypeScript.
- `build` revisa TypeScript y genera la versión de producción en `dist/`.
- `preview` sirve la compilación en http://127.0.0.1:4173.

No hay pruebas automatizadas de las mecánicas, ESLint ni Prettier configurados todavía.

## Organización

- `src/main.ts`: punto de entrada.
- `src/ui/`: interfaz; por ahora, pantalla inicial.
- `src/style.css`: estilos adaptables.
- `public/`: recursos estáticos.
- `docs/`: diseño del juego.

La simulación y la persistencia se añadirán como módulos separados cuando se implemente la versión 0.1.

## Estado actual

La pantalla inicial muestra la presentación del juego y permite abrir «Acerca del juego» con ratón, teclado o controles táctiles.

Todavía no permite crear aldeas, avanzar el calendario ni guardar partidas. El funcionamiento sin conexión, la instalación y el empaquetado APK también están pendientes.
