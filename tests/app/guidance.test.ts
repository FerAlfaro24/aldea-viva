import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { applyRecommendedWork } from '../../src/game/commands/recommendedWork';
import { prepareConstruction } from '../../src/game/commands/construction';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { getAge, getEligibleProfessions } from '../../src/game/core/calendar';
import { selectRecommendedWork } from '../../src/game/selectors/recommendedWork';
import { selectGuidance } from '../../src/game/selectors/guidance';
import { selectEconomyForecast } from '../../src/game/selectors/economy';
import { selectWorkOccupancy, selectWorksites } from '../../src/game/selectors/work';
import { renderFirstSteps } from '../../src/ui/help';
import { renderProfessions } from '../../src/ui/professions';
import { createSession, reduceSession } from '../../src/app/session';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { freezeDeep } from '../fixtures/simulation';

const initial = () => generateVillage('opinion-jugador-2026-11-02');

describe('Orientación y propuesta de oficios', () => {
  it('recorre huertos → déficit → obra → nuevos agricultores usando los contratos reales', () => {
    const village = freezeDeep(initial());
    expect(selectGuidance(village).advice.action).toBe('work');
    const plan = selectRecommendedWork(village);
    let next = applyRecommendedWork(village);
    expect(selectEconomyForecast(next)).toEqual(plan.forecast);
    expect(selectGuidance(next).foodCovered).toBe(false);
    const advice = selectGuidance(next).advice;
    expect(advice.action).toBe('build'); expect(advice.buildingType).toBe('orchard');
    next = prepareConstruction(next, advice.plotId!, 'orchard');
    expect(selectGuidance(next).advice.action).toBe('advance');
    for (let i = 0; i < 4 && next.constructionProjects?.length; i++) next = advanceVillageDays(next, 1).state;
    expect(next.buildings.filter((building) => building.type === 'orchard')).toHaveLength(3);
    expect(selectGuidance(next).advice.action).toBe('work');
    next = applyRecommendedWork(next);
    expect(selectGuidance(next).foodCovered).toBe(true);
    expect(next.rng.seed).toBe(village.rng.seed);
    expect(village.residents.every((person) => person.profession === null)).toBe(true);
  });

  it('respeta órdenes manuales, edades, aptitud y cupos; aplicar no avanza ni cambia recursos', () => {
    const original = initial(); const adult = original.residents.find((person) => person.initialAge >= 18)!;
    const manual = assignWork(original, adult.id, 'warrior', 'work:guard-forest');
    const sick = manual.residents.find((person) => person.profession === null && person.initialAge >= 18)!;
    const village = freezeDeep({ ...manual, residents: manual.residents.map((person) => person.id === sick.id
      ? { ...person, medical: { illnessActive: true, incapacityUntil: 20 } } : person) });
    const plan = selectRecommendedWork(village);
    expect(plan.assignments.some((order) => [adult.id, sick.id].includes(order.residentId))).toBe(false);
    for (const order of plan.assignments) {
      const person = village.residents.find((person) => person.id === order.residentId)!;
      expect(getEligibleProfessions(getAge(person, village.elapsedDays))).toContain(order.profession);
    }
    const next = applyRecommendedWork(village);
    expect(next.workAssignments?.find((order) => order.residentId === adult.id)).toEqual(manual.workAssignments![0]);
    for (const profession of ['farmer', 'warrior'] as const) for (const site of selectWorksites(next, profession)) {
      expect(selectWorkOccupancy(next, site.id)).toBeLessThanOrEqual(site.capacity!);
    }
    expect(next.elapsedDays).toBe(village.elapsedDays); expect(next.rng).toBe(village.rng);
    expect(next.inventory).toBe(village.inventory); expect(next.housingAssignments).toBe(village.housingAssignments);
    expect(applyRecommendedWork(next)).toBe(next);
  });

  it('la propuesta no utiliza potenciales secretos, no escribe y conserva la orientación después del día inicial', () => {
    const village = freezeDeep(initial()); const before = JSON.stringify(village);
    const altered = { ...village, residents: village.residents.map((person) => ({ ...person,
      skills: Object.fromEntries(Object.entries(person.skills).map(([key, skill]) => [key, { ...skill, potentialSecret: 987654321 }])) as typeof person.skills })) };
    expect(selectRecommendedWork(altered)).toEqual(selectRecommendedWork(village));
    expect(renderProfessions(altered)).not.toContain('987654321');
    const next = advanceVillageDays(village, 1).state;
    expect(renderFirstSteps(next)).toContain('Primero, pon los huertos a trabajar');
    expect(renderFirstSteps(next)).not.toContain('<details class="panel first-steps"');
    expect(JSON.stringify(village)).toBe(before);
  });

  it('prioriza decisiones pendientes, amenazas y salud; el invierno no se resuelve recomendando otro huerto', () => {
    const village = applyRecommendedWork(initial());
    expect(selectGuidance({ ...village, pendingDecision: { id: 'pending', type: 'story_event', sinceElapsedDay: 0 } }).advice.route).toBe('events');
    expect(selectGuidance({ ...village, residents: village.residents.map((person, i) => i === 0 ? { ...person, condition: { health: 50, hunger: 0 } } : person) }).advice.route).toBe('survival');
    const winter = { ...village, elapsedDays: 252 };
    expect(selectGuidance(winter).advice.title).toBe('El invierno se sostiene con tus reservas');
    const warned = { ...village, defense: { nextCheckDay: 50, threat: { id: 'raid', detectedAt: 0, arrivalDay: 3, warned: true, attackers: 5, strength: 100, demandFood: 20, demandWood: 10 } } };
    expect(selectGuidance(warned).advice.route).toBe('defense');
  });

  it('no aplica propuestas durante sucesos, asaltos ni después del final', () => {
    const created = reduceSession(createSession(), { type: 'create', slot: 1, seed: 'bloqueos-guia', confirmReplacement: false });
    for (const type of ['story_event', 'bandit_attack']) {
      const world = { ...created.slots[1]!, pendingDecision: { id: 'pending', type, sinceElapsedDay: 0 } };
      expect(selectRecommendedWork(world).assignments).toHaveLength(0);
      expect(() => reduceSession({ ...created, slots: { ...created.slots, 1: world } }, { type: 'assign-recommended-work' })).toThrow();
    }
    const ended = { ...created.slots[1]!, residents: created.slots[1]!.residents.map((person) => ({ ...person, alive: false })) };
    expect(selectRecommendedWork(ended).assignments).toHaveLength(0);
    expect(() => applyRecommendedWork(ended)).toThrow();
  });

  it('guarda la propuesta completa una vez y reintenta un fallo sin duplicar nombramientos', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('guia-oficios', factory);
    const session = new PersistentSession(repo); await session.load();
    await session.perform({ type: 'create', slot: 1, seed: 'opinion-jugador-2026-11-02', confirmReplacement: false });
    const original = session.village!; const plan = selectRecommendedWork(original);
    const write = vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'assign-recommended-work' })).rejects.toThrow();
    expect(session.village).toBe(original); await session.retry();
    expect(write).toHaveBeenCalledTimes(2);
    expect(session.village!.chronicle.filter((entry) => entry.type === 'job_changed')).toHaveLength(plan.assignments.length);
    const reopened = new PersistentSession(new IndexedDbSaveRepository('guia-oficios', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(session.village);
    session.dispose(); reopened.dispose();
  });
});
