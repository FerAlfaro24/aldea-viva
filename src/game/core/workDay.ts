import { getAge } from './calendar';
import { tickOneDay } from './tick';
import type { AdvanceDays, AdvanceResult, ChronicleEntry, Profession } from '../models/simulation';
import type { AttributeKey, Building, ConstructionProject, Resident, VillageState } from '../models/village';
import { PROFESSIONS } from '../rules/calendar';
import { WORK_RULES } from '../rules/work';
import { getInitialConfig } from '../rules/initialConfig';
import { markUnavailableWork } from '../selectors/work';
import { selectStorage } from '../selectors/storage';
import { validateVillageState } from '../validation/village';
import { roundResource } from '../rules/resources';
import { processEconomyDay } from './economyDay';
import { finishSurvivalDay, prepareSurvivalDay } from './survivalDay';
import { isFitForWork, isGameOver, physicalCapacity } from '../selectors/survival';
import { processDefenseDay } from './defenseDay';
import { validateDefense } from '../validation/defense';
import { processStoryDay } from './storyDay';

const WORK_ATTRIBUTES: Readonly<Record<Profession, readonly AttributeKey[]>> = {
  farmer: ['endurance', 'dexterity'], woodcutter: ['strength', 'endurance'],
  builder: ['strength', 'dexterity'], warrior: ['strength', 'agility', 'endurance'],
};
const round = (value: number, decimals = 3) => Number(value.toFixed(decimals));

export function workEffort(person: Resident, profession: Profession): number {
  const keys = WORK_ATTRIBUTES[profession];
  const attributes = keys.reduce((total, key) => total + person.attributes[key], 0) / keys.length;
  return Math.max(1, Math.round((WORK_RULES.baseEffort + person.skills[profession].effective * WORK_RULES.skillWeight + attributes * WORK_RULES.attributeWeight) * physicalCapacity(person)));
}

function learn(person: Resident, elapsedDays: number, practiced: Profession | undefined): Resident {
  let changed = false;
  const skills = { ...person.skills };
  let attributes = person.attributes;
  const age = getAge(person, elapsedDays);
  if (age >= WORK_RULES.agingFrom) {
    const decline = (age - WORK_RULES.agingFrom + 1) * WORK_RULES.agingPerYearOfAge * (1 - person.attributes.vitality / 200);
    const aged = { ...attributes };
    for (const key of ['strength', 'endurance', 'agility', 'vitality'] as const) aged[key] = round(Math.max(0, aged[key] - decline), 4);
    attributes = aged;
    changed = true;
  }
  for (const profession of PROFESSIONS) {
    const skill = skills[profession];
    if (practiced === profession) {
      const ageFactor = age >= 60 ? 0.8 : age >= 45 ? 0.9 : 1;
      const xp = Math.max(1, Math.round((WORK_RULES.baseExperience + skill.potentialSecret * WORK_RULES.potentialExperienceWeight) * ageFactor));
      const ceiling = Math.max(skill.potentialSecret, skill.historicalBest);
      const recovery = skill.effective < skill.historicalBest ? WORK_RULES.recoveryMultiplier : 1;
      const effective = round(Math.min(ceiling, skill.effective + xp / WORK_RULES.experiencePerSkillPoint * recovery));
      skills[profession] = { ...skill, effective, historicalBest: Math.max(skill.historicalBest, effective), experience: Math.min(1_000_000, skill.experience + xp) };
      const improved = { ...attributes };
      for (const key of WORK_ATTRIBUTES[profession]) improved[key] = round(Math.min(100, improved[key] + xp * WORK_RULES.attributeGainPerExperience), 4);
      attributes = improved;
      changed = true;
    } else if (skill.experience > 0 && skill.effective > 0) {
      skills[profession] = { ...skill, effective: round(Math.max(0, skill.effective - WORK_RULES.dailyDisuse)) };
      changed = true;
    }
  }
  return changed ? { ...person, skills, attributes } : person;
}

function finishedBuilding(village: VillageState, project: ConstructionProject): Building {
  const config = getInitialConfig(village.initialConfigId);
  const number = village.buildings.filter((building) => building.type === project.buildingType).length + 1;
  const base = { id: `built:${project.id}`, slotId: project.slotId, condition: 100 };
  switch (project.buildingType) {
    case 'house': return { ...base, type: 'house', displayName: `Casa ${number}`, housingCapacity: config.bedsPerHouse };
    case 'orchard': return { ...base, type: 'orchard', displayName: `Huerto ${number}`, workerCapacity: config.workersPerOrchard };
    case 'warehouse': return { ...base, type: 'warehouse', displayName: `Almacén ${number}`, storageCapacity: config.storageCapacity };
  }
}

// Recibe el día ya avanzado. Cada persona practica como máximo una vez; sin azar ni reloj real.
function processWorkDay(village: VillageState): VillageState {
  let next = village;
  const practiced = new Map<string, Profession>();
  const people = new Map(village.residents.filter((person) => isFitForWork(person, village.elapsedDays)).map((person) => [person.id, person]));
  const orders = [...(village.workAssignments ?? [])].filter((order) => order.authorized && order.status === 'active' && people.has(order.residentId))
    .sort((left, right) => left.residentId.localeCompare(right.residentId, 'en'));
  for (const order of orders) if (order.profession !== 'builder') practiced.set(order.residentId, order.profession);
  const builders = orders.filter((order) => order.profession === 'builder');
  const maintenance = village.maintenance;
  const repairTasks = (maintenance?.orders ?? []).filter((order) => village.buildings.some((building) => building.id === order.buildingId && building.condition < 100
    && (building.condition <= WORK_RULES.automaticRepairBelow || builders.some((builder) => builder.manualLock && builder.workplaceId === building.id))));
  const tasks = [
    ...repairTasks.filter((order) => order.priority === 'high').map((order) => ({ id: order.buildingId, type: 'repair' as const })),
    ...(village.constructionProjects ?? []).filter((project) => project.status !== 'paused').map((project) => ({ id: project.id, type: 'construction' as const })),
    ...repairTasks.filter((order) => order.priority === 'normal').map((order) => ({ id: order.buildingId, type: 'repair' as const })),
  ];
  for (const task of tasks) {
    const assigned = builders.filter((order) => order.workplaceId === task.id || order.workplaceId === 'work:builder-auto')
      .sort((left, right) => Number(left.manualLock === false) - Number(right.manualLock === false));
    let used = 0;
    let effort = 0;
    let repairCost = 0;
    for (const order of assigned) {
      if (practiced.has(order.residentId) || used >= WORK_RULES.buildersPerTask) continue;
      if (task.type === 'repair') {
        const floor = order.manualLock ? 0 : maintenance?.minimumWoodReserve ?? 0;
        if (selectStorage(next).availableWood - WORK_RULES.repairWoodPerWorkerDay < floor) continue;
        const building = next.buildings.find((candidate) => candidate.id === task.id)!;
        if (building.condition >= 100) break;
        const gain = round(workEffort(people.get(order.residentId)!, 'builder') * WORK_RULES.repairConditionPerEffort);
        next = { ...next, inventory: { ...next.inventory, wood: roundResource(next.inventory.wood - WORK_RULES.repairWoodPerWorkerDay) },
          buildings: next.buildings.map((candidate) => candidate.id === task.id ? { ...candidate, condition: Math.min(100, round(candidate.condition + gain)) } : candidate) };
        repairCost += WORK_RULES.repairWoodPerWorkerDay;
      }
      practiced.set(order.residentId, 'builder');
      effort += workEffort(people.get(order.residentId)!, 'builder');
      used++;
      if (task.type === 'construction') {
        const project = next.constructionProjects!.find((candidate) => candidate.id === task.id)!;
        if (effort >= (project.requiredWork ?? WORK_RULES.constructionWork[project.buildingType]) - project.progress) break;
      }
    }
    if (used === 0) continue;
    if (task.type === 'repair') {
      const building = next.buildings.find((candidate) => candidate.id === task.id)!;
      const entry: ChronicleEntry = { id: `repair:${task.id}:${next.elapsedDays}`, type: 'building_repaired', elapsedDay: next.elapsedDays,
        buildingId: task.id, woodCost: repairCost, condition: building.condition };
      next = { ...next, chronicle: [...next.chronicle, entry] };
      continue;
    }
    const project = next.constructionProjects!.find((candidate) => candidate.id === task.id)!;
    const requiredWork = project.requiredWork ?? WORK_RULES.constructionWork[project.buildingType];
    const progress = Math.min(requiredWork, project.progress + effort);
    const events: ChronicleEntry[] = [];
    const event = (action: 'started' | 'completed'): ChronicleEntry => ({ id: `construction:${project.id}:${action}:${next.elapsedDays}`,
      elapsedDay: next.elapsedDays, type: 'construction_changed', projectId: project.id, slotId: project.slotId,
      buildingType: project.buildingType, action, reservedWood: project.reservedWood, materialsConsumed: true });
    if (!project.materialsConsumed) {
      next = { ...next, inventory: { ...next.inventory, wood: roundResource(next.inventory.wood - project.reservedWood) } };
      events.push(event('started'));
    }
    if (progress >= requiredWork) {
      const building = finishedBuilding(next, project);
      next = { ...next, buildings: [...next.buildings, building],
        constructionSlots: next.constructionSlots.map((slot) => slot.id === project.slotId ? { ...slot, buildingId: building.id } : slot),
        constructionProjects: next.constructionProjects!.filter((candidate) => candidate.id !== project.id) };
      events.push(event('completed'));
    } else next = { ...next, constructionProjects: next.constructionProjects!.map((candidate) => candidate.id === project.id
      ? { ...candidate, status: 'working', requiredWork, progress, materialsConsumed: true } : candidate) };
    next = { ...next, chronicle: [...next.chronicle, ...events] };
  }
  next = markUnavailableWork(next);
  const residents = next.residents.map((person) => person.alive ? learn(person, next.elapsedDays, practiced.get(person.id)) : person);
  if (residents.some((person, index) => person !== next.residents[index])) next = { ...next, residents };
  return next;
}

export function advanceVillageDays(village: VillageState, days: AdvanceDays): AdvanceResult<VillageState> {
  if (![1, 7, 28].includes(days)) throw new RangeError('Solo se permiten avances de 1, 7 o 28 días.');
  validateVillageState(village);
  validateDefense(village);
  let state = village;
  let processedDays = 0;
  const events: ChronicleEntry[] = [];
  let survivalAlert = false;
  while (processedDays < days && state.pendingDecision === null && !isGameOver(state)) {
    const calendar = tickOneDay(state);
    const prepared = prepareSurvivalDay(calendar.state);
    const worked = processWorkDay(prepared);
    const next = processStoryDay(processDefenseDay(finishSurvivalDay(processEconomyDay(worked, prepared.inventory))), state);
    validateVillageState(next);
    validateDefense(next);
    const dailyEvents = next.chronicle.slice(state.chronicle.length);
    events.push(...dailyEvents);
    state = next;
    processedDays++;
    survivalAlert = dailyEvents.some((entry) => entry.type === 'bandit_warning' || entry.type === 'bandit_attack' || entry.type === 'resident_died' || entry.type === 'building_collapsed'
      || entry.type === 'winter_outlook' || entry.type === 'winter_started'
      || (entry.type === 'health_warning' && entry.warning !== 'well')
      || (entry.type === 'building_warning' && entry.level >= 2)
      || (entry.type === 'medical_episode' && entry.action !== 'recovered'));
    if (survivalAlert) break;
  }
  return { state, processedDays, remainingDays: days - processedDays, events, interrupted: state.pendingDecision !== null || isGameOver(state) || survivalAlert };
}
