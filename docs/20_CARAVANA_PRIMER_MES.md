# Caravana — diseño del primer mes

Fecha: 3 de noviembre de 2026.

Estado: dirección de diseño aceptada por el usuario. Primera semana de siete días implementada en una rama separada; los días 8–28 siguen pendientes. Este documento recoge la propuesta de la conversación; los valores de equilibrio y detalles señalados como provisionales se ajustarán jugando.

## 1. Objetivo y conservación

La experiencia anterior resulta difícil de entender: demasiados habitantes, menús y sistemas disponibles desde el inicio. El nuevo comienzo debe permitir comprender qué ocurre, decidir algo concreto y observar su consecuencia cada día.

- Rama de trabajo: `feature/caravana`, desde el commit `7122907` de `main` (rc.3).
- Conservar el código, documentos y sistemas de aldea. Recuperarlos conforme tenga sentido, sin mostrarlos todos al inicio.
- Reutilizar TypeScript, Vite, interfaz adaptable, calendario y funcionamiento sin conexión cuando encajen. Evaluar la reutilización del guardado sin forzar el modelo de aldea sobre la caravana.
- Crear partidas propias de caravana. Conservar las antiguas sin conversión ni sobrescritura automática.
- No cambiar `main` ni la publicación pública en esta preparación.

## 2. Base del comienzo

- Una caravana queda varada porque se han roto sus ruedas.
- Hay tres acompañantes adultos gestionables y un protagonista no jugable.
- Prioridades iniciales: comida y defensa. El descanso y la recuperación producen decisiones sobre cómo repartir el trabajo.
- La caravana es un refugio precario; hay utensilios y herramientas básicos y una pequeña reserva inicial para aprender.
- Se avanza exclusivamente de un día en un día. No hay botones para saltar semanas o meses.
- El primer mes tiene 28 días, coherente con el calendario de 336 días por año.
- No incorporar nuevos habitantes durante este primer mes.

Meta propuesta del mes: convertir el lugar del accidente en un campamento capaz de mantenerse. Reparar las ruedas y decidir el siguiente destino queda para una etapa posterior, sin introducir todavía toda la aldea.

## 3. Pantalla principal: Campamento

El jugador debe poder tomar las decisiones diarias desde una sola pantalla, Android primero y horizontal, con la identidad oscura existente.

### Estado visible

- Día y tiempo atmosférico.
- Raciones listas y cuántos días completos cubren.
- Ingredientes pendientes de preparación.
- Materiales para arreglos y mejoras.
- Protección expresada con palabras y una explicación accesible.
- Una sola prioridad contextual: problema, motivo y posible siguiente acción.

Propuesta provisional: el protagonista también come, por lo que habría cuatro bocas. Mostrar siempre a cuántas personas cubren las reservas; no asumir este valor en fórmulas sin hacerlo explícito al implementar.

### Tres tarjetas de personaje

Nombre, estado comprensible (salud y cansancio), aptitud útil y tarea de hoy. Botón directo para cambiarla. Los detalles se abren desde la tarjeta y no son necesarios para completar un día.

No hay profesiones permanentes al principio: se asigna una tarea diaria. No mostrar potenciales ocultos como información conocida.

### Plan antes de avanzar

Resumir quién hará cada cosa, qué se espera conseguir y el principal riesgo. Advertir si falta una tarea o si comer depende del resultado incierto de la jornada. Permitir decisiones arriesgadas informadas.

Botón principal: «Comenzar el día». Conservar asignaciones para evitar repetir acciones, pero pedir que el jugador inicie cada nueva jornada.

## 4. Tareas iniciales

| Tarea | Beneficio | Coste o riesgo |
| --- | --- | --- |
| Recolectar | Alimentos directamente comestibles | Menor rendimiento esperado que una buena cacería y generalmente menos peligro |
| Cazar | Carne para preparar | Mayor recompensa posible, heridas y resultados insuficientes |
| Cocinar | Transforma ingredientes y mejora su aprovechamiento | Requiere ingredientes; no crea comida de la nada |
| Vigilar | Reduce el peligro y las consecuencias de amenazas al campamento | Esa persona no produce comida ni materiales |
| Recoger materiales | Permite arreglos y mejoras | Renuncia a producción alimentaria o protección ese día |
| Descansar | Recupera cansancio y heridas leves | Menor aportación inmediata al campamento |

Mostrar resultados esperados y peligros según la información disponible. Distinguir previsión de garantía. Cazar, cocinar y vigilar no debe ser siempre el reparto óptimo.

Descansar y las tareas básicas no se bloquean artificialmente para enseñar su existencia. Las tareas de mejoras aparecen cuando el proyecto correspondiente está disponible.

## 5. Comida y resolución de un día

Dos estados de comida: raciones listas e ingredientes. Recolectar puede aportar raciones; cazar aporta carne pendiente de preparación. El cocinero puede utilizar lo obtenido por el cazador ese mismo día.

No añadir caducidad ni dietas en el primer bloque. Cantidades iniciales, rendimientos, capacidad de cocina y probabilidades son valores de equilibrio pendientes.

Orden de resolución propuesto:

1. Realizar tareas y obtener recursos, con sus resultados y riesgos.
2. Cocinar con los ingredientes disponibles, incluidos los obtenidos hoy.
3. Presentar un acontecimiento cuando corresponda; detenerse si exige una elección.
4. Consumir las raciones y resolver la noche, incluida la defensa.
5. Mostrar el resumen y permitir pasar a la mañana siguiente.

Separar los riesgos de una salida del peligro del campamento. Resolver un acontecimiento pendiente no debe repetir tareas, consumos ni tiradas. Las decisiones deben poder conservarse al cerrar y recuperar la partida, respetando las garantías útiles del guardado existente.

No convertir día y noche en dos repartos obligatorios de tareas en el primer bloque.

## 6. Acontecimientos y consecuencias

- Como máximo una elección importante por jornada; también hay días tranquilos.
- Alternar amenazas, oportunidades, hallazgos, viajeros y escenas entre compañeros.
- Mostrar costes seguros antes de elegir y explicar lo incierto sin prometer resultados.
- Relacionar algunos acontecimientos con decisiones anteriores.
- La vigilancia reduce riesgos; no implica invulnerabilidad ni evita el peligro de cazar.
- Evitar que una sola mala tirada inicial condene inevitablemente la partida.

Ejemplo ilustrativo, no evento ya implementado: al descubrir siluetas cerca del camino, mostrar preparación defensiva, ofrecer una cantidad visible de provisiones o evitar el contacto, con consecuencias acordes a la situación.

Las heridas, reservas y cansancio deben cambiar el plan del día siguiente, sin producir un ciclo permanente de escasez inevitable.

## 7. Resumen diario

Dar un relato breve con nombres y causas: qué consiguió cada persona, qué se cocinó, qué se consumió y qué sucedió por la noche. Mostrar el saldo final de reservas y una necesidad relevante para mañana.

Ejemplo ilustrativo: «Lucía consiguió carne; Inés preparó ocho raciones; el grupo consumió cuatro. Reservas: 5 → 9. Bruno necesita descansar».

No presentar veinte mensajes rutinarios ni esconder pérdidas importantes en un total. Botón: «Ir a la mañana siguiente».

## 8. Navegación y mejoras

| Acceso | Contenido |
| --- | --- |
| Campamento | Estado, personajes, reparto y avance diario |
| Mejoras | Pocas obras con coste, trabajo previsto y beneficio explícitos |
| Diario | Acontecimientos, descubrimientos y objetivos |
| Opciones | Guardado y carga; ajustes disponibles, sin botones de funciones inexistentes |

Abrir personas y reservas desde sus indicadores. No exponer economía, profesiones, expansión ni gestión de edificios de aldea en el comienzo.

Mejoras propuestas: arreglar el refugio, preparar una cocina de campamento, crear un puesto de vigilancia y acondicionar un lugar de descanso. Cada una responde a una necesidad visible, requiere materiales y trabajo de un personaje. No se consideran todas construidas ni desbloqueadas al comenzar. La protección pasiva no sustituye completamente al vigilante.

## 9. Progresión del mes

| Etapa orientativa | Experiencia buscada |
| --- | --- |
| Primeros días | Comprender comida, tareas y resumen; conseguir una primera victoria pequeña |
| Primera semana | Aprender a cambiar el reparto para vigilar o recuperarse |
| Segunda semana | Crear reservas y completar una primera mejora |
| Tercera semana | Afrontar oportunidades y consecuencias con varias respuestas posibles |
| Última semana | Mantener el campamento y decidir su siguiente prioridad |

Son objetivos de ritmo, no fechas obligatorias ni desbloqueos ciegos por día. Abrir contenido por acontecimientos y logros comprensibles. Las expediciones y el siguiente destino son posibilidades posteriores; no forman parte del primer bloque.

Ayuda propuesta: «Sugerir reparto», explicando el motivo antes de aplicar. No tomar decisiones manuales por el jugador ni reasignar personas sin su confirmación.

## 10. Orden de desarrollo

1. Tres días completos: pantalla, tres adultos, reparto, comida, cocina, descanso, peligro comprensible, resumen y recuperación de la partida. Sin intentar escribir todo el mes.
2. Probar claridad y ganas de continuar. Ajustar antes de ampliar.
3. Extender a siete días, con una mejora útil y variedad de situaciones.
4. Completar el mes de 28 días, sus desbloqueos y consecuencias.

Verificación proporcionada: pruebas relevantes de resolución diaria y guardado al implementar; interfaz en Brave aislado de escritorio y móvil al cerrar cada bloque visual. No hace falta ejecutar pruebas de software para esta preparación documental.

El primer objetivo de aceptación es entender un día y querer jugar el siguiente. El del mes es conocer a los compañeros, saber mantenerlos y recordar decisiones que hicieron distinta la partida.

## 11. Primer bloque implementado

- Entrada de caravana con Lucía (caza), Bruno (vigilancia) e Inés (cocina). Tres adultos y protagonista no jugable; cuatro raciones diarias en total.
- Seis tareas, asignación explícita y sugerencia revisable antes de aplicarla. Las órdenes se conservan entre jornadas; no existe avance de varios días.
- Inicio provisional con ocho raciones. Recolección aporta 2–3; caza aporta 2–4 ingredientes más uno con Lucía. En este bloque la caza siempre obtiene algo, pero puede herir (18 % con Lucía, 30 % con los demás). Se reduce el rendimiento con cansancio alto. No confundir estos valores con el equilibrio definitivo del mes.
- Cocina hasta tres ingredientes por persona: dos raciones por ingrediente o tres con Inés. Utiliza la carne de hoy. Descanso recupera hasta 18 de salud y reduce hasta 45 de cansancio. No se implementaron fallecimientos en este bloque.
- Día 1: noche tranquila. Día 2: lobos; ahuyentarlos con probabilidades visibles según vigilancia o gastar dos raciones para evitar heridas. Día 3: escoger entre un hallazgo con cansancio adicional o recuperar fuerzas. Son escenas de aprendizaje del prototipo, no una regla de eventos diarios para todo el mes.
- Resumen con causas, cantidades y consumo. Diario y Opciones. Reiniciar requiere confirmación y reemplaza solo la caravana.
- Guardado separado, validado y confirmado antes de aplicar cada cambio; protege formatos desconocidos y detecta otras pestañas. Un error permite guardar el mismo resultado pendiente sin volver a simular.
- El juego de aldea se conserva en `?modo=aldea`; no se convierten partidas antiguas. Solo aparecen las opciones implementadas de caravana, sin acceso de Mejoras vacío.
- Código nuevo en `src/caravan/`, entrada en `src/main.ts`, pruebas en `tests/caravan/caravan.test.ts`. Sin dependencias nuevas.

Comprobaciones: 15 pruebas pertinentes aprobadas y compilación con TypeScript correcta. Recorridos en Brave aislado de los tres días, ambas respuestas a lobos y hallazgo, cambio manual de tareas, reinicio confirmado/cancelado, recuperación de decisión pendiente y recarga sin conexión. Se provocó un fallo de escritura y se comprobó el reintento sin duplicar la jornada. Interfaz revisada en escritorio y móvil emulado; sin prueba física de Android. No se repitió la integración larga de la aldea.

Pendiente: valorar la claridad y diversión con el usuario; equilibrar y ampliar a siete días con una primera mejora antes de completar los 28. No hubo commit, push ni despliegue de este bloque.

## 12. Ampliación a la primera semana

El usuario valoró positivamente los tres días y autorizó perfeccionar la semana con refugio, lluvia, reacciones y un cierre.

- Día 4: se descubre Mejoras y la tarea «Reforzar el refugio». Coste único de 4 materiales y 2 jornadas de trabajo, visibles antes de avanzar. Recoger materiales y construir se pueden coordinar el mismo día; dos trabajadores pueden aportar las dos jornadas.
- Días 5–6: lluvia anunciada. Sin refugio terminado añade 14 de cansancio por noche. Terminado evita esa penalización y reduce hasta 6 de cansancio por noche, incluso seca. No sustituye la vigilancia. Las cifras son provisionales.
- Día 6: nueva amenaza de lobos anunciada el día anterior; resolverla no repite las tareas ni la noche. Sigue habiendo días sin una decisión extraordinaria.
- Día 7: cierre con noches alimentados, reservas, refugio, noches protegidas de la lluvia e historia de decisiones. No se habilita un octavo día.
- Reacciones breves asociadas a heridas, descanso, hambre, lluvia y finalización del techo. Las obras completadas no reasignan personas automáticamente: se indica que deben escoger otra tarea.
- Guardados v1 del prototipo anterior se leen sin escribir y continúan al día 4; el siguiente cambio confirmado guarda v2. Revisiones, identidad, comida, registro y azar se conservan. Formatos desconocidos siguen protegidos.
- Código ampliado en `src/caravan/` y pruebas en `tests/caravan/`. Mismo origen local 4177; sin dependencias nuevas. El usuario autorizó guardar y subir esta primera semana a `feature/caravana` en GitHub para continuar allí. Sin fusión con `main` ni cambios a la web pública.

Comprobaciones del bloque: 26 pruebas pertinentes, TypeScript y compilación. Una semana completa jugada en Brave aislado, con construcción parcial y terminada antes de la lluvia; recuperación sin conexión de la decisión del día 6. Verificación de una caravana v1 terminada, continuada al día 4 con las mismas 14 raciones. Revisión visual de Mejoras en escritorio y campamento en móvil horizontal emulado; sin errores de ejecución observados ni desbordamiento horizontal. No probado en Android físico ni repetida la integración larga de aldea.

Pendiente: valoración del usuario sobre la semana y ajustes de equilibrio antes de ampliar el mes.
