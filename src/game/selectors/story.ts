import { getCalendarDate } from '../core/calendar';
import type { StoryChoice, StoryEvent } from '../models/story';
import type { Profession } from '../models/simulation';
import type { Resident, VillageState } from '../models/village';
import { STORY_RULES as R } from '../rules/story';
import { selectStorage } from './storage';
import { isBuildingUsable, isFitForWork } from './survival';

export function storyWorkers(village: VillageState): readonly Resident[] {
  const ids = new Set((village.workAssignments ?? []).filter((order) => order.authorized && order.status === 'active').map((order) => order.residentId));
  return village.residents.filter((person) => ids.has(person.id) && isFitForWork(person, village.elapsedDays)).sort((a, b) => a.id.localeCompare(b.id, 'en'));
}
export function eligibleStories(village: VillageState): readonly StoryEvent[] {
  const base = { id: `story:${village.elapsedDays}`, elapsedDay: village.elapsedDays };
  const workers = storyWorkers(village);
  const options: StoryEvent[] = [];
  for (const person of workers) {
    if (person.profession === 'farmer' && getCalendarDate(village.elapsedDays).season !== 'winter' && village.inventory.food >= 3) options.push({ ...base, kind: 'harvest-trial', residentId: person.id });
    if (person.profession === 'woodcutter' && person.condition.health >= 50 && village.inventory.food >= 3) options.push({ ...base, kind: 'forest-route', residentId: person.id });
    if (person.profession === 'builder' && selectStorage(village).availableWood >= 5) {
      const building = village.buildings.find((candidate) => candidate.collapsedAt === undefined && candidate.condition <= 40
        && (person.workplaceId === 'work:builder-auto' || person.workplaceId === candidate.id));
      if (building) options.push({ ...base, kind: 'urgent-repair', residentId: person.id, buildingId: building.id });
    }
  }
  return options;
}
export interface StoryOption {
  readonly choice: StoryChoice;
  readonly successPercent: number;
  readonly foodCost: number;
  readonly woodCost: number;
  readonly reward: number;
  readonly experienceWin: number;
  readonly experienceLoss: number;
  readonly injuryOnLoss: number;
  readonly deathIfInjured: number;
  readonly buildingGain: number;
  readonly unavailable: string;
}
export function selectStoryOptions(village: VillageState): readonly StoryOption[] {
  const event = village.story?.pending;
  if (!event) return [];
  const blank = { successPercent: 100, foodCost: 0, woodCost: 0, reward: 0, experienceWin: 0, experienceLoss: 0, injuryOnLoss: 0, deathIfInjured: 0, buildingGain: 0, unavailable: '' };
  if (event.kind === 'visitors') return [{ ...blank, choice: 'accept' }, { ...blank, choice: 'reject' }];
  const person = village.residents.find((resident) => resident.id === event.residentId);
  if (!person || !isFitForWork(person, village.elapsedDays)) return [{ ...blank, choice: 'decline' }];
  if (event.kind === 'urgent-repair') return (['patch', 'reinforce'] as const).map((choice) => ({ ...blank, choice,
    woodCost: choice === 'patch' ? 2 : 5, buildingGain: choice === 'patch' ? 4 : 12, experienceWin: choice === 'patch' ? 60 : 120,
    unavailable: selectStorage(village).availableWood < (choice === 'patch' ? 2 : 5) ? 'Falta madera libre.' : '' }));
  const profession = event.kind === 'harvest-trial' ? 'farmer' : 'woodcutter';
  return [{ ...blank, choice: 'decline' }, ...(['careful', 'bold'] as const).map((choice) => {
    const rule = R.choices[choice];
    const successPercent = Math.min(95, Math.max(10, Math.round((choice === 'careful' ? 60 : 35) + person.skills[profession].effective * 0.25 + person.attributes.dexterity * 0.1)));
    return { ...blank, ...rule, choice, successPercent, unavailable: village.inventory.food < rule.foodCost ? 'Faltan alimentos para el intento.' : '' };
  })];
}
export function selectKnownTalents(person: Resident) {
  return (person.talents ?? []).map((talent) => ({ ...talent,
    potential: talent.level === 'confirmed' ? person.skills[talent.profession].potentialSecret : null }));
}
export const storyProfession = (event: Exclude<StoryEvent, { kind: 'visitors' }>): Profession => event.kind === 'harvest-trial' ? 'farmer' : event.kind === 'forest-route' ? 'woodcutter' : 'builder';
export function visitorFreeBeds(village: VillageState): number {
  return village.buildings.filter((building) => building.type === 'house' && isBuildingUsable(building)).reduce((total, house) =>
    total + (house.type === 'house' ? house.housingCapacity : 0) - village.housingAssignments.filter((assignment) => assignment.houseId === house.id).length, 0);
}
