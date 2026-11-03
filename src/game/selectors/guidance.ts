import { getCalendarDate } from '../core/calendar';
import type { VillageState } from '../models/village';
import { CONSTRUCTION_CATALOG } from '../rules/construction';
import { selectEconomyForecast, selectEconomyPolicy } from './economy';
import { selectStorage } from './storage';
import { isBuildingUsable, isFitForWork, isGameOver, isStanding } from './survival';
import { selectHousingSummary } from './village';
import { selectGuards } from './defense';
import { selectWorkOccupancy, selectWorksites } from './work';
import { selectWinterPlan } from './planning';
import { selectWorkAdjustments } from './workAdjustments';
import { selectExpansion } from '../commands/expansion';
import { selectRecommendedWork } from './recommendedWork';

type AdviceAction = 'work' | 'adjust' | 'delivery' | 'build' | 'plot' | 'advance' | 'navigate';
export interface VillageAdvice {
  readonly title: string;
  readonly description: string;
  readonly label: string;
  readonly action: AdviceAction;
  readonly route?: 'professions' | 'economy' | 'survival' | 'defense' | 'events' | 'buildings' | 'chronicle';
  readonly plotId?: string;
  readonly buildingType?: 'orchard' | 'warehouse' | 'house';
  readonly days?: 1 | 7;
}

export function selectGuidance(village: VillageState) {
  const forecast = selectEconomyForecast(village);
  const storage = selectStorage(village);
  const winter = selectWinterPlan(village);
  const adjustments = selectWorkAdjustments(village);
  const date = getCalendarDate(village.elapsedDays);
  const minimumBalance = forecast.production.food - forecast.maximum;
  const maximumBalance = forecast.production.food - forecast.minimum;
  const foodCovered = minimumBalance >= 0;
  const farmers = forecast.production.farmers;
  const freeFarmPosts = selectWorksites(village, 'farmer').reduce((sum, site) => sum + Math.max(0, (site.capacity ?? 0) - selectWorkOccupancy(village, site.id)), 0);
  const builders = (village.workAssignments ?? []).filter((order) => order.profession === 'builder' && order.status === 'active' && order.authorized
    && village.residents.some((person) => person.id === order.residentId && isFitForWork(person, village.elapsedDays)));
  const projects = village.constructionProjects ?? [];
  const damagedProduction = village.buildings.find((building) => building.type !== 'house' && isStanding(building) && !isBuildingUsable(building));
  const projectAdvice = (project: typeof projects[number]): VillageAdvice => {
    const title = CONSTRUCTION_CATALOG[project.buildingType].label;
    if (project.status === 'paused') return { title: `La obra de ${title.toLowerCase()} está pausada`, description: 'Reanúdala para que pueda avanzar. El progreso y los materiales reservados se conservan.', label: 'Revisar obra', action: 'plot', plotId: project.slotId };
    const hasWorkers = builders.some((order) => order.workplaceId === project.id || order.workplaceId === 'work:builder-auto');
    return hasWorkers
      ? { title: `Tu ${title.toLowerCase()} está en construcción`, description: 'Ya tiene constructores disponibles. Avanza un día para comprobar el progreso; también puedes usar los avances largos de abajo. Al terminar un huerto tendrás que ocupar sus puestos.', label: 'Trabajar un día', action: 'advance' }
      : { title: 'La obra necesita constructores', description: 'Reservar madera prepara la obra. Asigna constructores a esta tarea o al reparto flexible para que avance.', label: 'Revisar oficios recomendados', action: 'work' };
  };
  const repairAdvice = (building: typeof village.buildings[number]): VillageAdvice => {
    if (!(village.maintenance?.orders ?? []).some((order) => order.buildingId === building.id)) return { title: `${building.displayName} necesita mantenimiento`, description: 'Autoriza la reparación de este edificio. Los constructores flexibles podrán atenderla al avanzar los días.', label: 'Autorizar mantenimiento', action: 'plot', plotId: building.slotId };
    if (!builders.length) return { title: 'La reparación necesita constructores', description: 'Ya está autorizada. Revisa la propuesta para asignar personas disponibles a construcción.', label: 'Revisar constructores', action: 'work' };
    if (storage.availableWood < 2) return forecast.production.wood > 0
      ? { title: 'Reúne madera para las reparaciones', description: 'Los leñadores ya trabajan; avanza un día para reunir materiales.', label: 'Reunir madera un día', action: 'advance' }
      : { title: 'Las reparaciones necesitan madera', description: 'Asigna tala para que los constructores puedan recuperar la conservación.', label: 'Revisar oficios recomendados', action: 'work' };
    return { title: `Recupera ${building.displayName}`, description: 'La reparación está autorizada y hay constructores y madera. Avanza un día para comprobar su progreso.', label: 'Trabajar en las reparaciones', action: 'advance' };
  };
  const buildAdvice = (buildingType: 'orchard' | 'warehouse' | 'house'): VillageAdvice => {
    const project = projects.find((item) => item.buildingType === buildingType);
    if (project) return projectAdvice(project);
    const wood = CONSTRUCTION_CATALOG[buildingType].wood;
    if (storage.availableWood < wood && storage.free < 30 && selectEconomyPolicy(village).deliveryPriority !== 'wood') return { title: 'Haz sitio para la madera de construcción', description: 'Falta madera libre y la comida llena casi todo el almacén. Revisa la prioridad temporal «Madera primero», guarda la política y reúne materiales. Después puedes volver a «Alimentos primero».', label: 'Revisar prioridad de entregas', action: 'delivery' };
    if (storage.availableWood < wood && forecast.production.wood === 0 && !selectRecommendedWork(village).assignments.length) return { title: 'La tala necesita recuperar su actividad', description: 'No hay una asignación nueva disponible. Revisa en Oficios quién está en reposo o cambia expresamente un puesto de trabajo para reunir madera.', label: 'Revisar trabajadores de tala', action: 'navigate', route: 'professions' };
    if (storage.availableWood < wood) return forecast.production.wood > 0
      ? { title: 'Reúne madera para la siguiente obra', description: `Necesitas ${wood} de madera libre. Tu leñador ya produce; avanza un día y vuelve a comprobar las reservas.`, label: 'Reunir madera un día', action: 'advance' }
      : { title: 'Necesitas madera para construir', description: `La siguiente obra cuesta ${wood} de madera libre. Asigna tala para reunirla; los materiales reservados de otras obras se respetan.`, label: 'Revisar oficios recomendados', action: 'work' };
    const plot = village.constructionSlots.find((slot) => !slot.buildingId && !projects.some((item) => item.slotId === slot.id));
    if (!plot) {
      if (village.grade >= 2) return { title: 'Has alcanzado el límite de solares', description: 'Los 14 solares están ocupados o reservados. Revisa el reparto de trabajo y conserva las reservas; esta versión no tiene otra ampliación.', label: 'Revisar reservas y consumo', action: 'navigate', route: 'economy' };
      if (village.elapsedDays < 28) return { title: 'Consolida la aldea durante el primer mes', description: 'La ampliación se habilita tras 28 días. Aprovecha las reservas y las obras actuales mientras llega ese momento.', label: 'Observar la aldea unos días', action: 'advance', days: 7 };
      if (!selectExpansion(village).allowed) {
        const damaged = village.buildings.find((building) => isStanding(building) && building.condition < 80);
        if (damaged) return repairAdvice(damaged);
        if (storage.availableWood < 50) return forecast.production.wood > 0
          ? { title: 'Reúne la madera de la ampliación', description: 'La ampliación cuesta 50 de madera libre. Ya hay tala trabajando; avanza un día para reunirla.', label: 'Reunir madera un día', action: 'advance' }
          : { title: 'Falta madera para abrir nuevos solares', description: 'La ampliación necesita 50 de madera libre. Revisa la propuesta de oficios para reunir materiales.', label: 'Revisar tala', action: 'work' };
        return { title: 'Prepara la ampliación de la aldea', description: 'Necesitas al menos 15 habitantes y 150 alimentos guardados. Revisa qué requisito falta antes de reservar otra obra.', label: 'Revisar requisitos pendientes', action: 'navigate', route: 'buildings' };
      }
      return { title: 'Abre espacio para la siguiente obra', description: 'Ya puedes ampliar al grado 2 por 50 de madera. Obtendrás cuatro solares; conserva alguno para viviendas y decisiones futuras.', label: 'Ampliar el espacio de la aldea', action: 'navigate', route: 'buildings' };
    }
    return { title: buildingType === 'orchard' ? 'Construye otro huerto' : buildingType === 'house' ? 'Prepara una vivienda para quienes no tienen refugio' : 'Haz espacio para las cosechas',
      description: buildingType === 'orchard' ? `Los huertos actuales no cubren el consumo previsto. Otro huerto cuesta ${wood} de madera y añade dos puestos; necesitará constructores y luego agricultores.`
        : buildingType === 'house' ? `Una casa cuesta ${wood} de madera y añade cinco camas. Al terminar podrás alojar allí a quienes lo necesiten.`
          : `Para el invierno estimamos ${winter.capacityTarget} plazas entre comida y madera; faltan ${winter.capacityMissing}. Un almacén cuesta ${wood} de madera y añade 600 plazas.`,
      label: buildingType === 'orchard' ? 'Preparar un huerto' : buildingType === 'house' ? 'Preparar una casa' : 'Preparar un almacén', action: 'build', plotId: plot.id, buildingType };
  };
  let advice: VillageAdvice;
  if (isGameOver(village)) advice = { title: 'La historia de esta aldea ha terminado', description: 'El registro conserva sus habitantes y decisiones. Puedes fundar otra aldea en Tus aldeas.', label: 'Leer su historia', action: 'navigate', route: 'chronicle' };
  else if (village.pendingDecision) advice = { title: 'Hay una decisión que necesita tu respuesta', description: 'El tiempo y las órdenes están detenidos. Revisa las opciones y sus consecuencias para continuar.', label: village.pendingDecision.type === 'bandit_attack' ? 'Responder al asalto' : 'Resolver el suceso', action: 'navigate', route: village.pendingDecision.type === 'bandit_attack' ? 'defense' : 'events' };
  else if (village.defense?.threat) advice = { title: 'Prepara la aldea para los bandoleros', description: 'Ya hay indicios de un asalto. Consulta cuándo llegan y revisa los puestos defensivos antes de continuar.', label: 'Preparar la defensa', action: 'navigate', route: 'defense' };
  else if (selectHousingSummary(village).unhousedIds.length) {
    const damagedHouse = village.buildings.find((building) => building.type === 'house' && isStanding(building) && !isBuildingUsable(building));
    const freeHouse = village.buildings.find((building) => building.type === 'house' && isBuildingUsable(building) && selectHousingSummary(village).capacity > selectHousingSummary(village).housed);
    advice = damagedHouse ? repairAdvice(damagedHouse)
      : freeHouse ? { title: 'Hay camas libres para quienes no tienen vivienda', description: 'Selecciona una casa con plazas y traslada a sus futuros moradores. Tus familias y órdenes anteriores se conservan.', label: 'Alojar a quienes faltan', action: 'navigate', route: 'buildings' }
        : buildAdvice('house');
  }
  else if (damagedProduction) advice = repairAdvice(damagedProduction);
  else if (adjustments.some((order) => order.kind === 'conflict')) advice = { title: 'Hay trabajadores esperando una nueva tarea', description: 'Su destino anterior ya no está disponible. Revisa los cambios propuestos para recuperar su trabajo sin cambiar otras órdenes.', label: 'Revisar destinos pendientes', action: 'adjust' };
  else if (['reduced', 'emergency'].includes(selectEconomyPolicy(village).ration)) advice = { title: 'Las raciones reducidas acumulan hambre', description: 'La reserva puede crecer aunque la gente coma poco. Vuelve a una ración normal cuando puedas sostenerla y revisa quién necesita recuperarse.', label: 'Revisar raciones', action: 'navigate', route: 'economy' };
  else if (village.residents.some((person) => person.alive && (person.condition.hunger >= 50 || person.condition.health <= 50)) && village.inventory.food >= forecast.maximum * 7) advice = { title: 'Hay habitantes que necesitan atención', description: 'Ya hay comida para su recuperación. Revisa quién necesita reposo; una ración abundante acelera la recuperación y exige más reservas.', label: 'Revisar salud y reposo', action: 'navigate', route: 'survival' };
  else if (freeFarmPosts > 0) advice = { title: farmers === 0 ? 'Primero, pon los huertos a trabajar' : 'Tu huerto tiene puestos sin cubrir', description: `Hay ${freeFarmPosts} puestos de agricultura libres. Revisa una propuesta de oficios para aprovecharlos; producirán al avanzar los días.`, label: 'Revisar oficios recomendados', action: 'work' };
  else if (!foodCovered && !winter.inWinter && winter.daysToWinter > 14) advice = buildAdvice('orchard');
  else if (adjustments.length) advice = { title: 'Ya tienes madera: deja espacio para comida', description: `El objetivo de madera de reserva es ${winter.woodTarget}. Puedes pausar la tala desde una propuesta revisable; ninguna orden cambia sin que la apliques.`, label: 'Revisar la tala y el espacio', action: 'adjust' };
  else if (winter.capacityMissing > 0 && !winter.inWinter && winter.daysToWinter > 7) advice = buildAdvice('warehouse');
  else if (projects.length) advice = projectAdvice(projects[0]!);
  else if (!winter.inWinter && winter.daysToWinter <= 14) advice = { title: winter.ready ? 'Tus reservas están listas para recibir el invierno' : 'El invierno está cerca: revisa las reservas', description: `Quedan ${winter.daysToWinter} días. El objetivo aproximado es ${winter.foodTarget} alimentos; ${winter.ready ? 'ya lo has alcanzado. Conserva comida y refugios.' : `faltan ${winter.foodMissing}. Prioriza conservar cosechas y proteger la comida disponible.`}`, label: 'Revisar el plan de invierno', action: 'navigate', route: 'economy' };
  else if (!foodCovered) advice = { title: 'El invierno se sostiene con tus reservas', description: `Quedan ${winter.remainingDays} días de invierno. ${winter.ready ? 'La reserva cubre el objetivo aproximado; observa salud, refugios y posibles pérdidas.' : `El objetivo es ${winter.foodTarget} alimentos y faltan ${winter.foodMissing}. Revisa raciones y evita gastar comida en riesgos opcionales.`}`, label: 'Revisar reservas y consumo', action: 'navigate', route: 'economy' };
  else if (village.buildings.some((building) => isBuildingUsable(building) && building.condition <= 80)) advice = repairAdvice(village.buildings.find((building) => isBuildingUsable(building) && building.condition <= 80)!);
  else if (selectGuards(village).length < 2) advice = { title: 'La comida crece: prepara también la defensa', description: 'Ya cubres el consumo previsto. Puedes completar la guardia con habitantes sin oficio; revisa la propuesta antes de asignarlos.', label: 'Revisar oficios recomendados', action: 'work' };
  else advice = { title: winter.ready ? 'Objetivo de reservas alcanzado' : 'Buen comienzo: la aldea cubre su comida diaria', description: winter.ready ? 'Ya tienes comida para el objetivo de invierno. Cuida a las personas y los edificios, conserva solares para futuras decisiones y disfruta de la historia de tu comunidad. El excedente que no quepa se rechazará.' : `Tu siguiente objetivo es guardar ${winter.foodTarget} alimentos para el invierno. Faltan ${winter.foodMissing}; la producción y el espacio actuales te ayudarán a reunirlos.`, label: 'Ver producción y reservas', action: 'navigate', route: 'economy' };
  return { forecast, storage, winter, minimumBalance, maximumBalance, foodCovered, advice,
    chapter: village.elapsedDays >= 336 ? 'Primer año superado · Tu comunidad sigue adelante' : date.season === 'spring' ? 'Primavera · Echar raíces' : date.season === 'summer' ? 'Verano · Guardar la cosecha' : date.season === 'autumn' ? 'Otoño · Preparar el refugio' : 'Invierno · Cuidar a tu comunidad',
    milestones: [{ label: 'Huertos con agricultores', done: farmers > 0 && freeFarmPosts === 0 },
      { label: 'Producción cubre el consumo previsto', done: foodCovered },
      { label: 'Primera obra terminada', done: village.chronicle.some((entry) => entry.type === 'construction_changed' && entry.action === 'completed') },
      { label: 'Primer asalto resuelto', done: village.chronicle.some((entry) => entry.type === 'bandit_resolved') },
      { label: 'Llegar al primer invierno', done: village.elapsedDays >= 252 },
      { label: 'Superar el primer año con supervivientes', done: village.elapsedDays >= 336 && !isGameOver(village) }] };
}
