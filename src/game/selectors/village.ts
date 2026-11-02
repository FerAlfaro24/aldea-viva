import { getAge, getCalendarDate, getEligibleProfessions } from '../core/calendar';
import { getClueTexts } from '../generation/clues';
import type { VillageState } from '../models/village';
import { DAYS_PER_MONTH } from '../rules/calendar';

export function selectHousingSummary(village: VillageState) {
  const livingIds = new Set(village.residents.filter((person) => person.alive).map((person) => person.id));
  const active = village.housingAssignments.filter((assignment) => livingIds.has(assignment.residentId));
  return {
    capacity: village.buildings.reduce((total, building) => total + (building.type === 'house' ? building.housingCapacity : 0), 0),
    housed: active.filter((assignment) => assignment.houseId !== null).length,
    unhousedIds: active.filter((assignment) => assignment.houseId === null).map((assignment) => assignment.residentId),
  };
}

export function selectVillageSummary(village: VillageState) {
  const warehouseCapacity = village.buildings.reduce((sum, building) => sum + (building.type === 'warehouse' ? building.storageCapacity : 0), 0);
  return {
    id: village.id, grade: village.grade, date: getCalendarDate(village.elapsedDays),
    population: village.residents.filter((person) => person.alive).length,
    inventory: { ...village.inventory }, warehouseCapacity,
    housing: selectHousingSummary(village), economicSimulationActive: false,
  };
}

// Proyección explícita: nunca entregar el registro interno de habilidades a la UI.
export function selectResidentDetails(village: VillageState, id: string) {
  const person = village.residents.find((candidate) => candidate.id === id);
  if (!person) return null;
  const family = village.families.find((candidate) => candidate.id === person.familyId);
  if (!family) throw new Error('El habitante no tiene un hogar familiar válido.');
  const assignment = village.housingAssignments.find((candidate) => candidate.residentId === id);
  const house = village.buildings.find((candidate) => candidate.id === assignment?.houseId);
  const relative = (relativeId: string) => {
    const found = village.residents.find((candidate) => candidate.id === relativeId);
    if (!found) throw new Error('El parentesco referencia a una persona inexistente.');
    return { id: found.id, displayName: found.displayName };
  };
  const age = getAge(person, village.elapsedDays);
  const skills = {
    farmer: person.skills.farmer.effective, builder: person.skills.builder.effective,
    woodcutter: person.skills.woodcutter.effective, warrior: person.skills.warrior.effective,
  };
  return {
    id: person.id, displayName: person.displayName, age, alive: person.alive,
    birthday: { month: Math.floor((person.birthDayOfYear - 1) / DAYS_PER_MONTH) + 1, day: ((person.birthDayOfYear - 1) % DAYS_PER_MONTH) + 1 },
    family: { id: family.id, displayName: family.displayName, memberIds: [...family.memberIds] },
    relations: {
      parents: person.relations.parentIds.map(relative), children: person.relations.childIds.map(relative),
      siblings: person.relations.siblingIds.map(relative), partner: person.relations.partnerId === null ? null : relative(person.relations.partnerId),
    },
    housing: house ? { id: house.id, displayName: house.displayName } : null,
    profession: person.profession, eligibleProfessions: getEligibleProfessions(age),
    condition: { ...person.condition }, attributes: { ...person.attributes }, skills,
    clues: getClueTexts(person), origin: person.origin,
    history: village.chronicle.filter((entry) => entry.type === 'founded' || ('residentId' in entry && entry.residentId === id))
      .map((entry) => ({ ...entry })),
  };
}
