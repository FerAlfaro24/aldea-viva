# Publicación de pruebas en Cloudflare Pages

Publicación solicitada por el usuario. El repositorio GitHub conserva su visibilidad privada; se alojan públicamente los activos compilados del juego, no los documentos ni las partidas locales del navegador.

**Dirección pública:** https://aldea-viva.pages.dev/. Proyecto `aldea-viva`, creado y desplegado con éxito desde `main`. Comprobados acceso público, fundación y avance de un día. Los siguientes cambios subidos a esa rama activan nuevas compilaciones.

## Configuración

| Campo | Valor |
|---|---|
| Repositorio | `FerAlfaro24/aldea-viva` |
| Rama de producción | `main` |
| Framework preset | `None` — Vite se ejecuta mediante el script del proyecto |
| Directorio raíz | Raíz del repositorio |
| Comando de compilación | `npm run build` |
| Directorio de salida | `dist` |
| Node.js | `22.23.4`, fijado en `.node-version` |
| Functions, bindings y secretos | No necesarios para esta aplicación estática |

Cloudflare instala las dependencias y compila el repositorio. La integración Git permite nuevas publicaciones al subir cambios a `main`; la dirección pública efectiva se obtiene al completar la creación del proyecto. El contenido se aloja en Cloudflare, por lo que no depende de que el PC permanezca encendido.

`public/_headers` obliga a revalidar HTML y evita guardar una copia obsoleta de `sw.js` en cachés HTTP. Los activos con hash se pueden conservar a largo plazo. El service worker sigue gestionando la disponibilidad offline y la activación manual de nuevas versiones.

Pages redirige `/index.html` a `/`. El service worker normaliza la respuesta HTML almacenada cuando procede de una redirección, porque devolverla directamente en una navegación puede provocar `ERR_FAILED`. Comprobadas recarga y recarga offline en Brave con esa redirección reproducida localmente; verificar también el despliegue actualizado.

Para comprobar la compilación local sin sustituir `dist/`, que en este entorno conserva una versión anterior del teléfono:

```sh
npm run build -- --outDir dist-1-0.local
```

La corrección AV-UX-001 forma parte de esta publicación: no se anuncia una crisis de salud en una aldea sana. No se modifican las fórmulas económicas ni el funcionamiento de los guardados.

## Aceptación del despliegue

Antes de considerar terminada la publicación: confirmar éxito en Cloudflare, abrir la URL HTTPS asignada en un perfil limpio, crear una partida, avanzar, recargar y recuperar; comprobar los encabezados y el modo sin conexión preparado. No confundir preparar estos archivos con haber publicado: la sesión de Cloudflare y el permiso de acceso de GitHub deben estar completados y el despliegue debe verificarse.

Las partidas de `localhost` y del túnel anterior no aparecen automáticamente en el dominio nuevo: cada origen conserva sus propios datos. Las IA necesitan un navegador interactivo para jugar; una herramienta que solo recupera texto puede no ejecutar la aplicación aunque la web esté disponible.

## Referencia oficial

- [Integración Git de Pages](https://developers.cloudflare.com/pages/get-started/git-integration/).
- [Imagen de compilación y versión de Node](https://developers.cloudflare.com/pages/configuration/build-image/).
- [Encabezados de Pages](https://developers.cloudflare.com/pages/configuration/headers/).
