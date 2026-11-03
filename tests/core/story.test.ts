import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { generateVisitors } from '../../src/game/generation/visitors';
import { assignWork } from '../../src/game/commands/work';
import { resolveStory } from '../../src/game/commands/story';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { awardExperience, discoverTalents, processStoryDay } from '../../src/game/core/storyDay';
import { createRng } from '../../src/game/core/rng';
import { getAge, getBirthElapsedDay } from '../../src/game/core/calendar';
import { eligibleStories, selectStoryOptions } from '../../src/game/selectors/story';
import { selectResidentDetails } from '../../src/game/selectors/village';
import { EMPTY_CHRONICLE_FILTERS, selectChronicle } from '../../src/game/selectors/chronicle';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { renderEvents } from '../../src/ui/events';
import { renderChronicle } from '../../src/ui/village';
import { suppliedVillage } from '../fixtures/suppliedVillage';
import { freezeDeep } from '../fixtures/simulation';
import type { VillageState } from '../../src/game/models/village';
import type { StoryEvent } from '../../src/game/models/story';

function worker(): VillageState {
  const world = suppliedVillage('sucesos-07');
  return assignWork(world, world.residents.find((person) => person.initialAge >= 18)!.id, 'farmer', world.buildings.find((building) => building.type === 'orchard')!.id);
}
function offer(world: VillageState, event: StoryEvent): VillageState {
  return { ...world, story: { nextCheckDay: world.elapsedDays + 14, pending: event },
    pendingDecision: { id: event.id, type: 'story_event', sinceElapsedDay: world.elapsedDays },
    chronicle: [...world.chronicle, { id: `offered:${event.id}`, type: 'story_offered', elapsedDay: world.elapsedDays, eventId: event.id, kind: event.kind,
      ...('residentId' in event ? { residentId: event.residentId } : {}) }] };
}
function trial(seed = 'ensayo-07'): VillageState {
  const world = worker(); const id = world.residents.find((person) => person.profession === 'farmer')!.id;
  return offer({ ...world, rng: createRng(seed) }, { id: 'story:test', elapsedDay: world.elapsedDays, kind: 'harvest-trial', residentId: id });
}
const resolve = (world: VillageState, choice: 'careful' | 'bold' | 'decline' | 'patch' | 'reinforce' | 'accept' | 'reject' = 'careful') => resolveStory(world, world.story!.pending!.id, choice);

describe('0.7: contexto, historias y nuevas llegadas', () => {
  it('solo ofrece oportunidades coherentes y detiene el tiempo en el día de la decisión', () => {
    expect(eligibleStories(generateVillage('sin-oficios'))).toHaveLength(0);
    const base = worker(); expect(eligibleStories(base).some((event) => event.kind === 'harvest-trial')).toBe(true);
    expect(eligibleStories({ ...base, elapsedDays: 252 }).some((event) => event.kind === 'harvest-trial')).toBe(false);
    let result;
    for (let seed = 0; seed < 20; seed++) {
      const candidate = advanceVillageDays({ ...base, rng: createRng(`pausa-${seed}`), story: { nextCheckDay: 9 } }, 28);
      if (candidate.state.pendingDecision?.type === 'story_event') { result = candidate; break; }
    }
    expect(result).toBeDefined(); expect(result!.processedDays).toBe(9); expect(result!.remainingDays).toBe(19);
    expect(advanceVillageDays(result!.state, 28).processedDays).toBe(0);
    const after = resolve(result!.state, 'decline'); expect(after.elapsedDays).toBe(9);
    expect(advanceVillageDays(after, 1).state.elapsedDays).toBe(10);
  });

  it('mismo estado y elección dan idéntico resultado; declinar no consume ni aprende', () => {
    const world = freezeDeep(trial()); const after = resolve(world, 'bold');
    expect(resolve(world, 'bold')).toEqual(after); expect(after.elapsedDays).toBe(world.elapsedDays);
    expect(() => resolveStory(after, 'story:test', 'bold')).toThrow('pendiente');
    const declined = resolve(world, 'decline'); expect(declined.inventory).toEqual(world.inventory); expect(declined.rng).toEqual(world.rng);
    expect(declined.residents.map((person) => person.skills)).toEqual(world.residents.map((person) => person.skills));
    expect(parseSave(createSave(after, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(after);
  });

  it('las probabilidades reales, costes y XP se corresponden con el riesgo elegido', () => {
    const base = trial(); const options = selectStoryOptions(base); const cautious = options.find((option) => option.choice === 'careful')!;
    const bold = options.find((option) => option.choice === 'bold')!; expect(bold.successPercent).toBeLessThan(cautious.successPercent); expect(bold.experienceWin).toBeGreaterThan(cautious.experienceWin);
    let victories = 0, injuries = 0;
    for (let seed = 0; seed < 400; seed++) {
      const world = { ...base, rng: createRng(`riesgo-${seed}`) }; const after = resolve(world, 'bold');
      const entry = after.chronicle.find((event) => event.type === 'story_resolved')!;
      if (entry.type !== 'story_resolved') throw Error('Sin resultado');
      if (entry.success) victories++;
      if (entry.healthLost > 0) injuries++;
      expect(after.inventory.food).toBeCloseTo(world.inventory.food - 6 + entry.foodGained, 2);
      expect(entry.experience).toBe(entry.success ? 300 : 160); validateVillageState(after);
    }
    expect(Math.abs(victories / 4 - bold.successPercent)).toBeLessThan(7); expect(injuries).toBeGreaterThan(0);
    const markup = renderEvents(base); expect(markup).not.toMatch(/potentialSecret/);
    expect(selectStoryOptions({ ...base, inventory: { ...base.inventory, food: 0 } }).find((option) => option.choice === 'bold')!.unavailable).toBeTruthy();
  });

  it('reparación urgente respeta el destino del constructor, reservas y capacidad de almacén', () => {
    let world = suppliedVillage('reparacion-07'); const house = world.buildings[0]!;
    world = { ...world, buildings: world.buildings.map((building) => building.id === house.id ? { ...building, condition: 30 } : building) };
    world = assignWork(world, world.residents.find((person) => person.initialAge >= 18)!.id, 'builder', 'work:builder-auto');
    const event = eligibleStories(world).find((event) => event.kind === 'urgent-repair')!;
    expect(event).toBeDefined(); const pending = offer(world, event); const after = resolve(pending, 'reinforce');
    expect(after.inventory.wood).toBe(world.inventory.wood - 5); expect(after.buildings[0]!.condition).toBe(42); expect(after.workAssignments).toEqual(world.workAssignments);
    const full = trial(); const occupied = full.inventory.food + full.inventory.wood;
    const capped = { ...full, buildings: full.buildings.map((building) => building.type === 'warehouse' ? { ...building, storageCapacity: occupied } : building) };
    let rejected = false;
    for (let seed = 0; seed < 20 && !rejected; seed++) {
      const result = resolve({ ...capped, rng: createRng(`lleno-${seed}`) });
      rejected = result.chronicle.some((entry) => entry.type === 'story_resolved' && entry.foodRejected > 0);
      expect(result.inventory.food + result.inventory.wood).toBeLessThanOrEqual(occupied);
    }
    expect(rejected).toBe(true);
  });

  it('aprendizajes menores son automáticos, proceden de trabajo real y no detienen el tiempo', () => {
    const previous = worker(); const person = previous.residents.find((resident) => resident.profession)!;
    const working = { ...previous, elapsedDays: 1, residents: previous.residents.map((resident) => resident.id === person.id ? awardExperience(resident, 'farmer', 10) : resident), story: { nextCheckDay: 1 } };
    let automatic;
    for (let seed = 0; seed < 40; seed++) { const next = processStoryDay({ ...working, rng: createRng(`menor-${seed}`) }, previous); if (next.chronicle.some((entry) => entry.type === 'work_insight')) { automatic = next; break; } }
    expect(automatic).toBeDefined(); expect(automatic!.pendingDecision).toBeNull();
    expect(automatic!.residents.find((resident) => resident.id === person.id)!.skills.farmer.experience).toBe(30);
  });

  it('revela talento por etapas y trayectoria; solo la confirmación muestra la cifra', () => {
    let world = worker(); const id = world.residents.find((person) => person.profession)!.id;
    world = { ...world, residents: world.residents.map((person) => person.id === id ? { ...person, skills: { ...person.skills, farmer: { effective: 50, historicalBest: 50, experience: 399, potentialSecret: 91 } } } : person) };
    const next = { ...world, residents: world.residents.map((person) => person.id === id ? awardExperience(person, 'farmer', 20) : person) };
    const promising = discoverTalents(next, world); validateVillageState(promising);
    expect(selectResidentDetails(promising, id)!.talents[0]!.potential).toBeNull(); expect(renderEvents(promising)).not.toContain('91 / 100');
    const later = { ...promising, residents: promising.residents.map((person) => person.id === id ? { ...person, skills: { ...person.skills, farmer: { ...person.skills.farmer, experience: 1499 } } } : person) };
    const confirmed = discoverTalents({ ...later, residents: later.residents.map((person) => person.id === id ? awardExperience(person, 'farmer', 20) : person) }, later);
    expect(selectResidentDetails(confirmed, id)!.talents.find((talent) => talent.level === 'confirmed')!.potential).toBe(91);
    expect(renderEvents(confirmed)).toContain('91 / 100'); expect(discoverTalents(confirmed, confirmed)).toBe(confirmed);
    expect(parseSave(createSave(confirmed, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(confirmed);
  });

  it('acepta familias en aldeas antiguas con edad correcta, parentescos y camas libres sin desplazar a nadie', () => {
    const base = { ...suppliedVillage('llegadas-07'), elapsedDays: 336 * 40 + 100 };
    const generated = generateVisitors(base, 'story:late'); const event: StoryEvent = { id: 'story:late', elapsedDay: base.elapsedDays, kind: 'visitors', residents: generated.residents, family: generated.family };
    const world = freezeDeep(offer({ ...base, rng: generated.rng }, event)); const after = resolve(world, 'accept'); validateVillageState(after);
    expect(after.residents).toHaveLength(base.residents.length + event.residents.length); expect(after.housingAssignments.slice(0, base.residents.length)).toEqual(base.housingAssignments);
    for (const person of event.residents) {
      expect(person.profession).toBeNull(); expect(getAge(person, base.elapsedDays)).toBe(person.initialAge); expect(getAge(person, base.elapsedDays + 336)).toBe(person.initialAge + 1);
      expect(getBirthElapsedDay(person)).toBeLessThan(base.elapsedDays);
    }
    const roundTrip = parseSave(createSave(after, 1, 1, '2026-11-02T00:00:00Z')).village; expect(roundTrip).toEqual(after);
    const rejected = resolve(world, 'reject'); expect(rejected.residents).toBe(world.residents); expect(rejected.inventory).toEqual(world.inventory); expect(rejected.rng).toEqual(world.rng);
  });

  it('las llegadas son muy raras y tienen espera anual, sin relación con bajas', () => {
    const base = { ...suppliedVillage('rareza-07'), elapsedDays: 500, story: { nextCheckDay: 500 } }; let visitors = 0;
    for (let seed = 0; seed < 1000; seed++) {
      const world = { ...base, rng: createRng(`visitante-${seed}`) };
      if (processStoryDay(world, world).story?.pending?.kind === 'visitors') visitors++;
      const cooling = { ...world, story: { nextCheckDay: 500, lastVisitorDay: 490 } };
      expect(processStoryDay(cooling, cooling).story?.pending?.kind).not.toBe('visitors');
    }
    expect(visitors).toBeGreaterThan(0); expect(visitors).toBeLessThan(25);
  });

  it('crónica filtra participantes/familias/fecha y pagina diez mil sucesos sin dibujarlos todos', () => {
    const base = resolve(trial(), 'careful'); const person = base.residents.find((resident) => resident.profession)!;
    const filters = { ...EMPTY_CHRONICLE_FILTERS, residentId: person.id, year: '1', season: 'spring' as const };
    expect(selectChronicle(base, filters).entries.some((entry) => entry.type === 'story_resolved')).toBe(true);
    expect(selectChronicle(base, { ...filters, residentId: '', familyId: person.familyId }).entries.some((entry) => entry.type === 'story_resolved')).toBe(true);
    const large: VillageState = { ...base, elapsedDays: 10000, chronicle: [...base.chronicle, ...Array.from({ length: 10000 }, (_, index) => ({ id: `insight:test:${index}`, type: 'work_insight' as const, elapsedDay: index + 1, residentId: person.id, profession: 'farmer' as const, experience: 20 }))] };
    const all = { ...EMPTY_CHRONICLE_FILTERS, kind: 'all' as const }; const page = selectChronicle(large, all);
    expect(page.entries).toHaveLength(25); expect(page.pages).toBeGreaterThan(400);
    const markup = renderChronicle(large, all); expect(markup.match(/class="chronicle-date"/g)).toHaveLength(25); expect(markup.length).toBeLessThan(50000);
    const rng = JSON.stringify(large.rng); renderChronicle(large, all); expect(JSON.stringify(large.rng)).toBe(rng);
  });

  it('abre v8 sin escribir y reintenta una decisión v9 sin repetir el resultado', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('story-retry', factory);
    const old = { ...createSave(generateVillage('antigua-06'), 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 8 as const, gameVersion: '0.6.0-dev' };
    await repo.write(old, null); const session = new PersistentSession(repo); await session.load(); session.read({ type: 'continue', slot: 1 });
    expect((await repo.readAll())[1]).toEqual(old); expect(session.village).toEqual(old.village);
    const pending = createSave(trial(), 1, 2, '2026-11-02T00:00:00Z'); await repo.write(pending, old); await session.load(); session.read({ type: 'continue', slot: 1 });
    expect(session.snapshot.session.route).toBe('events'); const expected = resolve(session.village!, 'bold');
    const write = vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'resolve-story', eventId: 'story:test', choice: 'bold' })).rejects.toThrow();
    expect(session.village).toEqual(pending.village); await session.retry(); expect(session.village).toEqual(expected);
    expect(write.mock.calls[0]![0]).toEqual(write.mock.calls[1]![0]); session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('story-retry', factory)); await reopened.load(); reopened.read({ type: 'continue', slot: 1 }); expect(reopened.village).toEqual(expected); reopened.dispose();
    expect(() => parseSave({ ...pending, schemaVersion: 8 })).toThrow(); expect(() => parseSave({ ...pending, village: { ...pending.village, pendingDecision: null } })).toThrow();
  });
});
