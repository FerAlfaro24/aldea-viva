import { getAge, getBirthElapsedDay, getCalendarDate, getEligibleProfessions } from '../core/calendar';
import { restoreRng } from '../core/rng';
import { deriveInitialClues, getClueTexts } from '../generation/clues';
import { ATTRIBUTE_KEYS } from '../models/village';
import type { VillageState } from '../models/village';
import { DAYS_PER_YEAR, PROFESSIONS } from '../rules/calendar';
import { getInitialConfig } from '../rules/initialConfig';
import { selectWorksites } from '../selectors/work';
import { isResourceAmount, resourceUnits } from '../rules/resources';
import { validateEconomy, validateEconomyPolicy, validateEconomySummary } from './economy';
import { validateSurvival } from './survival';
import { validateDefense } from './defense';
import { validateStory } from './story';
import { isStanding } from '../selectors/survival';

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Estado de aldea inválido: ${message}`);
}

function score(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && value <= 100;
}

function uniqueIds(ids: readonly string[], description: string): void {
  invariant(ids.every((id) => typeof id === 'string' && id.trim()), `${description}: identificador vacío`);
  invariant(new Set(ids).size === ids.length, `${description}: identificadores duplicados`);
}

// Valida invariantes de objetos del dominio. La lectura de JSON desconocido y
// la lectura de guardados se valida además en storage/schema.ts.
export function validateVillageState(village: VillageState): void {
  getCalendarDate(village.elapsedDays);
  restoreRng(village.rng);
  uniqueIds([village.id, ...village.residents.map((value) => value.id),
    ...village.families.map((value) => value.id), ...village.buildings.map((value) => value.id),
    ...village.constructionSlots.map((value) => value.id), ...(village.constructionProjects ?? []).map((value) => value.id)], 'Entidades');
  invariant(Number.isSafeInteger(village.grade) && village.grade >= 1, 'grado inválido');
  const people = new Map(village.residents.map((person) => [person.id, person]));
  const families = new Map(village.families.map((family) => [family.id, family]));
  const buildings = new Map(village.buildings.map((building) => [building.id, building]));
  const slots = new Map(village.constructionSlots.map((slot) => [slot.id, slot]));

  for (const family of village.families) {
    uniqueIds(family.memberIds, 'Miembros familiares');
    invariant(family.memberIds.length > 0, 'familia sin integrantes');
    invariant(family.displayName.trim(), 'familia sin nombre');
    invariant(family.kind !== 'single' || family.memberIds.length === 1, 'hogar individual con varios integrantes');
    invariant(family.kind !== 'partners' || family.memberIds.length === 2, 'pareja incompleta');
    invariant(family.kind !== 'siblings' || family.memberIds.length >= 2, 'grupo de hermanos incompleto');
    invariant(family.kind !== 'parents-and-children' || family.memberIds.length >= 3, 'familia con hijos incompleta');
    for (const memberId of family.memberIds) {
      invariant(people.get(memberId)?.familyId === family.id, 'pertenencia familiar inconsistente');
    }
  }

  for (const person of village.residents) {
    getAge(person, village.elapsedDays);
    invariant(person.displayName.trim() && person.origin.trim(), 'habitante sin nombre u origen');
    invariant(families.get(person.familyId)?.memberIds.includes(person.id), 'familia ausente en habitante');
    const relations = person.relations;
    uniqueIds(relations.parentIds, 'Progenitores');
    uniqueIds(relations.childIds, 'Descendientes');
    uniqueIds(relations.siblingIds, 'Hermanos');
    invariant(![...relations.parentIds, ...relations.childIds, ...relations.siblingIds, relations.partnerId].includes(person.id), 'parentesco consigo mismo');
    for (const parentId of relations.parentIds) {
      const parent = people.get(parentId);
      invariant(parent, 'progenitor inexistente');
      invariant(parent.relations.childIds.includes(person.id), 'relación progenitor-hijo no recíproca');
      invariant(getBirthElapsedDay(parent) < getBirthElapsedDay(person), 'progenitor más joven que su descendiente');
    }
    for (const childId of relations.childIds) {
      invariant(people.get(childId)?.relations.parentIds.includes(person.id), 'relación hijo-progenitor no recíproca');
    }
    for (const siblingId of relations.siblingIds) {
      invariant(people.get(siblingId)?.relations.siblingIds.includes(person.id), 'hermandad no recíproca');
    }
    if (relations.partnerId !== null) {
      const partner = people.get(relations.partnerId);
      invariant(partner?.relations.partnerId === person.id, 'pareja no recíproca');
      invariant(person.initialAge >= 18 && partner.initialAge >= 18, 'pareja inicial no adulta');
      invariant(![...relations.parentIds, ...relations.childIds, ...relations.siblingIds].includes(partner.id), 'pareja con parentesco directo incompatible');
    }
    for (const key of ATTRIBUTE_KEYS) invariant(score(person.attributes[key]), 'atributo fuera de escala');
    for (const profession of PROFESSIONS) {
      const skill = person.skills[profession];
      invariant(skill && score(skill.effective) && score(skill.historicalBest) && score(skill.potentialSecret), 'habilidad fuera de escala');
      invariant(skill.historicalBest >= skill.effective, 'dominio histórico inferior al actual');
      invariant(Number.isSafeInteger(skill.experience) && skill.experience >= 0, 'experiencia inválida');
    }
    invariant(score(person.condition.health) && score(person.condition.hunger), 'salud o hambre fuera de escala');
    invariant(person.initialClueIds.length > 0 && getClueTexts(person).every((text) => typeof text === 'string'), 'pista desconocida');
  }

  for (const building of village.buildings) {
    invariant(isStanding(building) ? slots.get(building.slotId)?.buildingId === building.id : slots.has(building.slotId), 'solar de edificio inconsistente');
    invariant(score(building.condition), 'conservación fuera de escala');
    const capacity = building.type === 'house' ? building.housingCapacity
      : building.type === 'orchard' ? building.workerCapacity : building.storageCapacity;
    invariant(Number.isSafeInteger(capacity) && capacity > 0, 'capacidad inválida');
  }
  for (const slot of village.constructionSlots) {
    invariant(slot.buildingId === null || (buildings.get(slot.buildingId)?.slotId === slot.id && buildings.get(slot.buildingId)?.collapsedAt === undefined), 'edificio de solar inconsistente');
  }
  uniqueIds(village.housingAssignments.map((assignment) => assignment.residentId), 'Asignaciones de vivienda');
  invariant(village.housingAssignments.length === village.residents.length, 'faltan asignaciones de vivienda');
  const occupancy = new Map<string, number>();
  for (const assignment of village.housingAssignments) {
    const person = people.get(assignment.residentId);
    invariant(person, 'vivienda asignada a persona inexistente');
    invariant((assignment.source === 'player' && assignment.locked)
      || (assignment.source === 'system' && !assignment.locked), 'procedencia o protección de vivienda inválida');
    if (assignment.houseId === null) continue;
    const house = buildings.get(assignment.houseId);
    invariant(house?.type === 'house' && isStanding(house) && person.alive, 'vivienda o morador inválido');
    const occupied = (occupancy.get(house.id) ?? 0) + 1;
    invariant(occupied <= house.housingCapacity, 'se exceden las camas disponibles');
    occupancy.set(house.id, occupied);
  }
  const { food, wood } = village.inventory;
  invariant(isResourceAmount(food) && isResourceAmount(wood), 'inventario inválido');
  const totalStorage = village.buildings.reduce((total, building) => total + (building.type === 'warehouse' && isStanding(building) ? building.storageCapacity : 0), 0);
  invariant(resourceUnits(food) + resourceUnits(wood) <= resourceUnits(totalStorage), 'se excede el almacén compartido');
  const projects = village.constructionProjects ?? [];
  uniqueIds(projects.map((project) => project.slotId), 'Solares reservados');
  let reservedWood = 0;
  for (const project of projects) {
    invariant(slots.get(project.slotId)?.buildingId === null, 'obra en solar inexistente u ocupado');
    invariant(['house', 'orchard', 'warehouse'].includes(project.buildingType), 'edificio de obra desconocido');
    invariant(['prepared', 'working', 'paused'].includes(project.status), 'estado de obra desconocido');
    if (project.materialsConsumed) {
      invariant(Number.isSafeInteger(project.requiredWork) && project.requiredWork! > 0, 'trabajo de obra inválido');
      invariant(Number.isSafeInteger(project.progress) && project.progress > 0 && project.progress < project.requiredWork!, 'progreso de obra inválido');
      invariant(project.status === 'working' || project.status === 'paused', 'obra iniciada sin estado de trabajo');
    } else invariant(project.progress === 0 && project.status !== 'working' && project.requiredWork === undefined, 'obra sin materiales consumidos con progreso');
    invariant(Number.isSafeInteger(project.reservedWood) && project.reservedWood > 0, 'reserva de obra inválida');
    if (!project.materialsConsumed) reservedWood += project.reservedWood;
  }
  invariant(Number.isSafeInteger(reservedWood) && reservedWood <= wood, 'madera reservada superior a existencias');
  const work = village.workAssignments ?? [];
  uniqueIds(work.map((order) => order.residentId), 'Asignaciones de oficio');
  const workersBySite = new Map<string, number>();
  for (const order of work) {
    const person = people.get(order.residentId);
    invariant(person?.alive && person.profession === order.profession && person.workplaceId === order.workplaceId, 'oficio y orden inconsistentes');
    invariant(getEligibleProfessions(getAge(person, village.elapsedDays)).includes(order.profession), 'edad laboral insuficiente');
    invariant(order.authorized && (order.source === 'player' || order.source === 'system'), 'trabajo sin autorización');
    invariant(order.status === 'active' || order.status === 'conflict', 'estado laboral inválido');
    const site = selectWorksites(village, order.profession).find((candidate) => candidate.id === order.workplaceId);
    if (order.status === 'conflict') {
      invariant(!site, 'conflicto laboral sin pérdida del destino');
      continue;
    }
    invariant(site && order.manualLock === !site.flexible, 'destino o protección laboral inválidos');
    const occupied = (workersBySite.get(site.id) ?? 0) + 1;
    invariant(site.capacity === null || occupied <= site.capacity, 'se exceden los puestos de trabajo');
    workersBySite.set(site.id, occupied);
  }
  for (const person of village.residents) {
    invariant(person.profession === null
      ? person.workplaceId === null && !work.some((order) => order.residentId === person.id)
      : work.some((order) => order.residentId === person.id), 'habitante con oficio o destino sin orden laboral');
  }
  if (village.maintenance) {
    invariant(Number.isSafeInteger(village.maintenance.minimumWoodReserve) && village.maintenance.minimumWoodReserve >= 0, 'reserva de mantenimiento inválida');
    uniqueIds(village.maintenance.orders.map((order) => order.buildingId), 'Órdenes de mantenimiento');
    for (const order of village.maintenance.orders) invariant(buildings.has(order.buildingId) && (order.priority === 'normal' || order.priority === 'high'), 'orden de mantenimiento inválida');
  }
  uniqueIds(village.chronicle.map((entry) => entry.id), 'Registro');
  validateEconomy(village);
  validateSurvival(village);
  // Las entregas del día se validan antes de presentar el asalto al terminarlo.
  validateDefense(village, true);
  validateStory(village);
  let previousDay = 0;
  let previousEconomyDay = 0;
  for (const entry of village.chronicle) {
    invariant(Number.isSafeInteger(entry.elapsedDay) && entry.elapsedDay >= previousDay
      && entry.elapsedDay <= village.elapsedDays, 'registro fuera de orden o fecha');
    previousDay = entry.elapsedDay;
    if (entry.type === 'economy_policy_changed') validateEconomyPolicy(village, entry.policy);
    if (entry.type === 'economy_day') {
      invariant(entry.elapsedDay > previousEconomyDay, 'balance económico duplicado o anterior a la fundación');
      previousEconomyDay = entry.elapsedDay;
      const { id: _id, type: _type, elapsedDay: _day, ...summary } = entry;
      validateEconomySummary(summary);
    }
    if ('residentId' in entry && entry.residentId !== undefined) invariant(people.has(entry.residentId), 'registro de persona inexistente');
    if (entry.type === 'building_collapsed' || entry.type === 'building_warning') invariant(buildings.has(entry.buildingId), 'registro de edificio inexistente');
    if (entry.type === 'building_collapsed') invariant(entry.displacedResidentIds.every((id) => people.has(id)), 'desalojo de persona inexistente');
    if (entry.type === 'resident_died') invariant(people.get(entry.residentId)?.medical?.death?.elapsedDay === entry.elapsedDay, 'registro de muerte incoherente');
    if (entry.type === 'village_ended') invariant(village.survival?.endedAt === entry.elapsedDay && entry.populationLost === village.residents.length, 'registro de final incoherente');
    if (entry.type === 'job_changed') {
      invariant((entry.profession === null) === (entry.workplaceId === null), 'registro de oficio sin destino');
      invariant(entry.profession !== null || !entry.manualLock, 'desempleo protegido como puesto');
    }
    if (entry.type === 'construction_changed') invariant(slots.has(entry.slotId), 'registro de obra en solar inexistente');
    if (entry.type === 'maintenance_changed') invariant((entry.buildingId === null && entry.priority === null) || (entry.buildingId !== null && buildings.has(entry.buildingId)), 'registro de mantenimiento inválido');
    if (entry.type === 'building_repaired') invariant(buildings.has(entry.buildingId) && score(entry.condition) && Number.isSafeInteger(entry.woodCost) && entry.woodCost > 0, 'registro de reparación inválido');
    if (entry.type === 'village_expanded') invariant(entry.toGrade > entry.fromGrade && entry.toGrade <= village.grade, 'registro de ampliación inválido');
    if (entry.type === 'housing_changed') {
      invariant(buildings.get(entry.toHouseId)?.type === 'house', 'registro de traslado a vivienda inexistente');
      invariant(entry.fromHouseId === null || buildings.get(entry.fromHouseId)?.type === 'house', 'registro de traslado desde vivienda inexistente');
      invariant(entry.toHouseId !== entry.fromHouseId, 'traslado sin cambio de vivienda');
    }
  }
}

export function validateNewVillage(village: VillageState): void {
  validateVillageState(village);
  const config = getInitialConfig(village.initialConfigId);
  invariant(village.generationVersion === 'families-v1', 'versión de generación desconocida');
  invariant(village.elapsedDays === 0 && village.grade === 1, 'fecha o grado inicial incorrecto');
  invariant(village.residents.length >= config.population[0] && village.residents.length <= config.population[1], 'población inicial fuera de 15–20');
  const children = village.residents.filter((person) => person.initialAge < 18);
  invariant(children.length >= config.children[0] && children.length <= config.children[1], 'preferencia inicial de menores incumplida');
  for (const person of village.residents) {
    invariant(person.alive && person.profession === null && person.workplaceId === null, 'estado vital o laboral inicial incorrecto');
    for (const parentId of person.relations.parentIds) {
      const parent = village.residents.find((candidate) => candidate.id === parentId);
      invariant(parent, 'progenitor inexistente');
      const gap = (getBirthElapsedDay(person) - getBirthElapsedDay(parent)) / DAYS_PER_YEAR;
      invariant(gap >= config.minimumParentGap && gap <= config.maximumParentGap, 'edades familiares fuera de la configuración provisional');
    }
    invariant(JSON.stringify(person.initialClueIds) === JSON.stringify(deriveInitialClues(person.attributes, person.skills)), 'pistas no derivadas de datos reales');
  }
  invariant(village.chronicle.length === 1 && village.chronicle[0]?.type === 'founded'
    && village.chronicle[0].elapsedDay === 0 && village.chronicle[0].villageId === village.id
    && village.chronicle[0].population === village.residents.length, 'registro de fundación incorrecto');
}
