# ALDEA VIVA — PAQUETE DE TRANSFERENCIA A OTRA CONVERSACIÓN

**Fecha:** 2026-11-02  
**Finalidad:** conservar el diseño completo y permitir que otra conversación con ChatGPT/Codex continúe el desarrollo sin rehacer decisiones ni adoptar reglas de prototipos anteriores.

## Orden obligatorio de lectura

1. **`docs/01_BIBLIA_DE_DISENO_0_1_A_1_0.md`** — visión completa y registro desarrollado de las 29 decisiones, alcance de versiones 0.1 a 1.0, límites y contradicciones conocidas. Es la memoria del proyecto.
2. **`docs/02_ESPECIFICACION_EJECUTABLE_0_1.md`** — el documento de trabajo para **programar ya**: arquitectura recomendada, modelos, calendario formal, generación de familias, guardado, Android, cinco entregas, más de 60 comprobaciones y aceptación.
3. **`docs/03_REFERENCIAS_Y_AUDITORIA_FMS_CEO.md`** — material que sí se comprobó en el ZIP FMS CEO y los HTML antiguos; qué inspira y qué NO debe importarse.
4. **`docs/04_PROMPT_DE_CONTINUIDAD_PARA_CODEX.md`** — encargo listo para copiar a la nueva conversación o a Codex.
5. **`docs/05_DECISIONES_Y_PENDIENTES_RAPIDOS.md`** — índice ultrarrápido para evitar contradicciones.
6. **`docs/06_PLAN_DE_VERSIONES_0_1_A_1_0.md`** — hoja de ruta extendida, contratos, pruebas y límites de cada versión hasta la 1.0.
7. **`referencias/Aldea_Viva_Documento_Maestro_original.md`** — copia de compendio anterior, útil para contraste pero menos detallado.

## Advertencias que deben sobrevivir a la migración

- Proyecto nuevo desde cero: **no** continuar técnicamente los viejos `aldea_v01`–`v04` por la similitud de nombre.
- Calendario definitivo **12×28=336 días**, estaciones de 84 días.
- **15–20 habitantes**, familias y **2–3 niños preferentes**, todos los adultos desempleados inicialmente.
- Talento **específico por oficio y oculto**; cuatro profesiones originales, no nuevos trabajos por inercia.
- Inicio con vivienda familiar automática, pero **3 casas × 5 = 15 camas** vs hasta 20 personas: pendiente de balance, no ocultar.
- Madera del bosque infinita durante 1.0; **almacén con capacidad compartida** comida+madera.
- Guardado automático **tres ranuras**; offline; sin recargas retroactivas en UI.
- No nacimientos ni personalidad compleja en 1.0.
- La **0.1 no simula todavía cosechas, hambre, muerte, combate ni construcción**. Debe construir el núcleo que permitirá todo lo posterior.
- FMS CEO es **referencia**, no base de código ni licencia asumida.

## Estado real del trabajo

Estos documentos **no acreditan que la versión 0.1 se haya programado o probado**. No se ha verificado en esta entrega el contenido de un repositorio GitHub que esté modificándose en otra conversación. La nueva conversación debe **inspeccionar el repo real antes de inicializar, sobrescribir o crear archivos**. Estas guías son compatibles con avanzar desde un repositorio existente.

## Cómo usarlo en GitHub

Copiar los archivos `docs/*.md` a `docs/` del repositorio de Aldea Viva y este `LEEME_PRIMERO.md` al raíz (o como `docs/README.md`). Mantener el ZIP FMS CEO separado salvo confirmación de titularidad/licencia. Añadir cuestiones de balance a Issues, no resolverlas sin consulta.

## Qué debe hacer Codex primero

**M0: inspeccionar el repositorio y dar un plan concreto de 0.1.** Después **M1: construir calendario 336 días, RNG y tick diario con pruebas**. No comenzar por diseño gráfico, combate o economía si eso desplaza el núcleo. Avanzar en cambios pequeños, comprobables y guardables.

## Nota de transparencia sobre fuentes

La reconstrucción integra la conversación disponible, el resumen fiel de las 29 decisiones y los archivos locales examinados. **No constituye una transcripción literal de todo lo hablado en sesiones no disponibles**, ni atribuye al usuario constantes técnicas no confirmadas. Los documentos distinguen `[C]` confirmado, `[R]` recomendación, `[P]` pendiente, `[D]` diferido y `[A]` antecedente.
