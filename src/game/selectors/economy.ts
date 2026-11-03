import { getAge, getCalendarDate } from '../core/calendar';
import type { EconomyPolicy } from '../models/economy';
import type { Resident, VillageState } from '../models/village';
import { DEFAULT_ECONOMY_POLICY, ECONOMY_RULES } from '../rules/economy';
import { roundResource } from '../rules/resources';
import { isBuildingUsable, isFitForWork, physicalCapacity, isStanding } from './survival';

export const selectEconomyPolicy = (village: VillageState): EconomyPolicy => village.economy?.policy ?? DEFAULT_ECONOMY_POLICY;

export function hasActiveWork(village: VillageState, person: Resident): boolean {
  return isFitForWork(person, village.elapsedDays) && (village.workAssignments ?? []).some((order) =>
    order.residentId === person.id && order.status === 'active' && order.authorized);
}

export function seasonalFoodFactor(elapsedDays: number): number {
  const { season, dayOfYear } = getCalendarDate(elapsedDays);
  switch (season) {
    case 'spring': return 0.7 + 0.3 * (dayOfYear - 1) / 83;
    case 'summer': return 1.5;
    case 'autumn': return 1.2 - 0.7 * (dayOfYear - 169) / 83;
    case 'winter': return 0.03;
  }
}

export function selectProduction(village: VillageState, elapsedDays = village.elapsedDays) {
  let food = 0;
  let wood = 0;
  let farmers = 0;
  let woodcutters = 0;
  const orchards = village.buildings.filter((building) => building.type === 'orchard' && isStanding(building)).map((building) => ({ id: building.id, produced: 0, workers: 0 }));
  for (const person of village.residents) {
    if (!hasActiveWork(village, person)) continue;
    const ageFactor = Math.min(1, getAge(person, elapsedDays) / 18);
    const condition = physicalCapacity(person) * ageFactor;
    if (person.profession === 'farmer') {
      const orchard = village.buildings.find((building) => building.id === person.workplaceId && building.type === 'orchard');
      const row = orchards.find((candidate) => candidate.id === orchard?.id);
      if (!orchard || !row || !isBuildingUsable(orchard)) continue;
      const rules = ECONOMY_RULES.farmer;
      const attributes = (person.attributes.endurance + person.attributes.dexterity) / 2;
      const produced = roundResource((rules.base + person.skills.farmer.effective * rules.skill + attributes * rules.attribute)
        * seasonalFoodFactor(elapsedDays) * orchard.condition / 100 * condition);
      row.produced = roundResource(row.produced + produced); row.workers++;
      food = roundResource(food + produced); farmers++;
    } else if (person.profession === 'woodcutter') {
      const rules = ECONOMY_RULES.woodcutter;
      const attributes = (person.attributes.strength + person.attributes.endurance) / 2;
      wood = roundResource(wood + roundResource((rules.base + person.skills.woodcutter.effective * rules.skill + attributes * rules.attribute) * condition));
      woodcutters++;
    }
  }
  return { food, wood, farmers, woodcutters, orchards };
}

export function normalFoodNeed(village: VillageState, person: Resident, elapsedDays = village.elapsedDays): number {
  const age = getAge(person, elapsedDays);
  const rules = ECONOMY_RULES.age;
  const baseline = age < 6 ? rules.infant : age < 12 ? rules.child : age < 18 ? rules.teenager : age >= 60 ? rules.older : rules.adult;
  const activity = person.profession && hasActiveWork(village, person) ? ECONOMY_RULES.activity[person.profession] : 1;
  return baseline * activity * (1 + (100 - person.condition.health) / 500);
}

export function foodPriorityWeight(village: VillageState, person: Resident, policy: EconomyPolicy): number {
  const houseId = village.housingAssignments.find((assignment) => assignment.residentId === person.id)?.houseId;
  const preferred = policy.priority === 'children' ? getAge(person, village.elapsedDays) < 18
    : policy.priority === 'workers' ? hasActiveWork(village, person)
      : policy.priority === 'houses' && houseId !== null && houseId !== undefined && policy.priorityHouseIds.includes(houseId);
  return preferred ? ECONOMY_RULES.preferredWeight : 1;
}

// Solo consulta datos públicos actuales; no avanza el calendario ni extrae azar.
export function selectEconomyForecast(village: VillageState) {
  const nextDay = village.elapsedDays + 1;
  const policy = selectEconomyPolicy(village);
  let minimum = 0;
  let maximum = 0;
  for (const person of village.residents.filter((resident) => resident.alive)) {
    const need = normalFoodNeed(village, person, nextDay);
    const factor = ECONOMY_RULES.rationFactors[policy.ration];
    const variation = ECONOMY_RULES.dailyVariationPercent / 100;
    minimum = roundResource(minimum + roundResource(roundResource(need * (1 - variation)) * factor));
    maximum = roundResource(maximum + roundResource(roundResource(need * (1 + variation)) * factor));
  }
  return { production: selectProduction(village, nextDay), minimum, maximum,
    daysWithoutHarvest: { minimum: maximum > 0 ? Math.floor(village.inventory.food / maximum) : null,
      maximum: minimum > 0 ? Math.floor(village.inventory.food / minimum) : null } };
}
