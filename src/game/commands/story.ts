import type { StoryChoice } from '../models/story';
import type { ChronicleEntry } from '../models/simulation';
import type { VillageState } from '../models/village';
import { selectStoryOptions, storyProfession } from '../selectors/story';
import { isBuildingUsable, isGameOver } from '../selectors/survival';
import { markUnavailableWork } from '../selectors/work';
import { validateVillageState } from '../validation/village';
import { roundResource as round } from '../rules/resources';
import { allocateInitialHousing } from '../generation/housing';
import { awardExperience, discoverTalents } from '../core/storyDay';
import { finishCasualties } from '../core/survivalDay';
import { randomInt } from '../core/rng';
import { receiveResource } from './storage';

export function resolveStory(village: VillageState, eventId: string, choice: StoryChoice): VillageState {
  validateVillageState(village);
  const event = village.story?.pending;
  if (isGameOver(village) || !event || event.id !== eventId || village.pendingDecision?.type !== 'story_event' || village.pendingDecision.id !== event.id) throw new Error('Este suceso ya no está pendiente.');
  const option = selectStoryOptions(village).find((candidate) => candidate.choice === choice);
  if (!option || option.unavailable) throw new Error(option?.unavailable || 'Respuesta no disponible.');
  const { pending: _pending, ...story } = village.story!;
  if (event.kind === 'visitors') {
    const accepted = choice === 'accept';
    // Solo los recién llegados reciben camas libres; ningún habitante previo cambia de casa.
    const houses = village.buildings.filter((building) => building.type === 'house' && isBuildingUsable(building)).flatMap((house) => {
      if (house.type !== 'house') return [];
      const free = house.housingCapacity - village.housingAssignments.filter((assignment) => assignment.houseId === house.id).length;
      return free > 0 ? [{ ...house, housingCapacity: free }] : [];
    });
    const assignments = accepted ? allocateInitialHousing(event.residents, [event.family], houses) : [];
    const next: VillageState = { ...village, story, pendingDecision: null,
      residents: accepted ? [...village.residents, ...event.residents] : village.residents,
      families: accepted ? [...village.families, event.family] : village.families,
      housingAssignments: accepted ? [...village.housingAssignments, ...assignments] : village.housingAssignments,
      chronicle: [...village.chronicle, { id: `resolved:${event.id}`, type: 'visitors_resolved', elapsedDay: village.elapsedDays,
        eventId: event.id, accepted, names: event.residents.map((person) => person.displayName), familyId: accepted ? event.family.id : null,
        residentIds: accepted ? event.residents.map((person) => person.id) : [] }] };
    validateVillageState(next);
    return next;
  }
  let rng = village.rng;
  const draw = (min: number, max: number) => { const result = randomInt(rng, min, max); rng = result.rng; return result.value; };
  const chance = (percent: number) => percent === 100 || (percent > 0 && draw(0, 9999) < percent * 100);
  const success = choice === 'decline' || chance(option.successPercent);
  const profession = storyProfession(event);
  const experience = success ? option.experienceWin : option.experienceLoss;
  let next: VillageState = { ...village, inventory: { food: round(village.inventory.food - option.foodCost), wood: round(village.inventory.wood - option.woodCost) } };
  const delivery = receiveResource(next, event.kind === 'harvest-trial' ? 'food' : 'wood', success ? option.reward : 0);
  next = delivery.state;
  const events: ChronicleEntry[] = [];
  const person = village.residents.find((resident) => resident.id === event.residentId)!;
  let learned = awardExperience(person, profession, experience);
  let healthLost = 0;
  if (!success && chance(option.injuryOnLoss)) {
    if (chance(option.deathIfInjured)) {
      healthLost = person.condition.health;
      learned = { ...learned, alive: false, profession: null, workplaceId: null, condition: { ...learned.condition, health: 0 },
        medical: { ...learned.medical, death: { elapsedDay: village.elapsedDays, cause: 'accident', lastProfession: person.profession } } };
      events.push({ id: `death:${person.id}`, type: 'resident_died', elapsedDay: village.elapsedDays, residentId: person.id, cause: 'accident' });
    } else {
      healthLost = round(Math.min(Math.max(0, person.condition.health - 1), draw(10, 35)));
      const untilElapsedDay = village.elapsedDays + draw(7, 28);
      learned = { ...learned, condition: { ...learned.condition, health: round(person.condition.health - healthLost) },
        medical: { ...learned.medical, illnessActive: true, incapacityUntil: untilElapsedDay,
          episodes: [...(learned.medical?.episodes ?? []), { type: 'injury', cause: 'accident', elapsedDay: village.elapsedDays, untilElapsedDay }] } };
      events.push({ id: `injury:${event.id}:${person.id}`, type: 'medical_episode', action: 'injury', elapsedDay: village.elapsedDays, residentId: person.id, cause: 'accident', untilElapsedDay });
    }
  }
  const buildingId = event.kind === 'urgent-repair' ? event.buildingId : null;
  const building = village.buildings.find((candidate) => candidate.id === buildingId);
  const buildingChange = building ? round(Math.min(100 - building.condition, option.buildingGain)) : 0;
  events.push({ id: `resolved:${event.id}`, type: 'story_resolved', elapsedDay: village.elapsedDays, eventId: event.id, kind: event.kind, choice,
    residentId: person.id, buildingId, successPercent: option.successPercent, success, experience,
    foodCost: option.foodCost, woodCost: option.woodCost, foodGained: event.kind === 'harvest-trial' ? delivery.accepted : 0,
    woodGained: event.kind === 'harvest-trial' ? 0 : delivery.accepted, foodRejected: event.kind === 'harvest-trial' ? delivery.rejected : 0,
    woodRejected: event.kind === 'harvest-trial' ? 0 : delivery.rejected, healthLost, buildingChange });
  next = discoverTalents(finishCasualties(markUnavailableWork({ ...next, rng, story, pendingDecision: null,
    residents: next.residents.map((resident) => resident.id === person.id ? learned : resident),
    buildings: next.buildings.map((candidate) => candidate.id === buildingId ? { ...candidate, condition: round(candidate.condition + buildingChange) } : candidate),
    chronicle: [...next.chronicle, ...events] })), village);
  validateVillageState(next);
  return next;
}
