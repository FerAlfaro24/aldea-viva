# Aldea Viva 0.4 — Economía y reservas

Estado: candidata local `0.4.0-dev`, implementada y comprobada en PC. Android físico y equilibrio jugando pendientes. Sin commits, push ni publicación nueva.

## Qué funciona

- Agricultores producen en su huerto; leñadores aportan madera del bosque. Influyen habilidades y atributos públicos, edad/condición y, en agricultura, conservación y estación. Sin trabajadores autorizados no hay producción. El bosque no se agota.
- Consumo individual diario por edad, actividad/profesión y salud. Variación sembrada de ±5 % antes del redondeo. Cada habitante vivo realiza una extracción de RNG, en orden estable por ID.
- Raciones abundante/normal/reducida/emergencia. Preferencia equilibrada, menores, trabajadores o viviendas señaladas. Los grupos preferentes pesan el doble; los demás siguen participando proporcionalmente. No se sirve más de lo solicitado. Restos de centésimas con desempate rotativo por día, sin RNG adicional.
- Prioridad configurable de entregas: alimentos o madera primero. Capacidad compartida; se acepta solo lo que cabe y se registra lo rechazado. Las reservas de proyectos permanecen protegidas. Sin botones para generar recursos.
- Orden diario: calendario → obras/reparaciones/aprendizaje → producción y entregas → reparto y consumo → balance. Comer libera espacio para el día siguiente, pero no recupera entregas rechazadas. Las obras pueden liberar espacio antes de las entregas.
- Nueva pantalla Economía: políticas persistentes, previsiones, reserva estimada sin nuevas cosechas, producción por huerto y balance individual. Alertas de ausencia de agricultores, reserva corta, reparto incompleto y almacén lleno/excedentes. Registro diario con solicitados, servidos/consumidos, faltantes y causas de las variaciones de stock.
- Se conserva el último reparto individual y un resumen diario en la crónica; los balances anteriores siguen consultables. Tras avanzar varios días se muestra claramente el último y se resumen los faltantes de los últimos siete balances.
- No se activa daño por hambre, muerte, frío, deterioro ni ataques. Hambre/salud permanecen en su estado previo durante esta versión; la falta de comida queda registrada para conectar consecuencias en 0.5.

## Equilibrio provisional

Elegido bajo la autorización del usuario para resolver ajustes sencillos sin preguntas adicionales. Centralizado en `src/game/rules/economy.ts` y el selector económico:

- Recursos con dos decimales. Reparto y redondeos en centésimas enteras; no se cambian reservas iniciales, edificios ni generación.
- Agricultura por persona: `3 + habilidad × 0,06 + promedio(resistencia,destreza) × 0,025`. Tala: `2 + habilidad × 0,04 + promedio(fuerza,resistencia) × 0,02`. Multiplicadores de salud/hambre existentes y edad: menores producen proporcionalmente hasta los 18. Agricultura multiplica también conservación/100.
- Estaciones agrícolas: primavera 0,7→1; verano 1,5; otoño 1,2→0,5; invierno 0,03. Tala sin modificación estacional todavía; riesgos y frío siguen diferidos.
- Necesidad base: menores de 6 años 0,45; de 6 a 11, 0,65; de 12 a 17, 0,85; adultos 1; desde 60, 0,9. Factor de trabajo: agricultura 1,1; construcción/guardia 1,15; tala 1,2. Salud reducida aumenta moderadamente la necesidad. Después se aplica variación ±5 % y ración, redondeando a dos decimales.
- Raciones: abundante 125 %, normal 100 %, reducida 80 %, emergencia 60 %. Se muestra la necesidad normal junto a la cantidad solicitada para que reducir la ración no oculte que se sirve menos alimento.
- Previsión de consumo en rango con puestos actuales; cosecha/tala orientativas antes del límite de almacén. La reserva en días se calcula expresamente **sin nuevas cosechas**, sin prometer una fecha exacta de agotamiento.

## Guardado y comprobaciones

- Lector v1–v6 y escritor v6; versión física de IndexedDB sin cambios. Los sobres anteriores conservan sus esquemas enteros originales; v6 admite cantidades con dos decimales, políticas y balances. Versiones antiguas protegen estos datos como incompatibles.
- Lectura de 0.3 sin escritura ni regeneración. Política inicial: normal, equilibrada y alimentos primero; se comunica en pantalla. Al confirmar una orden o avance se guarda el nuevo formato. Consulta y elección de políticas no extraen RNG.
- Guardado transaccional y reintento del mismo candidato: no repite consumo, cosechas ni azar. Validación de balances, reparto, cupos y capacidad conservada.
- **246 pruebas aprobadas en 18 archivos** y compilación TypeScript/Vite correcta. Solo diez casos nuevos agrupados en `tests/core/economy.test.ts`: ausencia de trabajadores, estaciones/habilidad/conservación, entregas parciales, raciones, prioridades suaves, previsiones/privacidad, equivalencia de avances, migración v5, fallo/reintento y datos dañados. Expectativas anteriores actualizadas donde ahora hay consumo, producción o nuevo formato.
- Brave aislado: actualización de PWA sobre la partida sintética 0.3 `oficios-vista-03`, conservando 19 habitantes, ocho edificios y semilla. Primer día: 10,15 alimentos producidos, 7,5 madera y 18,74 alimentos consumidos. Política reducida, Casa 1 preferente, madera primero y siete días más. Sin conexión recuperó día 44, ocho balances, 19 repartos, política y stock 175,19 alimentos / 122,35 madera.
- Comprobación visual en 1440×900 y 844×390, navegación, formularios y recuperación sin red; sin desbordamiento horizontal ni errores/advertencias de consola durante las comprobaciones. Android físico y Opera no probados en esta versión.

## Archivos y vista previa

- Nuevos: `src/game/{models/economy,rules/economy,rules/resources,selectors/economy,commands/economy,core/economyDay,validation/economy}.ts`, `src/ui/economy.ts`, prueba y este seguimiento.
- Modificados: modelos/esquema/validación y avance diario; almacén, construcción y ampliación para redondeo de recursos; sesión/persistencia/montaje; selectores, formatos/vistas/estilos; expectativas de pruebas, package/lock, README y AGENTS. Sin dependencias nuevas.
- Compilar: `npm run build -- --outDir dist-0-4.local`; servir: `npm run preview -- --outDir dist-0-4.local --port 4176`.
- **Misma dirección que 0.3: http://127.0.0.1:4176.** Se sustituyó únicamente el servidor de vista previa por la compilación nueva; no se trasladaron ni borraron partidas. Recargar y pulsar «Actualizar aplicación» si aparece.
- Compilaciones anteriores conservadas: `dist-0-3.local`, `dist-0-2.local` y `dist/`; el enlace del Android sigue sirviendo 0.1. Los puertos/orígenes distintos mantienen sus propias partidas. Reconstruir una carpeta con el código actual genera 0.4, no una versión histórica.
- Próximo paso: validación del usuario y ajustes de equilibrio. La supervivencia física corresponde a 0.5.
