# Aldea Viva 1.0 — Documentación completa de lo implementado

**Corte documentado:** `1.0.0-rc.2`, candidata a la versión 1.0.

**Fecha del corte:** 2 de noviembre de 2026.

**Repositorio:** [FerAlfaro24/aldea-viva](https://github.com/FerAlfaro24/aldea-viva), privado.

**Publicación de pruebas posterior al corte:** https://aldea-viva.pages.dev/. Configuración y estado en [Publicación en Pages](docs/17_PUBLICACION_PAGES.md); no equivale a aceptación final en Android.

**Objetivo:** explicar el juego que existe ahora, sus reglas, funcionamiento, código, comprobaciones y pendientes en un único archivo.

Este documento describe la implementación actual. No convierte las propuestas históricas en funciones terminadas. Los valores de equilibrio siguen siendo ajustables y la aceptación física de esta candidata en Android está pendiente. Subir el código a GitHub no publica una web, no genera una APK ni convierte automáticamente la candidata en una versión final aprobada.

## Índice

1. [Qué es el juego](#1-qué-es-el-juego)
2. [Estado y alcance](#2-estado-y-alcance)
3. [Pantallas y controles](#3-pantallas-y-controles)
4. [Cómo empieza una partida](#4-cómo-empieza-una-partida)
5. [Tiempo, calendario y azar](#5-tiempo-calendario-y-azar)
6. [Habitantes y familias](#6-habitantes-y-familias)
7. [Viviendas](#7-viviendas)
8. [Oficios y órdenes](#8-oficios-y-órdenes)
9. [Aprendizaje, atributos y talentos](#9-aprendizaje-atributos-y-talentos)
10. [Solares, construcción y ampliación](#10-solares-construcción-y-ampliación)
11. [Conservación, reparación y derrumbes](#11-conservación-reparación-y-derrumbes)
12. [Recursos, producción y almacén](#12-recursos-producción-y-almacén)
13. [Alimentación y prioridades](#13-alimentación-y-prioridades)
14. [Invierno, hambre, salud y mortalidad](#14-invierno-hambre-salud-y-mortalidad)
15. [Defensa y bandoleros](#15-defensa-y-bandoleros)
16. [Sucesos y visitantes](#16-sucesos-y-visitantes)
17. [Crónica y final de partida](#17-crónica-y-final-de-partida)
18. [Guardado, errores y compatibilidad](#18-guardado-errores-y-compatibilidad)
19. [Interfaz, Android y funcionamiento sin conexión](#19-interfaz-android-y-funcionamiento-sin-conexión)
20. [Guía práctica de inicio](#20-guía-práctica-de-inicio)
21. [Arquitectura y archivos](#21-arquitectura-y-archivos)
22. [Ejecutar y comprobar el proyecto](#22-ejecutar-y-comprobar-el-proyecto)
23. [Pruebas realizadas](#23-pruebas-realizadas)
24. [Límites, pendientes y funciones ausentes](#24-límites-pendientes-y-funciones-ausentes)
25. [Historia de versiones y continuidad](#25-historia-de-versiones-y-continuidad)

## 1. Qué es el juego

Aldea Viva es un juego de gestión y supervivencia de una comunidad medieval pequeña. El jugador decide quién trabaja, dónde vive cada persona, qué construir, qué reparar, cómo repartir comida y cómo responder a oportunidades o amenazas. La historia surge de los habitantes, sus familias y las consecuencias de esas decisiones.

El tiempo solo avanza al pulsar los controles correspondientes. No hay progreso por estar conectado ni simulación en segundo plano cuando se cierra el juego. No hay una victoria convencional obligatoria: se puede continuar mientras quede alguien vivo.

Los habitantes se simulan mediante datos, reglas y azar reproducible. **No hay un modelo de lenguaje conectado, conversaciones generadas por IA, un servidor de NPC ni una API externa de inteligencia artificial en la partida.** La individualidad actual procede de edades, parentescos, atributos, habilidades, potenciales, salud y experiencias.

## 2. Estado y alcance

La candidata incorpora los sistemas desarrollados desde la 0.1 hasta la 0.7 y el trabajo de integración de la 1.0:

- Familias y habitantes generados por semilla.
- Calendario visual, cumpleaños y estaciones.
- Viviendas y traslado manual.
- Cuatro oficios con destinos y aprendizaje.
- Construcción efectiva, mantenimiento, solares y una ampliación de grado.
- Producción, consumo, raciones, prioridades y almacenamiento compartido.
- Hambre, frío, enfermedad, heridas, incapacidades, rescates excepcionales y muerte permanente.
- Bandoleros, indicios y decisiones defensivas con porcentajes calculados.
- Oportunidades de trabajo, descubrimiento gradual de talentos y visitantes muy raros.
- Crónica filtrada y paginada, fichas históricas y memorial final.
- Tres ranuras, guardado local transaccional y compatibilidad con formatos anteriores.
- PWA sin conexión después de preparar su caché, interfaz horizontal adaptable y tema oscuro.
- Guía opcional y primeros pasos según el estado real de la aldea.

Es una aplicación web local instalable cuando el navegador y el contexto lo permiten. Todavía no se ha entregado una APK de esta candidata ni un alojamiento permanente nuevo.

## 3. Pantallas y controles

| Pantalla | Qué permite hacer o consultar |
|---|---|
| Inicio | Entrar a las aldeas, volver a una partida activa y abrir «Cómo jugar». |
| Tus aldeas | Ver tres espacios, crear, continuar, reemplazar o borrar una aldea; ver espacios protegidos por incompatibilidad. |
| Aldea | Fecha, grado, población viva, camas, reservas, edificios, familias y primeros pasos contextuales. |
| Edificios | Inspeccionar solares y construcciones, mover moradores, preparar/pausar/reanudar/cancelar obras, autorizar mantenimiento y ampliar. |
| Habitantes | Buscar y filtrar personas, comparar información visible y abrir fichas. |
| Ficha individual | Edad, cumpleaños, salud, hambre, vivienda, trabajo, habilidades, XP, atributos, parentescos, pistas, talentos e historia médica/personal. |
| Oficios | Menús separados de agricultura, tala, construcción y combate; asignar personas y destinos disponibles. |
| Economía | Previsión de producción y consumo, reservas, raciones, prioridades, capacidad y reparto/balances diarios. |
| Salud | Situación de supervivencia, indicios de invierno, refugio, conservación, incapacidades, fallecidos y avisos recientes. |
| Defensa | Puestos y guerreros aptos, amenazas conocidas, tácticas disponibles, riesgos y resultados de asaltos. |
| Sucesos | Decisiones pendientes, visitantes, descubrimientos de talento y oportunidades resueltas. |
| Calendario | Mes de 28 días, navegación entre meses, cumpleaños y sucesos por fecha; volver a hoy. |
| Registro | Crónica por persona, familia, año, estación y tipo; páginas de 25 entradas. |
| Ayuda | Guía opcional de seis apartados, accesible incluso sin haber fundado una aldea. |

Los botones de tiempo avanzan **1, 7 o 28 días**. Se deshabilitan durante una decisión pendiente o después de extinguirse la población. Los errores de almacenamiento muestran acciones específicas de recuperación.

Los filtros de habitantes incluyen búsqueda, familia, vivienda/sin vivienda, grupo de edad, oficio, vivos/fallecidos/todos y orden por nombre o edad. La búsqueda tolera diferencias de mayúsculas y acentos.

## 4. Cómo empieza una partida

Las aldeas nuevas utilizan la configuración `housing-20-v1`. La generación de familias sigue identificada como `families-v1`.

| Elemento | Situación inicial actual |
|---|---|
| Fecha | Año 1, mes 1, día 1: comienzo de primavera. |
| Grado | 1. |
| Población | 15–20 habitantes. |
| Menores iniciales | Preferencia de 2–3 niños, generados entre 0 y 11 años. |
| Edades adultas de generación | 18–76 años. |
| Oficios | Todos sin asignar. |
| Salud / hambre | 100 / 0. |
| Casas | Cuatro, de cinco camas: 20 camas en total. |
| Huertos | Dos, con dos plazas de agricultor cada uno. |
| Almacén | Uno, con capacidad compartida de 600 unidades. |
| Solares | Diez: siete ocupados y tres libres. |
| Comida | Sorteo entre 180 y 220 unidades. |
| Madera | Sorteo entre 80 y 100 unidades. |
| Conservación | Edificios iniciales al 100. |

Se generan hogares de progenitores con hijos, parejas, hermanos y personas solas, con nombres, apellidos y relaciones recíprocas. Las diferencias de edad de progenitores e hijos se ajustan a la configuración de generación: intervalo previsto de 18–45 años, con margen por cumpleaños.

Las partidas antiguas con `provisional-v1` conservan sus **tres casas y 15 camas**. Cargarlas no añade una cuarta casa, no cambia sus habitantes ni vuelve a sortear recursos.

La semilla se puede introducir al fundar o dejar vacía para elegir una. Una misma semilla y configuración recrean el mismo comienzo; las decisiones posteriores pueden cambiar el desarrollo.

## 5. Tiempo, calendario y azar

### 5.1 Calendario

- Año de 336 días: 12 meses de 28 días.
- Cuatro estaciones de 84 días.
- Primavera: días del año 1–84; verano: 85–168; otoño: 169–252; invierno: 253–336.
- El motor almacena días transcurridos; el día inicial tiene valor interno 0.
- Los cumpleaños actualizan la edad derivada y registran las edades que habilitan oficios, sin contratar a nadie.
- Consultar una fecha o una ficha no avanza tiempo.

### 5.2 Orden de un día completo

1. Avanzar calendario y registrar cumpleaños/cambios de estación o año.
2. Preparar clima, deterioro, avisos y posibles derrumbes.
3. Ejecutar trabajo, obras, mantenimiento y práctica.
4. Calcular producción, entregas, necesidades y reparto de comida.
5. Resolver hambre, frío, recuperación, enfermedad y mortalidad.
6. Comprobar amenazas y llegadas de bandoleros.
7. Comprobar sucesos contextuales y descubrimientos.
8. Validar el estado resultante y devolver el día procesado.

Un avance largo procesa días individuales. Si aparece una decisión en el noveno día, no procesa el décimo hasta resolverla y pedir un nuevo avance. También se detiene al terminar un día con determinados avisos de supervivencia, deterioro, invierno o amenazas. Esos avisos no son todos decisiones: algunos permiten continuar después de revisar la situación.

### 5.3 Azar reproducible

Se conserva un RNG versionado, `xorshift32-fnv1a-utf16le-v1`, con semilla y estado. El motor no usa el azar global del navegador. Los sorteos enteros evitan favorecer resultados por una reducción modular sesgada.

Mismo estado, elección y RNG producen el mismo resultado. Renderizar, filtrar o consultar no consume sorteos. Reintentar una escritura fallida guarda el candidato ya calculado, sin repetir la simulación.

## 6. Habitantes y familias

Cada habitante mantiene un ID estable, nombre, familia, edad inicial, cumpleaños, condición vital, oficio/destino, atributos, habilidades, parentescos, pistas y origen. Puede incorporar historial médico, secuelas, fecha de llegada y descubrimientos.

Los parentescos incluyen progenitores, hijos, hermanos y pareja. Las relaciones usan IDs y se conservan tras fallecimientos. El juego no mezcla «familia» con «casa»: miembros de una familia pueden vivir en viviendas diferentes si el espacio o una orden lo requieren.

### 6.1 Atributos y habilidades

Cinco atributos generales, en escala 0–100:

- Fuerza.
- Resistencia.
- Agilidad.
- Destreza.
- Vitalidad.

Cada uno de los cuatro oficios mantiene habilidad efectiva, mejor dominio histórico, XP y potencial específico oculto. Salud y hambre son estados separados: vitalidad no significa salud actual.

En la generación actual, atributos adultos se sortean entre 20 y 75, habilidades iniciales entre 0 y 40 y potenciales entre 10 y 95. Los niños tienen rangos reducidos escalados por edad. Estos rangos son configuración de balance, no una promesa de que toda persona alcance un nivel concreto.

### 6.2 Aptitud física

La capacidad física utilizada por varios sistemas es:

```text
capacidad = salud / 100 × (1 − hambre / 200) × capacidad permanente
```

La capacidad permanente vale 1 si no hay secuela. Estar vivo no garantiza poder trabajar: también se comprueban salud positiva, plazo de incapacidad, enfermedad activa y capacidad permanente mayor que cero.

### 6.3 Edad y vejez

No hay jubilación obligatoria. Desde los 60 años se deterioran gradualmente fuerza, resistencia, agilidad y vitalidad, con una tasa modulada por edad y vitalidad. La experiencia se conserva. La fragilidad ante el frío aumenta en niños y mayores.

No existe una causa independiente de muerte natural por vejez en esta candidata. Las causas simuladas actualmente son hambre, frío, combinación de ambos, combate y accidente de tarea.

## 7. Viviendas

La distribución inicial prioriza familias y menores y aprovecha camas reales sin inventar capacidad. Un traslado manual afecta a la persona elegida, comprueba plazas y deja la asignación marcada como orden del jugador y protegida.

- No se reorganizan hogares para mejorar una distribución por iniciativa del motor.
- Una vivienda deteriorada puede seguir asignada, aunque deje de proteger del frío.
- Repararla restaura su utilidad sin cambiar los moradores.
- Un derrumbe desaloja a sus ocupantes y libera el solar, sin buscarles automáticamente otra casa.
- Al morir una persona se libera su cama.
- Los visitantes aceptados ocupan únicamente camas libres de casas utilizables; los habitantes anteriores no se desplazan.

El estado «sin refugio utilizable» incluye tanto a personas sin casa como a quienes tienen asignada una vivienda inutilizable.

## 8. Oficios y órdenes

| Oficio | Edad mínima | Destino | Resultado principal |
|---|---:|---|---|
| Agricultura | 12 | Huerto concreto; plazas limitadas | Alimentos estacionales. |
| Construcción | 14 | Flexible o tarea exclusiva autorizada | Obras y reparaciones. |
| Tala | 15 | Bosque | Madera; bosque ilimitado en esta versión. |
| Combate | 16 | Guardia de aldea o bosque | Práctica, detección y defensa. |

El primer nombramiento siempre es manual. Cambiar un oficio conserva las habilidades anteriores. Una orden registra persona, profesión, destino, origen, protección manual, autorización y estado activo o en conflicto.

### 8.1 Agricultura y tala

El agricultor permanece en el huerto asignado hasta una nueva orden. No se exceden sus dos puestos actuales. Si el huerto queda inutilizable, la orden entra en conflicto; reparar puede devolverle utilidad sin mover al agricultor.

El leñador trabaja en el bosque sin asignación a un edificio. La madera natural no se agota, pero recolectarla exige trabajo y almacenarla exige espacio.

### 8.2 Constructores

Un constructor flexible atiende solo tareas autorizadas, por este orden:

1. Mantenimiento de prioridad alta.
2. Obras no pausadas.
3. Mantenimiento de prioridad normal.

Un constructor exclusivo no se desvía a otro encargo. Cada tarea admite hasta tres constructores en la jornada. Cada persona practica como máximo un oficio por día de trabajo.

Terminar/cancelar una obra, revocar un mantenimiento o perder el destino deja una orden exclusiva en conflicto. No convierte a la persona en otro oficio ni la asigna a otro edificio por su cuenta.

### 8.3 Guerreros

Dos plazas en la aldea y dos en el bosque. La muralla todavía no es un edificio disponible y no se ofrece un puesto ficticio de muralla. Los incapacitados conservan sus órdenes y no participan en combate.

## 9. Aprendizaje, atributos y talentos

### 9.1 Práctica diaria

La XP diaria se calcula aproximadamente como:

```text
XP = redondear((4 + potencial × 0,24) × factor de edad), mínimo 1
```

Factor de edad: 1 antes de 45 años, 0,9 desde 45 y 0,8 desde 60. La habilidad mejora en XP / 100, con recuperación ×2 mientras está por debajo de su mejor dominio histórico. El techo respeta el mayor entre potencial y mejor dominio histórico.

La XP acumulada se limita a un millón. Los atributos pertinentes ganan XP ×0,0002 por jornada, hasta 100:

| Oficio | Atributos practicados |
|---|---|
| Agricultura | Resistencia y destreza. |
| Tala | Fuerza y resistencia. |
| Construcción | Fuerza y destreza. |
| Combate | Fuerza, agilidad y resistencia. |

Habilidades con experiencia que no se practican pierden 0,001 puntos al día, sin borrar XP ni su mejor marca. El deterioro físico desde los 60 años usa `(edad − 59) × 0,0001 × (1 − vitalidad / 200)` por día, aplicado a los atributos físicos indicados anteriormente.

### 9.2 Pistas y revelación

Las primeras impresiones se derivan de atributos y potenciales, sin mostrar la cifra. Por ejemplo, las señales de aprendizaje requieren potencial del oficio ≥70 y un atributo asociado ≥45; constitución/manos hábiles aparecen con fuerza/destreza ≥65.

Los descubrimientos posteriores requieren práctica real reciente, no abrir una ficha:

| Etapa | Requisitos actuales | Información pública |
|---|---|---|
| Prometedor | Potencial ≥70, XP ≥400, habilidad ≥30 y aumento reciente de experiencia | Aptitud prometedora; límite aún desconocido. |
| Confirmado | Señal previa, XP ≥1500, habilidad ≥50 y nueva experiencia | Potencial numérico conocido del oficio. |

El potencial sigue guardado internamente antes de descubrirlo porque el motor lo necesita. Es un secreto de interfaz, no un dato cifrado. Sucesos, fichas y crónica solo lo revelan según esas etapas.

## 10. Solares, construcción y ampliación

Solo hay tres tipos de edificio construible en esta candidata:

| Edificio | Madera | Trabajo requerido | Capacidad al terminar |
|---|---:|---:|---|
| Casa | 30 | 60 | Cinco camas. |
| Huerto | 20 | 40 | Dos puestos. |
| Almacén | 40 | 80 | 600 unidades compartidas. |

El trabajo requerido no equivale a un número fijo de días. El esfuerzo individual es el entero redondeado de `(3 + habilidad ×0,08 + media de atributos ×0,04) × capacidad física`, con mínimo 1 para trabajadores aptos.

Preparar una obra reserva su madera y ocupa el encargo del solar. Al comenzar el trabajo se consumen los materiales una sola vez. Pausar conserva progreso y estado; reanudar no cobra de nuevo. Cancelar antes de comenzar libera la reserva; después de comenzar no devuelve madera y pierde el progreso de esa obra.

El edificio se crea al completar el trabajo, con ID estable y conservación 100. Una casa recién construida está vacía: no redistribuye familias.

### Ampliación de grado 1 a 2

Requiere simultáneamente:

- Al menos 15 habitantes vivos.
- Al menos 150 alimentos almacenados, que no se consumen al ampliar.
- Todos los edificios en pie al 80 % de conservación o más.
- 50 maderas disponibles fuera de reservas de obra; estas sí se consumen.

Desbloquea cuatro solares: el total pasa de diez a catorce. Solo está implementado este paso de grado, una vez. No hay una cadena ilimitada de niveles ni mejoras generales de todos los edificios.

## 11. Conservación, reparación y derrumbes

Cada edificio mantiene conservación de 0 a 100. El desgaste base es 0,02 por día. En invierno se multiplica por 1,25 / 1,5 / 2 para invierno suave / normal / duro.

Hay avisos al cruzar los niveles 70, 40, 20 y 10. Con conservación **≤20** el edificio es inutilizable. Siete días en cero provocan derrumbe. Daños de ataques pueden acelerar ese proceso.

### Reparación

Requiere autorización de mantenimiento, constructor y madera libre. Cada constructor que repara consume una madera por jornada y recupera `esfuerzo ×0,5` de conservación, hasta 100.

El reparto flexible solo considera reparación desde conservación 95 o menos; evita gastar una madera diaria en centésimas de desgaste. Un constructor exclusivo puede reparar antes. La reserva mínima configurada para mantenimiento automático protege madera frente al reparto flexible; las órdenes exclusivas pueden utilizar esa reserva mínima. Las reservas de obras siguen respetándose.

### Efectos de inoperancia y derrumbe

- Casa inutilizable: no protege del frío, pero conserva la asignación de sus moradores.
- Huerto inutilizable: no produce y su destino laboral queda en conflicto.
- Almacén inutilizable: no aporta plazas para nuevas entregas, pero conserva la capacidad física de existencias hasta derrumbarse.
- Derrumbe: libera el solar, conserva la entidad como ruina histórica y deja de contar como edificio en pie.
- Si cae una casa, se avisa del desalojo.
- Si cae un almacén, se conserva lo que quepa en el resto de capacidad: primero madera reservada, luego alimentos y después madera libre.
- Si faltan materiales para sostener reservas, se cancelan obras sin iniciar desde la más reciente. No se devuelve madera que ya no existe.

## 12. Recursos, producción y almacén

Los recursos actuales son **alimentos y madera**. Se representan con dos decimales; repartos y comprobaciones de conservación de cantidades usan centésimas enteras.

### 12.1 Producción

Solo producen personas aptas con orden activa y autorizada. Las fórmulas actuales son:

```text
capacidad = salud/100 × (1 − hambre/200) × capacidad permanente
factor de edad laboral = mínimo(1, edad/18)

alimentos de agricultor =
  (3 + habilidad agrícola×0,06 + media(resistencia,destreza)×0,025)
  × factor estacional × conservación del huerto/100
  × capacidad × factor de edad laboral

madera de leñador =
  (2 + habilidad de tala×0,04 + media(fuerza,resistencia)×0,02)
  × capacidad × factor de edad laboral
```

Se redondea en centésimas. El rendimiento agrícola estacional es:

| Estación | Multiplicador |
|---|---|
| Primavera | Aumenta linealmente de 0,7 a 1. |
| Verano | 1,5. |
| Otoño | Disminuye linealmente de 1,2 a 0,5. |
| Invierno | 0,03: casi nulo. |

### 12.2 Capacidad compartida

Comida y madera compiten por las mismas plazas. Capacidad física y capacidad habilitada para entregas pueden diferir si hay almacenes inutilizables.

Una entrega guarda solo lo que cabe y registra lo rechazado. Por ejemplo, una entrega de 15 con espacio para 10 guarda 10 y rechaza 5. No se recupera automáticamente lo rechazado después de que los habitantes coman.

Se puede elegir entregar primero alimentos o madera. Esa prioridad afecta a nuevas entregas; no elimina madera existente ni reemplaza existencias por comida. Las entregas se procesan después del trabajo de construcción y antes del consumo diario.

Los balances registran producción, admitido/rechazado, solicitado/consumido/faltante, madera gastada en trabajo y existencias iniciales/finales. Pérdidas o ganancias de ataques/sucesos fuera del proceso diario quedan registradas por separado, para no inventar un balance de producción.

## 13. Alimentación y prioridades

### 13.1 Necesidad normal

| Edad | Necesidad base diaria |
|---|---:|
| Menor de 6 | 0,45. |
| 6–11 | 0,65. |
| 12–17 | 0,85. |
| 18–59 | 1. |
| 60 o más | 0,9. |

La actividad activa y apta multiplica por 1,1 en agricultura, 1,15 en construcción/combate y 1,2 en tala. Salud reducida multiplica por `1 + (100 − salud)/500`. La necesidad diaria tiene una variación aleatoria entera de −5 % a +5 %, sorteada en orden estable por ID.

### 13.2 Ración

| Política | Multiplicador sobre necesidad normal |
|---|---:|
| Abundante | 1,25. |
| Normal | 1. |
| Reducida | 0,8. |
| Emergencia | 0,6. |

La ración determina lo solicitado. **Servir toda una ración reducida no cubre la necesidad normal:** el hambre puede aumentar aunque el reparto no marque faltante respecto a esa ración.

### 13.3 Reparto escaso

Prioridades disponibles: equilibrada, menores, trabajadores o casas señaladas. Los preferentes pesan 2 y el resto 1. El reparto es proporcional ponderado, limitado a lo solicitado, con restos de centésimas y desempate rotativo por día; no utiliza azar adicional.

La política por defecto es normal, equilibrada y alimentos primero en entregas. El juego no cambia automáticamente esa política.

### 13.4 Previsiones

Economía muestra rangos de consumo para el próximo día y producción orientativa con los puestos actuales. Los días de reserva significan cuánto duraría la comida **sin nuevas cosechas**, no una predicción garantizada de cuándo se agotará en una simulación futura.

## 14. Invierno, hambre, salud y mortalidad

### 14.1 Invierno e indicios

La severidad se genera y conserva al llegar el otoño: suave 20 %, normal 60 %, duro 20 %. El indicio es correcto un 70 %, incierto un 20 % y erróneo un 10 %. En otoño solo se muestra la señal anunciada; la severidad real se revela al comenzar el invierno.

Cargar una partida anterior en pleno invierno no inventa sucesos históricos ni aplica daños atrasados. El clima necesario se prepara en un nuevo avance.

### 14.2 Hambre

La cobertura es comida servida / necesidad normal. Si es suficiente —umbral 0,995— el hambre baja 3 puntos diarios, más cuatro veces el exceso relativo. Si es insuficiente, sube `(1 − cobertura) ×5`, entre 0 y 100.

El daño de hambre comienza por encima de 35 y asciende linealmente hasta 2,5 de salud por día al alcanzar 100. Comer suficiente permite recuperarse, sin borrar de golpe todo el hambre acumulada.

### 14.3 Frío y recuperación

Frío base diario sin protección: suave 0,6; normal 1,1; duro 1,7. Se modifica por protección y fragilidad.

Una casa utilizable protege en proporción `(conservación −20)/80`. Sin casa utilizable la protección es cero. La fragilidad aumenta en menores de 12 y desde los 60, y se modera por vitalidad.

La recuperación base es 0,35 de salud al día con cobertura suficiente y hambre menor de 40. El exceso de alimento añade recuperación —exceso relativo ×0,8—. No se supera salud 100.

### 14.4 Enfermedad, heridas e incapacidad

Salud menor de 60 combinada con hambre alta o frío perjudicial puede causar enfermedad, con reposo inicial de 7–28 días. Vencido el plazo, solo se recupera la aptitud si salud ≥60 y hambre <30; si no, se prolonga siete días.

Heridas de combate y accidentes generan sus episodios y plazos. La persona conserva el oficio, pero no trabaja ni practica durante la incapacidad. Un plazo cumplido no garantiza recuperación si persisten las malas condiciones.

Estados de aviso: estable, con hambre, debilitado y crítico, calculados con los valores reales de salud/hambre.

### 14.5 Rescate excepcional

En una crisis de supervivencia mortal, con hambre menor de 60 y sin rescate previo, existe un 3 % de rescate. No es una resurrección de alguien ya muerto ni se aplica como salvación general a las muertes de combate/accidente.

Deja salud 1, estabilización de siete días, incapacidad de 120–672 días y capacidad física permanente del 50 % o 75 %. Las habilidades y la identidad se conservan.

### 14.6 Muerte permanente

Al morir, la persona deja de trabajar y consumir, se libera su cama y su puesto, se conserva último oficio y causa de muerte, y continúa en familia e historia. La ficha muestra su edad congelada en la fecha de fallecimiento.

No hay reemplazo automático. Perder edificios, comida o todos los adultos no activa por sí solo el final: solo la ausencia de personas vivas.

## 15. Defensa y bandoleros

### 15.1 Frecuencia y aviso

La primera jornada que activa defensa deja un margen de 28 días antes de la primera comprobación. Después se comprueba cada 28–56 días; cada comprobación tiene un 45 % de generar amenaza. **No es un 45 % de ataque por día.**

Atacantes: de `2 + grado` a `4 + grado×2`; en grado 1 son 3–6 y en grado 2 son 4–8. Su fuerza total es número de atacantes por un factor sorteado entre 16 y 24.

Detección anticipada: 40 % base más 20 puntos por guardia apto del bosque, máximo 90 %. Un aviso prevé llegada en 2–4 días; si no se detecta, el asalto sorprende. No se muestra una fecha ficticia del próximo sorteo.

Durante los indicios se pueden cambiar órdenes. Al llegar el ataque, se guarda una decisión y se fijan tiempo y gestión; se permite consultar pantallas. Resolver no añade otro día.

### 15.2 Fuerza y porcentajes

```text
fuerza individual =
  (10 + combate×0,6 + media(fuerza,agilidad,resistencia)×0,4)
  × capacidad física × factor del puesto
```

Factor de bosque: 1,2 para salida, 0,85 en otras tácticas. Factor de aldea: 1,2 al proteger almacén, 1 en otras tácticas. La base civil suma `10 + vivos×0,7` antes de aplicar el multiplicador táctico al conjunto.

Éxito de combate: fuerza propia / fuerza total, redondeado, mínimo 5 % y máximo 95 %. Negociación: 65 más hasta 20 puntos según esa relación de fuerzas, con el límite implementado en el selector. Se muestran los porcentajes que utiliza la resolución, no una etiqueta arbitraria de dificultad.

### 15.3 Tácticas

| Táctica | Fuerza táctica | Robo al perder | Condición/contexto |
|---|---:|---:|---|
| Defender la aldea | ×1 | ×1 | Respuesta general. |
| Proteger almacén | ×0,9, antes del bono por puesto | ×0,45 | Necesita almacén utilizable; mayor exposición de guardias. |
| Negociar | Fórmula propia | ×0,8 | Necesita tributo completo de comida y madera libre. |
| Salida | ×1,2, además del bono de bosque | ×1,3 | Necesita al menos un guerrero apto; más riesgo personal. |

Tributo: cuatro alimentos y dos maderas por atacante. Se entrega al intentarlo, aunque el enemigo incumpla. Si acepta, no hay robo adicional, heridas ni daño a edificios.

### 15.4 Consecuencias

Victoria no negociada: robo aleatorio de 0–5 % de existencias. Derrota: 15–40 %, multiplicado por la táctica, después de pagar cualquier tributo. El robo puede alcanzar madera reservada; si no alcanza para las reservas, se cancelan proyectos sin iniciar desde el más reciente.

| Táctica | Lesión o muerte por guerrero si gana / pierde | Muerte entre los afectados si gana / pierde |
|---|---:|---:|
| Defensa | 12 % / 35 % | 2 % / 8 % |
| Almacén | 15 % / 45 % | 3 % / 10 % |
| Negociación | 0 % / 25 % | 0 % / 5 % |
| Salida | 25 % / 60 % | 5 % / 18 % |

La UI combina ambas ramas según la probabilidad real de ganar y aclara que la muerte está incluida en el primer porcentaje. En una derrota distinta de salida, un civil al azar queda expuesto adicionalmente: 60 % de lesión o muerte y 6 % de morir. La salida no sortea esa víctima civil adicional.

Herida superviviente: pérdida de 10–35 de salud tras victoria o 25–65 tras derrota, con mínimo 1 de salud, y reposo al menos 7–42 días. Daños a un edificio en pie al azar: 20 % de probabilidad tras victoria no negociada y 75 % tras derrota, con pérdida de 3–10 o 12–32 de conservación, limitada por su estado actual.

Los participantes reciben 80 XP adicionales si la táctica tiene éxito y 40 si falla, respetando el techo de habilidad. La crónica conserva bajas, heridos, pérdidas, tributo y edificio afectado. No hay inventario de armas ni control golpe por golpe.

## 16. Sucesos y visitantes

### 16.1 Ritmo y contexto

Primera comprobación a los 14 días de activarse el sistema en una nueva jornada; después, cada 7–14 días. Hay un 75 % de considerar una oportunidad cuando existe contexto elegible. No se cumple una cuota forzosa de decisiones: la orientación de 1–3 al mes depende de trabajo, estación y situación.

Las amenazas defensivas tienen prioridad. No se solapan decisiones nuevas con un asalto ni con una amenaza ya conocida. Los sucesos se guardan antes de mostrar la elección.

### 16.2 Catálogo actual

- **Ensayo de huerto:** agricultor apto fuera del invierno, con alimentos para invertir.
- **Ruta difícil del bosque:** leñador apto con salud suficiente y comida para el intento.
- **Reparación urgente:** edificio en pie con conservación ≤40, madera libre suficiente y constructor compatible con esa tarea —flexible o asignado a ese edificio—.
- **Visitantes:** individuo o familia generados como candidatura excepcional.
- **Aprendizaje menor:** mejora de 20 XP durante una jornada que realmente aumentó experiencia; se registra automáticamente y no pausa por una decisión.

### 16.3 Riesgo graduado

Ensayo y ruta ofrecen dejar pasar, intento prudente o intento arriesgado:

| Opción | Comida invertida | Recompensa si tiene éxito | XP éxito / fracaso | Afectado al fallar | Muerte entre afectados |
|---|---:|---:|---:|---:|---:|
| Dejar pasar | 0 | 0 | 0 / 0 | 0 | 0 |
| Prudente | 3 | 8 alimentos o maderas | 120 / 60 | 5 % | 0 % |
| Arriesgado | 6 | 20 alimentos o maderas | 300 / 160 | 25 % | 2 % |

Éxito: base 60 para prudente o 35 para arriesgado, más habilidad del oficio ×0,25 y destreza ×0,1, redondeado y limitado a 10–95 %. Los porcentajes de lesión y muerte visibles incluyen la probabilidad de fracaso.

El fracaso consume la inversión. Las recompensas obedecen a capacidad de almacén y registran excedentes rechazados. Una herida resta hasta 10–35 de salud sin elevar la salud de alguien ya muy débil, conserva una reserva de salud y requiere reposo inicial de 7–28 días. La muerte por accidente es permanente.

Reparación urgente ofrece dos alternativas: apuntalar —dos maderas, +4 conservación y 60 XP— o reforzar —cinco maderas, +12 conservación y 120 XP—. No se cobra madera reservada para otra obra. El límite de conservación es 100.

### 16.4 Visitantes

Cada comprobación tiene un 1 % de oportunidad de visitantes y hay al menos 336 días entre ofertas. No es una probabilidad diaria ni una reacción automática a una baja.

La candidatura incluye personas, familia, relaciones y datos ya generados. Cerrar/reabrir no crea otro grupo. Se acepta o rechaza completo; la pantalla anuncia población adicional, camas libres y cuántas personas quedarían sin vivienda.

Al aceptar:

- Se incorporan IDs nuevos y relaciones conservadas.
- Todos llegan sin oficio.
- Solo se asignan camas libres de casas utilizables, sin mover órdenes previas.
- Se pueden aceptar personas aun cuando no haya cama para todas, con el aviso correspondiente.
- Comen a partir del próximo día simulado.
- Su edad inicial se interpreta en la fecha de llegada, no en la fundación; cumpleaños y genealogía se mantienen coherentes en aldeas antiguas.

Al rechazar no cambia la población ni se consume tributo. La decisión queda en la historia. No hay nacimientos ni un sistema de reclutamiento periódico garantizado.

## 17. Crónica y final de partida

La crónica se genera a partir de hechos del motor: fundación, cumpleaños, estaciones, órdenes, obras, reparaciones, balances, clima, deterioro, salud, heridas, muertes, ataques, decisiones, llegadas y descubrimientos.

Permite filtrar por persona, familia, año, estación y categoría. «Historias y decisiones» omite balances diarios, reparaciones rutinarias y aprendizajes menores; «Todo» los incluye y «Balances económicos» permite examinarlos aparte. Se muestran 25 entradas por página, no toda la historia en el DOM.

Las fichas contienen las últimas 40 entradas relacionadas y acceso a toda su historia filtrada. Asaltos nuevos conservan participantes aunque no resulten heridos; los registros antiguos no inventan IDs que no se guardaron en su momento.

Al fallecer la última persona se conserva duración, nombres, obras terminadas, asaltos, llegadas y descubrimientos registrados. El tiempo y las órdenes de gestión se bloquean, pero se puede navegar, filtrar y usar otras ranuras. No existe derrota automática por quedarse con menores, ancianos, pobreza o ruinas.

## 18. Guardado, errores y compatibilidad

### 18.1 Tres espacios locales

IndexedDB utiliza la base `aldea-viva`, versión física 1, con almacén `slots` identificado por ranura 1, 2 o 3. Cada espacio conserva su último estado; no hay una lista de puntos anteriores para deshacer derrotas o muertes.

El sobre contiene UUID, formato, versión de esquema, versión de juego, fecha, ranura, revisión y mundo completo. El mundo incluye RNG, crónica y decisiones pendientes, además de los sistemas que la partida tenga activados.

### 18.2 Confirmación y fallos

Una escritura se confirma al completar la transacción, no solo al aceptar una solicitud individual. La aplicación conserva el estado confirmado y un candidato pendiente. Si falla, muestra el error y mantiene la última partida confirmada.

«Reintentar» escribe el mismo candidato, UUID, revisión y resultado. No vuelve a tirar dados ni repite muertes o producción. «Descartar cambio pendiente y releer» abandona el candidato no confirmado y vuelve a cargar lo almacenado.

Se comprueban revisión y UUID esperados para detectar cambios de otra sesión. Formatos desconocidos, referencias incoherentes o ranuras incompatibles se protegen en vez de sobrescribirse silenciosamente. Reemplazar o borrar una aldea exige la confirmación correspondiente en la interfaz.

### 18.3 Esquemas

| Esquema | Capacidades que fueron incorporándose |
|---:|---|
| 1 | Fundación, habitantes, calendario y guardado original. |
| 2 | Vivienda/configuración posterior y traslados. |
| 3 | Preparación y estado inicial de proyectos de obra. |
| 4 | Mantenimiento y ampliación. |
| 5 | Órdenes de oficio, trabajo y construcción efectiva. |
| 6 | Economía y cantidades en centésimas. |
| 7 | Supervivencia, clima, medicina, derrumbes y final. |
| 8 | Defensa, amenazas y consecuencias de combate. |
| 9 | Sucesos, talentos, accidentes, visitantes y fechas de llegada. |

El lector actual admite v1–v9 y el escritor usa v9 con versión de juego `1.0.0-rc.2`. Los esquemas antiguos se mantienen estrictos. Leer no escribe una migración, no regenera el mundo ni aplica daños atrasados: un guardado posterior utiliza el formato actual conservando sus datos compatibles.

### 18.4 Límites del almacenamiento

Las partidas pertenecen al origen y perfil del navegador. Un móvil, otro navegador, otro dominio o puerto pueden tener otros guardados. PWA y una futura APK no compartirían automáticamente almacenamiento.

El sistema operativo o el usuario pueden borrar datos del sitio; el juego no promete persistencia absoluta. **No hay interfaz de exportación/importación, copias en la nube ni sincronización entre dispositivos en esta candidata.** Subir el proyecto a GitHub conserva el código, no las partidas locales del navegador.

## 19. Interfaz, Android y funcionamiento sin conexión

### 19.1 Tema oscuro

Se cambió el aspecto por petición del usuario para reducir el brillo:

- Fondo verde carbón `#151b19`.
- Paneles `#1e2723` y superficies elevadas diferenciadas.
- Texto principal suave `#d5dccf` y secundario `#a4b2a3`.
- Acentos de verde apagado y ámbar, sin grandes superficies blancas.
- Formularios, diálogos, avisos, calendario, selección y barras adaptados al esquema oscuro.
- Indicadores en tarjetas, navegación activa diferenciada, botones menos brillantes y texto auxiliar algo mayor.
- Colores de arranque y barra del navegador/PWA oscuros.

La paleta vive en variables CSS; es el tema por defecto, sin un selector de temas implementado. Se conserva la tipografía de sistema para lectura y Georgia para títulos, y el carácter visual de bosque de la marca.

### 19.2 Adaptabilidad y accesibilidad

Diseño pensado para Android horizontal, con controles táctiles grandes, navegación horizontal desplazable en pantallas estrechas, formularios adaptables, indicadores de foco y salto al contenido. La guía usa secciones plegables y no obliga a completar un tutorial.

El manifiesto solicita orientación horizontal y visualización independiente al instalar. El comportamiento final depende del navegador/dispositivo: la candidata actual aún necesita validación física del usuario.

### 19.3 PWA y actualizaciones

La compilación genera un service worker con activos propios precargados y versión de caché derivada de su contenido. Tras aparecer «Disponible sin conexión», la aplicación se puede reabrir sin red en el mismo contexto preparado.

Una actualización disponible se activa con «Actualizar aplicación». La aplicación no la aplica mientras un guardado pendiente impida recargar con seguridad. El proceso actualiza archivos de aplicación y no borra IndexedDB.

No hay una dependencia de internet para simular una jornada o resolver una decisión una vez cargada/preparada la aplicación. Se necesita una primera carga adecuada y un contexto compatible con service workers —por ejemplo HTTPS o localhost—.

## 20. Guía práctica de inicio

1. Funda una aldea y conoce edades, habilidades y familias antes de asignar oficios.
2. Ocupa las plazas de los huertos y compara producción con consumo.
3. Asigna tala y construcción según tus planes. Preparar una obra no basta: necesita constructores trabajando.
4. Planea más huertos y almacenes con tiempo. Un almacén inicial de 600 no basta por sí solo para guardar un invierno completo de una aldea grande.
5. Autoriza mantenimiento y conserva madera libre; evita que la tala llene el espacio que necesitas para alimentos.
6. Prepara guardias y revisa señales del otoño y los caminos.
7. Usa avances pequeños cuando las reservas o la salud estén comprometidas.
8. Lee las probabilidades de sucesos y ataques. Aprende de las consecuencias registradas.
9. Antes de aceptar visitantes, revisa camas y capacidad alimentaria.
10. Espera la confirmación de guardado y comprueba el modo sin conexión en el dispositivo donde jugarás.

No es una secuencia automática ni una estrategia garantizada. Las preferencias de oficio, ración, riesgo y expansión siguen siendo del jugador. El balance observado permite intervenciones viables, pero los peligros y las decisiones importan.

## 21. Arquitectura y archivos

### 21.1 Tecnologías actuales

| Componente | Tecnología del proyecto |
|---|---|
| Lenguaje | TypeScript. |
| Herramienta web | Vite. |
| UI | HTML/CSS y montaje directo, sin framework de interfaz. |
| Gestor | npm. |
| Validación de guardados | Zod. |
| Pruebas | Vitest. |
| IndexedDB de pruebas | fake-indexeddb. |
| Guardado real | IndexedDB del navegador. |
| Instalación/offline | Manifiesto PWA y service worker. |

Las versiones exactas quedan fijadas por `package-lock.json`; `package.json` identifica actualmente `1.0.0-rc.2`. No se han añadido React, un servidor, una base de datos remota ni dependencias para un sistema de IA.

### 21.2 Separación de responsabilidades

```text
src/game/models       Contratos de datos del mundo y sus sistemas
src/game/rules        Calendario, configuración y parámetros de equilibrio
src/game/generation   RNG de generación, familias, habitantes, viviendas y visitantes
src/game/core         Calendario, simulación diaria, economía, salud, defensa y sucesos
src/game/commands     Órdenes explícitas del jugador y resolución de decisiones
src/game/selectors    Datos derivados y proyecciones públicas para las vistas
src/game/validation   Invariantes de mundo, economía, salud, defensa y sucesos
src/storage           Esquemas, repositorio y transacciones IndexedDB
src/app               Sesión, coordinación de guardado, rutas, eventos y offline
src/ui                Vistas, formatos y estilos del juego
public                Iconos, recursos estáticos y manifiesto
tests                 Pruebas de motor, aplicación, guardado, UI e integración
```

El motor no depende del DOM, almacenamiento, reloj real o azar global. Las órdenes devuelven otro estado y preservan el anterior. Los selectores no modifican el mundo. Los filtros y la navegación son estado de sesión, no jornadas simuladas.

`PersistentSession` coordina estado confirmado y escritura pendiente. El esquema Zod valida el JSON desconocido, además de las invariantes del dominio. El orden diario principal está en `src/game/core/workDay.ts`.

### 21.3 Rendimiento

- Crónica paginada y resúmenes limitados en fichas.
- Índices temporales por ID para validar sucesos y asaltos, en vez de comparar cada entrada con todas las demás.
- Las entregas internas de una jornada evitan validar repetidamente el mundo completo para cada recurso; se conserva validación completa a la entrada/salida de cada día, en órdenes públicas que la requieren y en lectura/escritura de guardados.
- No hay renderizado de una crónica entera de varios años como miles de nodos simultáneos.

Esto no equivale a certificar FPS ni rendimiento de todos los Android. La crónica persistente sigue creciendo; no existe un sistema de archivo histórico remoto o compresión por décadas.

## 22. Ejecutar y comprobar el proyecto

Requisito declarado: Node.js 22.12 o superior y npm. En PowerShell se puede usar `npm.cmd` si la política de ejecución bloquea el ejecutable `.ps1`.

```sh
npm install
npm run dev
```

El servidor de desarrollo utiliza `http://127.0.0.1:5173`.

Para compilar y probar la candidata sin sobrescribir las compilaciones históricas conservadas en este entorno:

```sh
npm run build -- --outDir dist-1-0.local
npm run preview -- --outDir dist-1-0.local --port 4176
```

Vista previa actual: `http://127.0.0.1:4176/`. `localhost` o un puerto distinto constituyen otro origen; no se deben prometer las mismas partidas si se cambia de dirección.

Comprobaciones disponibles:

```sh
npm run check
npm test
npm test -- --exclude tests/integration/longGame.test.mjs
npm test -- tests/integration/longGame.test.mjs
```

El `npm test` normal incluye las partidas largas. Si estas ya pasaron sin cambios relevantes del motor, se puede ejecutar solo regresión para evitar repetir trabajo. No hay ESLint ni Prettier configurados actualmente.

`npm run build` sin `--outDir` escribe `dist/`. En este entorno se conserva allí una compilación antigua del teléfono: reconstruir esa carpeta la sustituiría por la versión actual.

No se versionan `node_modules`, compilaciones `dist*` locales ignoradas, datos de herramientas, registros o credenciales. Un clon obtiene el código y debe instalar/compilar sus dependencias. La carpeta `.tools.local` contiene informes de pruebas locales, no datos necesarios para jugar.

## 23. Pruebas realizadas

### 23.1 Resultado funcional de rc.1

Se aprobaron **280 pruebas regresivas y dos pruebas de integración ejecutadas por separado: 282 en 23 archivos**, además de compilación TypeScript/Vite. La ejecución separada evitó repetir simulaciones largas sin cambios relevantes.

La cobertura incluye generación, calendario y RNG, órdenes manuales, vivienda/cupos, construcción, economía/reparto, frío/hambre/recuperación, muerte/final, asaltos, sucesos, talentos, llegadas tardías, formatos anteriores, fallos/reintentos, conflictos de guardado, filtros y secretos de interfaz.

Los visitantes se comprobaron también en una aldea de año 41, conservando edad, relaciones y cumpleaños. Una crónica sintética de diez mil entradas se pagina mostrando 25 y sin consumir RNG. Se compararon frecuencias y porcentajes con múltiples estados aleatorios en pruebas acotadas.

### 23.2 Partidas largas

Ocho partidas de cinco años —40 años simulados— con 40 reaperturas anuales. Se usaron órdenes públicas, sin añadir recursos ni desactivar riesgos y sin usar potencial oculto para elegir trabajadores.

| Semilla | Estrategia | Población inicial | Vivos al año 5 | Asaltos | Oportunidades resueltas |
|---|---|---:|---:|---:|---:|
| integracion-1 | Reservas | 19 | 19 | 17 | 89 |
| integracion-1 | Huertos | 19 | 20 | 16 | 85 |
| integracion-2 | Reservas | 19 | 20 | 22 | 79 |
| integracion-2 | Huertos | 19 | 19 | 18 | 93 |
| integracion-3 | Reservas | 18 | 18 | 17 | 89 |
| integracion-3 | Huertos | 18 | 18 | 25 | 86 |
| extremo-9 | Reservas | 15 | 19 | 20 | 87 |
| extremo-3 | Huertos | 20 | 20 | 20 | 87 |

Las estrategias construyen producción/almacén, autorizan mantenimiento, limitan tala, resuelven decisiones y acogen visitantes solo cuando hay camas. «Reservas» intenta seis agricultores y hasta cuatro guardias; «Huertos», hasta ocho agricultores y dos guardias, según personas y plazas elegibles.

Hubo 155 asaltos y 695 oportunidades resueltas. Algunas muestras terminaron inviernos con 11–20 alimentos y hambre media de hasta 38,3; no se afirma que toda situación sea cómoda o que abandonar la gestión sea viable. Los aumentos de población son visitantes aceptados, sin nacimientos.

Los ocho escenarios consumieron aproximadamente 31,8 segundos de motor/órdenes en el PC de prueba y alcanzaron hasta 2380 entradas. Es una medida local acotada, no una garantía de rendimiento móvil ni balance definitivo de décadas.

### 23.3 Navegador y presentación

Brave con perfiles aislados, sin acceder a sesiones personales:

- Actualizaciones entre candidatas conservando UUID/revisión/datos consultados sin escribir al mirar.
- Navegación por las doce secciones del juego.
- Ayuda disponible antes de fundar, guía contextual y plegado.
- Reapertura y avance/decisiones sin conexión.
- Asalto guardado pendiente, resolución única, heridas, bajas, daños y resultados conservados tras recargar.
- Llegada sintética de cinco personas: dos camas libres ocupadas, tres sin vivienda, hogares anteriores intactos y todos los nuevos desempleados.
- Escritorio 1440×900 y tamaño móvil 844×390, sin desbordamiento de página en los flujos revisados.

### 23.4 Ajuste oscuro rc.2

Después del cambio visual se ejecutó compilación TypeScript/Vite y se inspeccionaron escritorio/móvil, Aldea, Oficios, Economía, Calendario, Ayuda, selección de fecha y diálogo/cancelación. La recarga sin conexión conservó la paleta; cero errores/advertencias de consola en lo comprobado.

No se repitieron las 282 pruebas ni las simulaciones largas por cambiar CSS/colores. Los resultados funcionales anteriores corresponden a su ejecución documentada; no se presentan como una batería nueva de rc.2.

Android físico de la candidata y Opera no fueron comprobados. Las pruebas físicas y offline antiguas de 0.1 no certifican por sí solas el estado actual.

## 24. Límites, pendientes y funciones ausentes

### 24.1 Qué falta para declarar la 1.0 final

1. Prueba del usuario en Android real: legibilidad oscura, controles, horizontal, instalación/actualización, guardados, reapertura y offline.
2. Corregir lo que aparezca y ajustar diversión/dificultad, especialmente primer invierno, ritmo de sucesos y espacio de almacén.
3. Aceptación final del usuario.

El código puede estar en GitHub como candidata sin que esas condiciones hayan ocurrido. El enlace temporal antiguo de Android conserva una compilación anterior mientras no se actualice expresamente su destino/contenido. El servidor local `127.0.0.1` del PC no es una dirección del PC accesible automáticamente desde otro teléfono.

### 24.2 Funciones que no existen actualmente

- APK de la candidata, publicación permanente nueva o tienda de aplicaciones.
- Nacimientos, fertilidad o crecimiento natural automático de población.
- Muerte por vejez como causa independiente.
- Personalidades complejas, conversaciones libres de NPC o IA generativa conectada.
- Nuevos oficios aparte de los cuatro descritos.
- Muralla construible, fortificaciones por niveles o puestos de muralla.
- Armamento complejo, inventario militar o combate táctico individual.
- Medicina profunda, médicos, prótesis o un sistema detallado de traumatología.
- Mercado general, comercio implementado o economía monetaria.
- Bosque finito, mapa masivo o exploración de un mundo abierto.
- Jubilación obligatoria o sistema de maestros/mentores.
- Multijugador, servidor de cuentas o sincronización en la nube.
- Exportación/importación de partidas desde la interfaz.
- Historial de guardados para retroceder una batalla.
- Monetización, cajas de pago o probabilidades publicitadas distintas del motor.
- Un modo automático que contrate desempleados, reordene familias o cambie decisiones manuales por su cuenta.

Las tablas numéricas de este documento describen la configuración actual. No deben interpretarse como reglas inmutables de equilibrio si el usuario pide un ajuste, pero tampoco cambiarse silenciosamente por una idea de una versión futura.

## 25. Historia de versiones y continuidad

| Etapa | Aportación |
|---|---|
| 0.1 | Fundaciones técnicas, generación, calendario, fichas, tres ranuras y offline. |
| 0.2 | Asentamiento, vivienda, almacenamiento, solares, preparación de obra, ampliación y calendario visual. |
| 0.3 | Oficios manuales, construcción efectiva, mantenimiento, aprendizaje y envejecimiento gradual. |
| 0.4 | Producción, consumo, reparto, políticas y balances económicos. |
| 0.5 | Supervivencia, invierno, salud, derrumbes, incapacidades, rescates y fin sin vivos. |
| 0.6 | Guardias, indicios, bandoleros y tácticas con consecuencias reales. |
| 0.7 | Sucesos contextuales, talentos por etapas, visitantes raros y crónica útil. |
| 1.0 rc.1 | Integración, simulaciones largas, rendimiento y guía opcional. |
| 1.0 rc.2 | Tema oscuro y mejora de presentación solicitados por el usuario. |

Para continuar, empezar por este documento, `AGENTS.md`, `README.md`, `CHANGELOG.md` y [la candidata 1.0](docs/16_CANDIDATA_1_0.md). Los seguimientos 09–16 de `docs` conservan decisiones y evidencia de implementación; la Biblia 01, el índice 05 y el plan 06 conservan el diseño original.

Si hay una discrepancia, contrastar versión de aplicación, fuente actual y seguimiento pertinente, y distinguir reglas confirmadas de números provisionales. Los textos históricos que anuncian sistemas como pendientes describen su momento original, no anulan lo implementado después.

Las decisiones de continuidad prioritarias son: español claro, trabajo económico por bloques, Android primero, tema oscuro, cuatro oficios, respeto a órdenes manuales, guardados sin regeneración, potenciales ocultos hasta revelación y ninguna ampliación de alcance sin autorización.
