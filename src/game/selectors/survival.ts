import { getAge, getCalendarDate } from '../core/calendar';
import type { Building, Resident, VillageState } from '../models/village';
import { SURVIVAL_RULES } from '../rules/survival';

export const isStanding = (building: Building): boolean => building.collapsedAt === undefined;
export const isBuildingUsable = (building: Building): boolean => isStanding(building) && building.condition > SURVIVAL_RULES.unusableCondition;
export const isGameOver = (village: VillageState): boolean => !village.residents.some((person) => person.alive);
export function isFitForWork(person: Resident, elapsedDays: number): boolean {
  return person.alive && person.condition.health > 0 && (person.medical?.incapacityUntil ?? 0) <= elapsedDays
    && !person.medical?.illnessActive && (person.medical?.permanentCapacity ?? 1) > 0;
}
export function physicalCapacity(person: Resident): number {
  return person.condition.health / 100 * (1 - person.condition.hunger / 200) * (person.medical?.permanentCapacity ?? 1);
}
export function shelterProtection(village: VillageState, residentId: string): number {
  const assignment = village.housingAssignments.find((entry) => entry.residentId === residentId);
  const house = village.buildings.find((building) => building.id === assignment?.houseId && building.type === 'house');
  return house && isBuildingUsable(house) ? (house.condition - SURVIVAL_RULES.unusableCondition) / (100 - SURVIVAL_RULES.unusableCondition) : 0;
}
export function fragility(person: Resident, elapsedDays: number): number {
  const age = getAge(person, elapsedDays);
  return (age < 12 ? 1.25 : age >= 60 ? 1 + Math.min(0.6, (age - 59) / 50) : 1) * (1.1 - person.attributes.vitality / 500);
}
// No entrega severidad oculta en otoño: solo los indicios ya anunciados.
export function selectWinter(village: VillageState) {
  const date = getCalendarDate(village.elapsedDays);
  const plan = village.survival?.winters.find((winter) => winter.year === date.year);
  if (!plan) return { season: date.season, year: date.year, forecast: null, severity: null };
  return { season: date.season, year: date.year, forecast: plan.outlookIssuedAt !== null ? plan.forecast : null,
    severity: plan.revealedAt !== null ? plan.severity : null };
}
