// Jugador sintético para comprobar partidas largas usando solo órdenes públicas.
// No forma parte del juego ni automatiza las partidas del usuario.
import type { Profession } from '../../src/game/models/simulation';
import { generateVillage } from '../../src/game/generation/village';
import { getAge, getEligibleProfessions } from '../../src/game/core/calendar';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction } from '../../src/game/commands/construction';
import { configureMaintenance } from '../../src/game/commands/maintenance';
import { expandVillage, selectExpansion } from '../../src/game/commands/expansion';
import { resolveStory } from '../../src/game/commands/story';
import { resolveBanditAttack } from '../../src/game/commands/defense';
import { selectDefenseOptions } from '../../src/game/selectors/defense';
import { selectStoryOptions, visitorFreeBeds } from '../../src/game/selectors/story';
import { selectWorkOccupancy, selectWorksites } from '../../src/game/selectors/work';
import { isFitForWork, isGameOver, isStanding } from '../../src/game/selectors/survival';
import { selectStorage } from '../../src/game/selectors/storage';
import { CONSTRUCTION_CATALOG } from '../../src/game/rules/construction';
import { createSave, parseSave } from '../../src/storage/schema';

export type Strategy = 'reserves' | 'fields';
export function runManagedVillage(seed: string, years: number, strategy: Strategy) {
  let world = generateVillage(seed);
  const initialPopulation = world.residents.length;
  const started = performance.now();
  const annual: { day: number; living: number; food: number; wood: number; hunger: number; buildings: number }[] = [];
  let reopenings = 0;
  const fill = (profession: Profession, count: number) => {
    while (world.residents.filter((person) => person.alive && person.profession === profession).length < count) {
      const person = world.residents.filter((resident) => resident.alive && resident.profession === null && isFitForWork(resident, world.elapsedDays)
        && getEligibleProfessions(getAge(resident, world.elapsedDays)).includes(profession)).sort((a, b) => b.skills[profession].effective - a.skills[profession].effective)[0];
      const site = selectWorksites(world, profession).find((candidate) => candidate.capacity === null || selectWorkOccupancy(world, candidate.id) < candidate.capacity);
      if (!person || !site) break;
      world = assignWork(world, person.id, profession, site.id);
    }
  };
  for (let day = 0; day < years * 336 && !isGameOver(world); day++) {
    if (world.pendingDecision?.type === 'bandit_attack') {
      const options = selectDefenseOptions(world);
      const negotiate = options.find((option) => option.tactic === 'negotiate' && !option.unavailable);
      const defense = options.filter((option) => !option.unavailable && option.tactic !== 'sortie').sort((a, b) => b.successPercent - a.successPercent)[0]!;
      world = resolveBanditAttack(world, world.pendingDecision.id, negotiate && world.inventory.food > 200 ? 'negotiate' : defense.tactic);
    }
    if (world.pendingDecision?.type === 'story_event') {
      const pending = world.story!.pending!;
      const options = selectStoryOptions(world);
      const choice = pending.kind === 'visitors' ? visitorFreeBeds(world) >= pending.residents.length ? 'accept' : 'reject'
        : pending.kind === 'urgent-repair' ? 'reinforce' : options.some((option) => option.choice === 'careful' && !option.unavailable) ? 'careful' : 'decline';
      world = resolveStory(world, pending.id, choice);
    }
    if (isGameOver(world)) break;
    for (const order of world.workAssignments ?? []) if (order.status === 'conflict') world = assignWork(world, order.residentId, null, null);
    for (const building of world.buildings.filter(isStanding)) if (!world.maintenance?.orders.some((order) => order.buildingId === building.id)) world = configureMaintenance(world, building.id, 'normal');
    fill('farmer', strategy === 'fields' ? 8 : 6);
    fill('builder', 1);
    if (world.inventory.wood > 200) for (const person of world.residents.filter((resident) => resident.profession === 'woodcutter')) world = assignWork(world, person.id, null, null);
    else if (world.inventory.wood < 100) fill('woodcutter', 2);
    fill('warrior', strategy === 'fields' ? 2 : 4);
    if (world.elapsedDays > 28 && selectExpansion(world).allowed) world = expandVillage(world);
    if (!world.constructionProjects?.length) {
      const orchards = world.buildings.filter((building) => building.type === 'orchard' && isStanding(building)).length;
      const capacity = selectStorage(world).capacity;
      const slot = world.constructionSlots.find((candidate) => candidate.buildingId === null);
      const type = orchards < 3 ? 'orchard' : capacity < 1800 ? 'warehouse' : strategy === 'fields' && orchards < 4 ? 'orchard' : null;
      if (type && slot && selectStorage(world).availableWood >= CONSTRUCTION_CATALOG[type].wood) world = prepareConstruction(world, slot.id, type);
    }
    world = advanceVillageDays(world, 1).state;
    if (world.elapsedDays % 336 === 0) {
      world = parseSave(createSave(world, 1, reopenings + 1, '2026-11-02T00:00:00Z')).village; reopenings++;
      const living = world.residents.filter((person) => person.alive);
      annual.push({ day: world.elapsedDays, living: living.length, food: world.inventory.food, wood: world.inventory.wood,
        hunger: Number((living.reduce((sum, person) => sum + person.condition.hunger, 0) / Math.max(1, living.length)).toFixed(2)), buildings: world.buildings.filter(isStanding).length });
    }
  }
  return { world, summary: { seed, strategy, initialPopulation, annual, endDay: world.elapsedDays,
    living: world.residents.filter((person) => person.alive).length, reopenings,
    raids: world.chronicle.filter((entry) => entry.type === 'bandit_resolved').length,
    stories: world.chronicle.filter((entry) => entry.type === 'story_resolved').length,
    entries: world.chronicle.length, milliseconds: Math.round(performance.now() - started) } };
}
