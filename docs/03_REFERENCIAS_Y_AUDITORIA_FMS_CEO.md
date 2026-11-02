# ALDEA VIVA — ANEXO DE REFERENCIAS, FMS CEO Y PROTOTIPOS ANTERIORES

**Fecha de auditoría local:** 2026-11-02  
**Propósito:** conservar aprendizajes técnicos de las referencias aportadas por el usuario sin contaminar las decisiones definitivas de Aldea Viva ni asumir licencias de reutilización de código.

> Este archivo se creó tras **inspeccionar el paquete disponible `FMS_CEO-main.zip`** y los archivos HTML de pruebas de Aldea Viva/NPC Arena. Los datos que se atribuyen al código se limitaron a lo verificable en esos archivos. La arquitectura propuesta en 0.1 es nueva. No consta que el código de FMS CEO sea libre de reutilizar: **NO copiarlo íntegramente ni distribuir assets/datos ajenos** sin comprobar derechos y autorización.

## 1. Inventario de referencia verificado

| Referencia | Se encuentra en la entrega | Qué contiene | Valor para Aldea Viva |
|---|---|---|---|
| `FMS_CEO-main.zip` | Sí, archivo ZIP original separado | Fuente FMS CEO, PWA y envoltorio Android | Ejemplo operativo de juego de gestión para móvil horizontal y offline |
| `README.md` | Sí, copia acompañante y en ZIP | Instrucciones de FMS CEO | Flujo de instalación, Android, GitHub Pages, exportaciones |
| `CHANGELOG.md` | Sí, copia acompañante y en ZIP | Historial de cambios FMS CEO | Disciplina de versiones, bugs y compatibilidad |
| `index.html` | Sí, copia fuera y dentro del ZIP | Aplicación FMS CEO de gran tamaño | Referencia de interfaz y flujo, **no** patrón de estructura para Aldea Viva |
| `main.js` | Sí, copia | Electron de escritorio | Empaquetado futuro, **no** requisito de 0.1 |
| `sw.js` | Sí, copia | Service worker básico | Offline y caché, con mejoras necesarias |
| `manifest.webmanifest.txt` | Sí, copia | Manifiesto PWA | Horizontal, pantalla completa e iconos |
| `FMS_CEO-main/android/...` | Sí, dentro del ZIP | Proyecto Android WebView | Referencia para APK futura, con revisión de seguridad y compatibilidad |
| `aldea_v01.html`–`aldea_v04.html` | Sí | Prototipos previos de Aldea Viva | Inspiración de paneles/ritmo, reglas obsoletas |
| `npc_arena_v01.html`–`npc_arena_v05.html` | Sí | Prototipos de NPC Arena | Inspiración marginal de resultados/combate, **no** diseño aprobado |
| `Aldea_Viva_Documento_Maestro*.md` | Sí | Síntesis corta del diseño | Contraste de decisiones, no sustituye Biblia nueva |

**Alcance del acceso:** los archivos anteriores están disponibles como material local aportado al proyecto. No se afirma que aquí estén todas las conversaciones históricas ni todos los archivos alguna vez mencionados. Los vínculos de procedencia se preservan por nombre, no por una URL inventada.

---

## 2. Hallazgos concretos en FMS CEO

### 2.1. Tres ranuras de guardado — patrón de experiencia [A]

En `FMS_CEO-main/index.html` aparecen las constantes `const SLOTS=[1,2,3]` y claves formadas como `fms_ceo_slot_...`. Hay funciones de lectura, escritura, metadatos, migración y selección de ranuras. Esto **confirma que el ejemplo aportado resuelve la experiencia de varias partidas** de manera concreta.

**Lección aplicable:** portada con tres tarjetas de partida que muestran estado/fecha y permiten crear, continuar, importar o borrar con confirmación.

**No copiar:** el mecanismo de almacenamiento subyacente, basado en `localStorage`, como arquitectura definitiva. Aldea Viva 0.1 debe preferir **IndexedDB**, con esquema, validación y transacciones. Las ranuras son una decisión independiente ya confirmada para Aldea Viva, no una importación de FMS CEO.

### 2.2. Guardado automático y escrituras diferidas [A]

FMS CEO incluye una función `save()` que marca guardado pendiente y programa `flushSave` con retraso, más `saveNow`. También tiene lectura/escritura de trozos de temporadas y funciones de compactación.

**Lección aplicable:** separar estado de partida, guardado, metadatos y UI; evitar escrituras demasiado frecuentes durante operaciones grandes.

**No copiar:** el debounce de 1500 ms como garantía suficiente de durabilidad. En Aldea Viva el botón «Guardado» solo deberá aparecer tras confirmar escritura; un avance o decisión importante debe persistir antes de ser tratado como definitivamente seguro. No confundir optimización de escritura con fiabilidad.

### 2.3. Exportación/importación [A/R]

El código FMS CEO contiene interfaz «Exportar partida», «Importar partida» y rutas correspondientes; su README explica transferencia de archivo entre navegador/equipos. En el código hay una rutina `exportGame()` y selección de archivo de importación.

**Lección aplicable:** permitir copia de seguridad manual cuando se necesite, particularmente útil al pasar de PWA a APK, a otro origen o a otro Android.

**Decisión en Aldea Viva:** exportar/importar es una **recomendación importante, no una de las 29 decisiones obligatorias**. Puede llegar al cierre de la 0.1 si el coste es razonable o en la siguiente entrega. No prometer que imposibilita revertir decisiones si el usuario conserva copias externas.

### 2.4. Manifest horizontal y experiencia instalable [A]

El archivo `FMS_CEO-main/manifest.webmanifest` incluye `display: "fullscreen"`, `orientation: "landscape"`, iconos 192/512 y color de interfaz. El README describe instalación desde Android Chrome e iPhone Safari.

**Lección aplicable:** preparar una PWA navegable en horizontal, pantalla de giro, iconos y modo de instalación. El atributo `orientation` no obliga a todos los navegadores a bloquear orientación. Debe probarse en teléfono real.

**Diferencia:** Aldea Viva puede usar `standalone` en vez de `fullscreen` si favorece accesibilidad y mantenimiento; elegir y probar, no seguir ciegamente.

### 2.5. Offline con service worker [A]

`FMS_CEO-main/sw.js` define una caché versionada, precachea documentos, manifiesto e iconos, y atiende peticiones `fetch` usando una política red primero/caché después. Su registro se observa en `index.html` al cargar por HTTP(S).

**Lección aplicable:** se puede distribuir una aplicación web de gestión offline después de instalar/cachear activos, sin servidor de simulación.

**Advertencias para Codex:** la política simplificada podría cachear recursos no deseados o mezclar versiones si se traslada sin control; un Vite moderno produce múltiples activos versionados. Preferir estrategia de PWA compatible con assets de build y probar actualizaciones. El SW nunca debe ser almacén de partidas ni borrar IndexedDB.

### 2.6. Android WebView/APK [A]

Dentro del ZIP hay un proyecto `android/` con `AndroidManifest.xml`, Gradle, recursos e `MainActivity.java`. El manifiesto declara orientación `sensorLandscape`; la Activity usa `WebView`, carga assets del juego y dispone de interfaz para operaciones de archivo, entre otros elementos.

**Lección aplicable:** un juego web local puede envolverse después en APK Android manteniendo una UI horizontal, pero debe someterse a pruebas de WebView, permisos, almacenamiento, pantallas con muescas, rendimiento y actualizaciones.

**NO hacer en 0.1:** copiar el proyecto Android de FMS CEO y cambiar el nombre del paquete. La aplicación web de Aldea Viva debe madurar antes. Además, los `JavascriptInterface` de WebView requieren auditoría cuidadosa de seguridad y origen del contenido.

### 2.7. Historial y gestión de versiones [A]

`CHANGELOG.md` contiene versiones sucesivas, arreglos de pantallas móviles, temporada, guardado y reglas de simulación. Es una referencia de cómo el juego de gestión evoluciona con **errores reales detectados tras uso continuado**.

**Lección aplicable:** cada versión Aldea Viva debe tener cambios, pruebas y regresiones; conservar partidas previas. El proyecto necesita release notes y etiquetas Git, no un `index.html` reemplazado a ciegas.

### 2.8. Gran archivo HTML y aleatoriedad no centralizada — anti-patrón para este proyecto [A]

La copia de `FMS_CEO-main/index.html` ocupa aproximadamente **7,4 MB** y contiene centenares de funciones; se observan numerosas llamadas a `Math.random()`. Es un juego con alcance muy distinto, y no estamos evaluando su calidad global, pero **para Aldea Viva esos patrones dificultarían el objetivo específico de reproducibilidad por semilla y mantenimiento gradual 0.1→1.0**.

**No copiar:** un único HTML con la mayoría de reglas, entidades, interfaz y guardado; RNG directo no inyectado en cada módulo. El diseño propuesto separa `game`, `storage`, `screens` y `tests` desde el principio.

**No afirmar:** que FMS CEO sea determinista/reproducible por semilla o que utilice IndexedDB. La auditoría muestra `Math.random()` y `localStorage`, no un contrato de semilla como el de Aldea Viva.

### 2.9. Electron para Windows [A]

`main.js` y `package.json` contienen un empaquetado Electron portable. Es útil como idea para distribución futura de escritorio, pero **el producto objetivo actual es Android**. No instalar Electron en la base 0.1 ni añadir costes de mantenimiento sin necesidad.

---

## 3. Relación de decisiones del usuario con antecedentes

| Necesidad en Aldea Viva | Ejemplo de referencia | Acción correcta |
|---|---|---|
| Tres partidas y menú claro | FMS CEO, `SLOTS=[1,2,3]` | Inspirar UX; implementación nueva IndexedDB |
| Guardado automático | FMS CEO, `save` y `flushSave` | Guardar al avanzar/decidir, confirmar éxito |
| Offline horizontal | Manifest + SW FMS CEO | Adaptar a Vite/PWA y probar Android |
| APK futuro | `android/` FMS CEO | Evaluar wrapper después, sin portar sin revisión |
| Descarga de copia de seguridad | Export/import FMS CEO | Recomendar para PWA→APK y protección del usuario |
| Porcentajes y resultados emocionantes | Estilo de manager de FMS CEO; petición del usuario | Probabilidades honestas, sin monetización |
| Menús y listas con muchos agentes | FMS CEO y HTML previos | Diseñar componentes y selectores claros |
| Simulación con calendario y decisiones | Prototipos Aldea Viva | Reconstruir desde 336 días, no adaptar calendario viejo |
| Gestión de profesiones | HTML antiguos con trabajos automáticos | **Rechazar** autoempleo: usuario eligió asignación inicial manual |
| Combates y NPC | NPC Arena previos | No importar reglas sin diseño aprobado |

---

## 4. Auditoría de los prototipos anteriores Aldea Viva

Archivos inspeccionados: `aldea_v01.html`, `aldea_v02.html`, `aldea_v03.html`, `aldea_v04.html`. En todos se observa lógica de juego en HTML con scripts embebidos; son experiencias anteriores, **no** la nueva versión 0.1 del proyecto actual.

### 4.1. Discrepancias verificadas

1. **Calendario anterior:** los cuatro contienen una función `season()` basada en segmentos de **30 días por estación** y años de **120 días**. Contradice el año confirmado de **336**. No copiar.
2. **Profesiones anteriores:** en varios aparecen opciones `Automático`, `Campo`, `Leña`, `Recolección`, `Descanso`, u otros oficios. Contradice la lista inicial de cuatro **agricultura, tala, construcción, combate** y el desempleo inicial manual. No copiar.
3. **Persistencia anterior:** uso directo de `localStorage`, sin el contrato de tres ranuras/IndexedDB/semilla persistente del nuevo diseño. No copiar como base.
4. **Personajes predefinidos:** algunos HTML contienen listas fijas con nombres/atributos/oficios, mientras que el nuevo inicio exige **15–20 personajes aleatorios, familias y potenciales independientes**.
5. **Economía y mortalidad prematuras:** scripts antiguos simulan hambre, frío, muertes o cosechas. Estos sistemas necesitan las nuevas reglas y corresponden a versiones posteriores. No mezclarlos en 0.1.

### 4.2. Elementos que SÍ sirven como referencia [A]

- Ideas visuales de HUD, lista, ficha y registro de sucesos.
- Sensación de progreso por avance de días y números que cambian.
- Necesidad de probar legibilidad en Android horizontal.
- Confirmación de que el usuario prefiere interacción rápida y visualizaciones de cifras.

**Regla general:** mirar el prototipo para saber **qué sensación** se busca, no para reutilizar **cómo calcula** el mundo.

---

## 5. NPC Arena v01–v05: contexto, no especificación

Hay cinco HTML `npc_arena_v01.html` a `npc_arena_v05.html`. Tratan una experiencia anterior de NPC/arena con resolución de combates/acciones y fueron aportados como contexto del proyecto. **No** hay decisión de portar sus reglas a la defensa de Aldea Viva.

**Potencial de inspiración futura:** resultados con momentos de tensión, porcentajes, progresión y narrativa emergente. **Límite:** en Aldea Viva se confirmó una defensa de puestos y decisiones tácticas de alto nivel, **sin** control golpe a golpe. Por ello no importaremos sistemas de arena en 0.6 de forma automática.

---

## 6. Aspectos legales y de originalidad

- Los archivos de FMS CEO contienen marcas y nombres de freestyle, y el README lo describe como proyecto de fans gratuito. No trasladar nombres, imágenes, logotipos, personajes ni datos a Aldea Viva.
- No se ha establecido aquí una licencia que autorice copia libre del código. Reutilizar **ideas generales de UX y arquitectura** es distinto de copiar código o recursos específicos.
- Si el usuario es titular de alguna parte del código, su autorización y procedencia pueden revisarse; no asumirlo automáticamente.
- Aldea Viva debe contar con **identidad, iconografía, diseño de interfaz, textos y reglas originales**, salvo usos con derechos confirmados.
- Tampoco trasladar el nombre/package ID `com.medster.fmsceo` al APK futuro.

---

## 7. Preguntas que puede responder la referencia sin añadir scope

**¿Se puede jugar desde Android horizontal y offline?** La referencia FMS CEO demuestra que el enfoque es viable; **Aldea Viva debe probar su propia implementación**.

**¿Se pueden tener varias partidas y exportarlas?** El ejemplo tiene las piezas; Aldea Viva puede hacer un sistema nuevo, más robusto y versionado.

**¿Debemos usar un único archivo HTML de varios MB?** No. El requisito de semilla y versiones escalonadas justifica módulos tipados y pruebas.

**¿Podemos usar código de FMS CEO directamente?** No sin comprobar titularidad/licencia y conveniencia técnica; por ahora solo se retienen patrones conceptuales.

**¿Debemos sacar APK el primer día?** No. Probar PWA Android primero reduce tiempo de iteración; empaquetar APK es una decisión posterior.

**¿Se puede importar la mecánica de NPC Arena?** No sin acordarla. El combate de Aldea Viva no es una arena con control individual.

---

## 8. Cómo usar este anexo con Codex

1. Si el usuario añade los archivos de referencia al repositorio, ubicarlos preferiblemente **fuera del árbol de compilación** y **solo si tiene derechos para incluirlos**; de otro modo bastan este anexo y acceso local por separado.
2. En una tarea específica como “PWA landscape”, Codex puede estudiar estructura de manifest y SW de FMS CEO para entender el patrón, después implementar versión original probada en Vite.
3. Para “tres ranuras de guardado”, estudiar la UX de FMS CEO, no su dependencia de `localStorage`.
4. Para “porcentajes y presentación”, estudiar ejemplos visuales sin reutilizar datos, eventos o guiones de freestyle.
5. Para “migrar prototipo Aldea Viva”, comprobar primero en la Biblia qué quedó obsoleto: calendario 120 vs 336 y autoempleo vs desempleo inicial.
6. Ante dudas que involucren nueva regla de juego, remitirse a las decisiones confirmadas y dejar PENDIENTE el resto; no tomar al código antiguo como autoridad.

## 9. Registro breve de evidencias verificables

- `FMS_CEO-main/index.html`: cadena `const SLOTS=[1,2,3]`, funciones `slotKey`, `readSlot`, `writeSlot`, `migrateSlots`, `save`, `flushSave`, `exportGame`.
- `FMS_CEO-main/manifest.webmanifest`: campos `orientation: landscape`, `display: fullscreen`, iconos.
- `FMS_CEO-main/sw.js`: identificador `CACHE`, precache, control `install`/`activate`/`fetch`.
- `FMS_CEO-main/android/app/src/main/AndroidManifest.xml`: `android:screenOrientation="sensorLandscape"`.
- `FMS_CEO-main/android/app/src/main/java/com/medster/fmsceo/MainActivity.java`: WebView, almacenamiento web habilitado, puente de archivos.
- `FMS_CEO-main/package.json`: Electron y herramientas de build para Windows.
- `aldea_v01.html`–`aldea_v04.html`: función `season()` con `%120` y `/30`, profesión `Auto` y similares, `localStorage`.

Este inventario **no sustituye inspeccionar el código original** si hay que implementar algo concreto; sirve para que la memoria de la conversación sobreviva a una migración sin atribuir detalles inexistentes.

**Fin del anexo.**
