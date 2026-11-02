# ALDEA VIVA — DOCUMENTO MAESTRO

**Estado:** 29 decisiones principales confirmadas. **Objetivo:** juego independiente de gestión y supervivencia medieval para Android, en horizontal, con historias emergentes y consecuencias permanentes.

## 1. Filosofía
El jugador asigna trabajos, decide prioridades y toma decisiones estratégicas; la aldea automatiza las rutinas autorizadas. Las órdenes manuales se respetan. No se crean edificios ni se asignan profesiones sin permiso. Sin monetización gacha; porcentajes y revelaciones dramáticas se usan para mostrar riesgos y resultados reales.

## 2. Tiempo y guardado
- Año: 12 meses de 28 días = 336 días.
- Primavera: días 1–84; verano: 85–168; otoño: 169–252; invierno: 253–336.
- Avanzar 1, 7 o 28 días; detenerse exactamente cuando surja una decisión importante.
- Aleatoriedad reproducible por semilla guardada.
- Guardado local automático tras avances y decisiones; tres espacios independientes, sin historial para deshacer decisiones. Debe protegerse el último estado válido ante cierres inesperados.
- Primera plataforma técnica: experiencia instalable y sin conexión, orientada a Android; empaquetado APK posteriormente.

## 3. Inicio de partida
- Primavera, día 1, año 1.
- 15–20 habitantes generados al azar, con familias, parejas, hermanos y solteros; idealmente 2–3 menores y suficientes adultos.
- Todos los adultos comienzan sin profesión: el jugador realiza sus primeras asignaciones.
- Alojamiento inicial automático que prioriza familias y menores; el jugador puede modificarlo manualmente.
- Reservas iniciales de comida y madera ligeramente aleatorias y equilibradas; edificios iniciales en buen estado.
- **Propuesta aún no equilibrada:** 10 espacios iniciales, con 3 casas, 2 huertos y 1 almacén; cada casa aloja a 5. Esto deja 15 camas para hasta 20 habitantes. Resolver expresamente en el balance, sin alterar silenciosamente las decisiones.

## 4. Habitantes y progresión
- Identidad, edad, relaciones familiares, vivienda, profesión, destino, salud, hambre y habilidades.
- Muerte permanente. Fin de partida únicamente cuando fallecen todos los habitantes.
- Envejecimiento natural: 1 año cada 336 días; sin jubilación obligatoria.
- Edad mínima laboral: agricultura 12, construcción 14, tala 15, combate 16; hasta 11 años no trabajan.
- Atributos generales propuestos (0–100): fuerza, resistencia, agilidad, destreza y vitalidad.
- Habilidades profesionales (0–100): agricultura, tala, construcción y combate.
- Potencial oculto específico de cada profesión; pistas narrativas y descubrimiento mediante experiencia.
- Aprendizaje por práctica; grandes eventos conceden más experiencia y conllevan riesgo. Los atributos mejoran lentamente y pueden declinar con la edad. Habilidades sin uso decaen muy despacio y se recuperan más rápido al retomar la profesión.
- Llegada de nuevos habitantes mediante eventos muy raros que el jugador acepta o rechaza. Nacimientos y rasgos complejos de personalidad fuera de 1.0.

## 5. Profesiones
- Agricultor: asignación a un huerto concreto con plazas limitadas (propuesta: 2 por huerto).
- Leñador: produce madera en el bosque; la reserva natural de madera es infinita durante 1.0, pero la extracción requiere trabajo y espacio de almacenamiento.
- Constructor: puede atender automáticamente obras y reparaciones autorizadas o dedicarse manualmente a una tarea exclusiva.
- Guerrero: asignación a puestos defensivos como muralla, bosque o aldea.
- Cada oficio dispone de su propio menú; el menú de habitantes centraliza la información y las asignaciones.

## 6. Edificios y expansión
- Espacios de construcción limitados por grado de aldea; expansión mediante requisitos de población, reservas, edificios y materiales.
- Construcción con coste de materiales, trabajadores y tiempo; varios constructores aceleran hasta un límite. Obras pausables sin perder progreso.
- Deterioro de 0 a 100: pérdida de rendimiento, inutilización y eventual derrumbe irreversible tras abandono prolongado, con avisos claros.
- Reparaciones automáticas o manuales; reserva mínima de madera configurable.
- Almacén con capacidad compartida entre alimentos y madera.

## 7. Producción y alimentación
- Agricultura dependiente de estación, trabajadores, habilidades y circunstancias.
- Primavera moderada creciente; verano elevada; otoño decreciente; invierno casi nula.
- Consumo por edad, trabajo y estado, con pequeñas fluctuaciones diarias acotadas.
- Raciones generales: abundantes, normales, reducidas y de emergencia.
- Prioridades alimentarias simples: reparto equilibrado, niños, trabajadores o viviendas seleccionadas. Priorizar redistribuye la escasez; no genera comida.
- Desnutrición prolongada reduce productividad y salud, y puede causar la muerte. Buena alimentación permite recuperación gradual.
- Mostrar existencias, consumo real y proyecciones en rangos, distinguiendo estimaciones de certezas.

## 8. Invierno, amenazas y acontecimientos
- Inviernos suaves, normales o duros, con indicios imperfectos durante otoño.
- Frío, falta de vivienda, escasez y ataques pueden provocar heridas, secuelas o muertes.
- Bandidos ocasionales, a veces con señales previas. Los guerreros defienden automáticamente según su puesto y capacidades.
- En ataques importantes, el jugador elige tácticas de alto nivel (defender muralla, proteger almacén, negociar, salida ofensiva), con riesgos y probabilidades honestas.
- Eventos de aceptación/rechazo, riesgo ajustable, alternativas obligatorias o resolución automática según contexto.
- Orientación de 1–3 decisiones importantes por mes, sin cuota fija. Sucesos menores quedan en la crónica.
- Algunos rescates excepcionales serán posibles, pero no toda muerte podrá evitarse.

## 9. Hoja de ruta
| Versión | Entrega |
|---|---|
| 0.1 | Interfaz horizontal, calendario, semilla, habitantes iniciales, avance del tiempo y guardado |
| 0.2 | Edificios, viviendas, espacios y almacenes |
| 0.3 | Profesiones, asignaciones, atributos y habilidades |
| 0.4 | Producción, consumo, raciones y estaciones |
| 0.5 | Salud, hambre, vivienda e invierno |
| 0.6 | Defensa, ataques y consecuencias |
| 0.7 | Eventos, crónica y pulido de interfaz |
| 1.0 | Balance, estabilidad y publicación |

## 10. Parámetros por ajustar
Costes, rendimientos, tasas de deterioro, límites exactos de trabajo, probabilidades, requisitos de expansión y la discrepancia inicial entre población y camas. Son decisiones de equilibrio, no motivos para añadir sistemas nuevos antes de probar la base.
