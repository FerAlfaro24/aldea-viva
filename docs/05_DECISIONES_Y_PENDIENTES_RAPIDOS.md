# ALDEA VIVA — ÍNDICE RÁPIDO DE DECISIONES, ESTADO Y PENDIENTES

**Uso:** consulta de 60 segundos antes de modificar una regla. Ver desarrollo, motivos y matices en la Biblia `01_...` y aceptación técnica en `02_...`.

## 29 decisiones cerradas

| N.º | Estado | Decisión de diseño | Implicación clave |
|---:|---|---|---|
| 01 | Confirmada | 15–20 habitantes iniciales aleatorios, familias mixtas, 2–3 niños preferentes | Generación por semilla, no plantilla fija |
| 02 | Confirmada | Vivienda automática prioriza familias y niños; cambio manual protegido | No exceder camas; sin techo si faltan |
| 03 | Confirmada | Cada oficio tiene mecánica de destino y menú propio | Huerto fijo; leñador bosque; constructor auto/exclusivo; guerrero puesto |
| 04 | Confirmada | Primer oficio asignado manualmente, todos empiezan desempleados | Prohibido autoemplear al generar |
| 05 | Confirmada con números propuestos | Atributos generales + habilidades por oficio + potencial oculto | 5 atributos, 4 skills, 0–100; ponderación 60/40 orientativa |
| 06 | Confirmada | Trabajo desarrolla lentamente atributos, edad puede deteriorarlos | Separar atributo, habilidad y salud |
| 07 | Confirmada | Sin jubilación obligatoria | Experiencia anciana útil, capacidades decrecen naturalmente |
| 08 | Confirmada | Aprender haciendo; eventos excepcionales dan mucha XP con riesgos reales | XP + consecuencia + probabilidad honesta |
| 09 | Confirmada | Eventos distintos: riesgo graduable, sí/no, opciones obligadas, automáticos | No menú de decisión único para todo |
| 10 | Confirmada | 1–3 decisiones importantes/mes de media; pausa exacta del avance | Orientación, no cuota rígida |
| 11 | Confirmada | Muerte permanente, rescates muy raros y secuelas duraderas | Consecuencias fuertes, avisos razonables |
| 12 | Confirmada | Llegan visitantes muy raramente por aceptación/rechazo | Sin reemplazo automático ni nacimientos |
| 13 | Confirmada | Game over solo cuando todos mueren | Sin victoria obligatoria; crónica final |
| 14 | Confirmada | Edad mínima: agricultura 12, construcción 14, tala 15, combate 16 | No autoempleo; avisar desbloqueos |
| 15 | Confirmada | Potencial individual principal para velocidad de aprendizaje | Edad influye poco, no clausura talentos adultos |
| 16 | Confirmada | Skill sin uso decae muy lentamente; se recupera rápido | Guardar dominio histórico y actual |
| 17 | Diferida | No desarrollar personalidad compleja en 1.0 | La individualidad viene de otras capas |
| 18 | Confirmada | Consumo personal variable por edad, trabajo y condición, con azar acotado | Proyecciones de rangos, números reales |
| 19 | Confirmada | Raciones globales: abundante, normal, reducida, emergencia | Jugador fija política, sistema aplica |
| 20 | Confirmada | Prioridad alimentaria: equilibrada, niños, trabajadores, casas | Priorizar no crea comida; no ración individual |
| 21 | Confirmada | Almacén comparte capacidad comida+madera | Competencia por espacio, no topes separados |
| 22 | Confirmada | Construcción requiere materiales, constructores y tiempo; pausas | Más manos aceleran hasta límite |
| 23 | Confirmada | Conservación 0–100; deterioro, inoperancia, derrumbe, avisos | Reparaciones auto/manual + reserva mínima de madera |
| 24 | Confirmada | Madera del bosque ilimitada en 1.0 | Recolección requiere trabajo/almacén |
| 25 | Confirmada | Primavera/verano/otoño/invierno variables; inviernos suaves o duros avisados imperfectamente | Agricultura casi nula invierno |
| 26 | Confirmada | Bandoleros, puestos de defensa, tácticas de alto nivel, % honestos | No combate golpe por golpe |
| 27 | Confirmada | Expansión por requisitos de población/recursos/estado/materiales | Desbloquea espacios y mejoras |
| 28 | Confirmada | Inicio primavera día 1; reservas levemente aleatorias; edificios sanos | Variar sin partidas condenadas |
| 29 | Confirmada | Autosave, 3 ranuras, último estado por partida, offline, sin volver atrás | Estado persistente/RNG y errores visibles |

## Reglas de calendario bloqueadas

- 28 días/mes × 12 meses = **336 días/año**.
- Primavera **1–84**; verano **85–168**; otoño **169–252**; invierno **253–336**.
- Avance **1, 7, 28 días** con ticks diarios e interrupción en evento significativo.
- Un año de edad por 336 días, pero cada personaje cumple en su cumpleaños individual.

## Propuestas previas que NO se deben convertir en hechos confirmados

| Elemento | Propuesta original | Problema/estado |
|---|---|---|
| Solares grado 1 | 10 | no equilibrado todavía |
| Edificios iniciales | 3 casas, 2 huertos, 1 almacén | no equilibrado; 6 espacios ocupados |
| Cupo vivienda | 5 camas por casa | con 3 casas hay solo 15 plazas |
| Cupo huerto | 2 agricultores por huerto | propuesta a probar |
| Ponderación rendimiento | 60% skill + 40% atributos | propuesta de ejemplo, no fórmula cerrada |
| Valores iniciales comida y madera | no fijados | aleatoriedad leve sí confirmada |
| Puntos de atributo/habilidad/potencial | escala sugerida 0–100 | distribuciones no fijadas |
| Costes de edificios | sin números | balance futura versión |
| Deterioro/umbrales | condición 0–100 | tasas/umbrales no fijados |
| % de riesgos, amenazas y eventos | por determinar | mostrar honestamente cuando se implemente |
| Interfaz gráfica/artístico | medieval horizontal | detalles visuales no cerrados |
| Exportación/importación externa | recomendada por seguridad | no formó parte de las 29 decisiones |
| Tecnología React/TypeScript/Vite/IndexedDB | recomendada | inspeccionar repo antes de imponer migración |

## Diferidos hasta DESPUÉS de 1.0 salvo nueva aprobación

- Nacimientos/embarazos; reproducción familiar.
- Rasgos psicológicos complejos y relaciones sociales profundas.
- Bosque finito y regeneración de árboles.
- Medicina elaborada, nuevas profesiones médicas, prótesis/amputaciones sofisticadas.
- Mercado/comercio general, mercenarios, sistema amplio de reclutamiento, rescates complejos.
- Batallas controladas manualmente golpe a golpe, mapas de gran extensión.
- Monetización, gacha de pago, pay-to-win.

## Alertas para la 0.1

**P0:** pruebas calendario 336, RNG/semilla persistente, familias coherentes, niños y adultos, profesión `null`, potencia por oficio oculta, vivienda honesta, tres ranuras, recuperación y prueba Android horizontal.

**No activar aún:** producción de huertos, tala real, hambre diaria, clima dañino, deterioro, combate, muerte, eventos narrativos complejos y asignación de trabajos. Preparar contratos sin inventar simulaciones incompletas.

**Antecedentes incompatibles:** algunos HTML de `aldea_v01`–`v04` usan 120 días/año, 30 días/estación, trabajos automáticos y recolección como profesión. No reutilizar reglas antiguas.

## Preguntas pendientes con prioridad

| Momento | Pregunta | ¿Bloquea 0.1? |
|---|---|---|
| Antes de 0.2 jugable | ¿Mantener 3 casas/15 camas para 15–20 habitantes, o ampliar capacidad? | No, si sin techo se representa fielmente |
| Antes de 0.2 | ¿Qué ocurre con el excedente cuando el almacén está lleno? | No |
| Antes de 0.2/0.3 | ¿Cuál es la lista definitiva de edificios/puestos y costes/cupos? | No |
| Antes de 0.3 | ¿Cuáles son fórmulas de rendimiento, XP y descubrimiento de talentos? | No |
| Antes de 0.4 | ¿Cuáles son tasas de consumo y producción, factores estacionales y límites de oscilación? | No |
| Antes de 0.4 | ¿Cómo se reparten exactamente raciones a casas prioritarias? | No |
| Antes de 0.5 | ¿Cómo escalan frío, hambre, heridas, deterioro y muerte por edades? | No |
| Antes de 0.6 | ¿Qué equipo/bonos mínimos tienen los guerreros y qué porcentajes estimados mostramos? | No |
| Antes de 0.7 | ¿Cómo distribuir familias nuevas sin saturar eventos? | No |
| Antes de 1.0 | Balance longitudinal, migraciones y APK final | No |

## Si solo recuerdas cinco ideas

1. **La aldea está habitada por personas**, no por números reemplazables.
2. **El jugador da las órdenes y la aldea ejecuta rutinas**, nunca al revés.
3. **El azar es reproducible y honesto**, y las consecuencias permanecen.
4. **El calendario exacto es la columna vertebral** de todo el futuro.
5. **La 0.1 debe ser fiable y pequeña**, pero preparada para hacer crecer la simulación hasta la 1.0.
