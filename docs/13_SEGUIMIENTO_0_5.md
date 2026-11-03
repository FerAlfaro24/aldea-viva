# Aldea Viva 0.5 — Supervivencia

Estado: candidata local `0.5.0-dev`, comprobada en PC. Pendientes: Android real y ajustes jugando. Sin commits, push ni publicaciones nuevas.

## Implementación

- El hambre depende de comida consumida respecto a necesidad normal, no de cumplir una ración reducida. Se acumula, reduce rendimiento y daña salud gradualmente. Comida suficiente reduce hambre y permite recuperación; abundante acelera recuperación. Sin cambios automáticos de política.
- Frío invernal según severidad, protección real de la vivienda, edad y vitalidad. Casas deterioradas protegen menos; al 20 % o menos no protegen. Viviendas y oficios manuales se conservan durante inoperancia; reparar restaura su utilidad sin reordenar a nadie.
- Enfermedad e incapacidad cuando frío/malnutrición debilitan seriamente. No se pierde el oficio: durante el reposo no trabaja ni practica. Recuperación requiere plazo, salud y alimentación suficientes. Historial médico y secuelas persistentes sin profesión médica ni medicina compleja.
- Invierno suave/normal/duro, generado y guardado en otoño. Indicios imperfectos y aviso al comenzar el invierno. Al cargar una partida antigua en invierno se informa en el primer día nuevo, sin inventar avisos pasados ni aplicar daños retroactivos.
- Deterioro diario y avisos de conservación. Huertos inutilizables no producen. Almacenes inutilizables no admiten sus nuevas plazas de entregas, pero retienen existencias hasta el derrumbe; capacidad física y capacidad de entregas diferenciadas.
- Siete días con conservación cero derrumban el edificio y liberan el solar. Se conserva su entidad histórica para referencias y crónica. Moradores desalojados explícitamente, sin reasignación automática. Si disminuye capacidad, se conserva lo que quepa priorizando madera reservada, comida y madera libre; pérdidas registradas. Si la madera restante no cubre reservas, se cancelan proyectos sin iniciar, desde el más reciente, sin devolver recursos inexistentes.
- Mantenimiento flexible desde conservación 95 o menos; deja de gastar al superar ese umbral. Evita pagar una madera diaria por reparar centésimas de desgaste. El constructor exclusivo puede reparar antes. Reservas y prioridades existentes respetadas.
- Muerte permanente con causa: elimina empleo activo y plaza de vivienda, conserva familiares, habilidades, nombre e historial. Edad mostrada congelada al fallecer. Filtro vivos/fallecidos/todos y fichas históricas.
- Algunos casos críticos de frío permiten rescate excepcional con salud 1, estabilización breve, incapacidad larga y secuelas. Nunca resucita una persona ya fallecida ni reemplaza habitantes.
- Fin solo sin supervivientes, aunque el último sea menor o anciano. Se conserva resumen/crónica; el tiempo y órdenes de gestión quedan bloqueados. Las otras ranuras siguen disponibles.
- Los avances 7/28 se detienen al final del día con aviso relevante de hambre/salud, enfermedad/rescate, deterioro peligroso, derrumbe, muerte o nuevo aviso invernal. No crea una decisión pendiente artificial: el jugador revisa e interviene antes de continuar.

## Parámetros provisionales

Autorizados como ajustes sencillos por el usuario; centralizados en `rules/survival.ts`, `rules/work.ts` y selectores de supervivencia:

| Sistema | Valor inicial |
|---|---|
| Hambre | Déficit respecto a necesidad × 5 al día, máximo 100; comer suficiente recupera 3/día y el exceso añade recuperación |
| Daño por hambre | Comienza sobre 35; asciende gradualmente hasta 2,5 de salud/día |
| Recuperación de salud | 0,35/día con comida suficiente y hambre menor de 40; abundante añade hasta 0,2/día |
| Frío sin protección | Suave 0,6; normal 1,1; duro 1,7 de salud/día, modificado por protección y fragilidad individual |
| Desgaste | 0,02/día; invierno ×1,25/1,5/2 según dureza |
| Avisos de edificios | 70, 40, 20 y 10 de conservación; inutilizable al 20 o menos; derrumbe tras siete días en cero |
| Enfermedad | Salud menor de 60 y malnutrición/frío; reposo inicial 7–28 días, prorrogable hasta recuperarse |
| Rescate | 3 % en crisis mortal con hambre menor de 60 y sin rescate anterior; salud 1, siete días estabilizado, 120–672 de incapacidad y capacidad física permanente 50/75 % |
| Invierno e indicios | Suave/normal/duro 20/60/20 %; indicio correcto 70 %, incierto 20 %, erróneo 10 % |

Orden diario: calendario → clima/desgaste/posibles derrumbes → trabajo/aprendizaje → producción/consumo → salud/mortalidad. Los balances económicos comienzan después de pérdidas de derrumbe, registradas por separado. Los sorteos usan el RNG guardado y un orden estable por ID; las consultas no lo consumen.

## Guardado y comprobaciones

- Lector v1–v7, escritor v7. Sobres anteriores estrictos conservados, sin regeneración ni escritura al consultar. Guardado de clima, episodios médicos, secuelas, derrumbes y final; IndexedDB física sin cambio. Fallo/reintento no repite simulación ni muertes.
- **258 pruebas aprobadas en 19 archivos** y compilación TypeScript/Vite correcta. Doce casos nuevos agrupados en `tests/core/survival.test.ts`; incluyen recuperación, raciones de riesgo, refugio, indicios, incapacidad, reparación/derrumbe/reconstrucción, pérdidas de almacén, final/decesos, superviviente menor/anciano, rescate y migración/reintento.
- Una comprobación de equilibrio de **100 semillas**: 50 aldeas provistas y alojadas frente a 50 abandonadas sin comida/refugio, durante 28 días de invierno duro. Las preparadas conservaron sus habitantes; entre las abandonadas hubo muertes y supervivientes. Es contraste de escenarios, no balance definitivo de partidas largas.
- Pruebas anteriores de calendario/persistencia adaptadas: suministro abundante en las que deben aislar un año completo; otras verifican el avance real hasta el aviso. Construcción/mantenimiento ahora admiten desgaste y la economía incorpora consecuencias físicas. No se desactiva supervivencia para ocultar fallos.
- Brave aislado: actualización sobre la partida sintética 0.4, preservando semilla, 19 habitantes y ocho edificios. Ración reducida: el avance 28 se detuvo tras 25 días, en día 69, con hambre aproximadamente 25 y salud aún 100. Cambio de ración desde tamaño móvil comprobado.
- Partida sintética de final en otra ranura del mismo perfil aislado: 19 decesos, filtro/ficha históricos y tres botones de tiempo deshabilitados. Recarga sin conexión conservó el final sin resurrección. No se importaron ni modificaron datos de sesiones personales.
- Escritorio 1440×900 y tamaño móvil 844×390, sin desbordamiento de página ni errores/advertencias de consola en los flujos comprobados. Navegación móvil horizontal para conservar altura. Android físico y Opera no probados en esta versión.

## Archivos y siguiente paso

- Nuevos: `src/game/{models/survival,rules/survival,selectors/survival,validation/survival,core/survivalDay}.ts`, `src/ui/survival.ts`, prueba de supervivencia, fixture de suministros y este seguimiento.
- Modificados: modelos/esquema/validación, avance diario, selección de empleo/almacén/vivienda/economía, vivienda/ampliación, sesión/montaje, vistas/formatos/estilos, pruebas afectadas, package/lock, README y AGENTS. Sin dependencias nuevas.
- Compilar: `npm run build -- --outDir dist-0-5.local`; servir: `npm run preview -- --outDir dist-0-5.local --port 4176`. Se sustituyó solo la vista previa, manteniendo origen y partidas. Las compilaciones anteriores siguen conservadas; el enlace del Android mantiene su versión anterior.
- Próximo paso: probar esta candidata y ajustar cifras. Ataques, combate y heridas de combate corresponden a 0.6; no se han adelantado.
