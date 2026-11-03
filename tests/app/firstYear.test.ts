import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { applyRecommendedWork, applyWorkAdjustments } from '../../src/game/commands/recommendedWork';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction, changeConstruction } from '../../src/game/commands/construction';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { selectWinterPlan } from '../../src/game/selectors/planning';
import { selectGuidance } from '../../src/game/selectors/guidance';
import { selectWorkAdjustments } from '../../src/game/selectors/workAdjustments';
import { selectDefenseOptions } from '../../src/game/selectors/defense';
import { selectEconomyPolicy } from '../../src/game/selectors/economy';
import { renderFirstSteps } from '../../src/ui/help';
import { renderSlots } from '../../src/ui/village';
import { renderAdvanceRecap } from '../../src/ui/chapter';
import { renderWinterPlan } from '../../src/ui/planning';
import { selectRecommendedWork } from '../../src/game/selectors/recommendedWork';
import { createSession, reduceSession } from '../../src/app/session';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { freezeDeep } from '../fixtures/simulation';

const initial = () => generateVillage('opinion-jugador-2026-11-02');

describe('Primer año: planificación, consejos y órdenes revisables', () => {
  it('calcula necesidades con alimentación suficiente; el objetivo baja al avanzar el invierno y no revela su severidad', () => {
    const world = freezeDeep(applyRecommendedWork(initial()));
    const normal = selectWinterPlan(world);
    const emergency = { ...world, economy: { policy: { ...selectEconomyPolicy(world), ration: 'emergency' as const } } };
    expect(selectWinterPlan(emergency).foodTarget).toBe(normal.foodTarget);
    expect(normal.foodTarget).toBeGreaterThan(1500); expect(normal.capacityTarget).toBeLessThanOrEqual(2400);
    const winter = { ...world, elapsedDays: 252 };
    expect(selectWinterPlan({ ...winter, elapsedDays: 280 }).foodTarget).toBeLessThan(selectWinterPlan(winter).foodTarget);
    expect(normal).not.toHaveProperty('severity');
    const crowdedWood = selectWinterPlan({ ...world, inventory: { ...world.inventory, wood: 1000 } });
    expect(crowdedWood.capacityTarget).toBeGreaterThanOrEqual(crowdedWood.foodTarget + 1000);
  });

  it('no recomienda huertos ni obras tardías en víspera del invierno', () => {
    const world = applyRecommendedWork(initial());
    const advice = selectGuidance({ ...world, elapsedDays: 251 }).advice;
    expect(advice.action).toBe('navigate'); expect(advice.route).toBe('economy');
    expect(advice.title).toContain('invierno');
    const lastWinterDay = { ...world, elapsedDays: 335 };
    expect(selectWinterPlan(lastWinterDay).remainingDays).toBe(0);
    expect(renderWinterPlan(lastWinterDay)).toContain('La primavera llega con el próximo día');
  });

  it('resuelve madera insuficiente con poco espacio mediante una política que el jugador debe guardar', () => {
    let world = applyRecommendedWork(initial());
    const slot = world.constructionSlots.find((plot) => !plot.buildingId)!;
    world = prepareConstruction(world, slot.id, 'orchard');
    for (let i = 0; i < 3; i++) world = advanceVillageDays(world, 1).state;
    world = applyRecommendedWork(world);
    const richFood = { ...world, inventory: { food: 575, wood: 5 }, residents: world.residents.map((person) => person.profession === 'woodcutter' ? { ...person, medical: { illnessActive: true, incapacityUntil: 30 } } : person) };
    expect(selectGuidance(richFood).advice.action).toBe('delivery');
    expect(selectEconomyPolicy(richFood).deliveryPriority).toBe('food');
    const prioritized = { ...richFood, economy: { ...richFood.economy, policy: { ...selectEconomyPolicy(richFood), deliveryPriority: 'wood' as const } } };
    expect(selectRecommendedWork(prioritized).assignments.some((order) => order.profession === 'woodcutter')).toBe(true);
  });

  it('reconoce el objetivo alcanzado y nunca pide una ampliación inexistente con todos los solares ocupados', () => {
    let original = applyRecommendedWork(initial());
    original = prepareConstruction(original, original.constructionSlots.find((slot) => !slot.buildingId)!.id, 'orchard');
    for (let i = 0; i < 3; i++) original = advanceVillageDays(original, 1).state;
    original = applyRecommendedWork(original);
    const built = original.buildings.find((building) => building.type === 'house')!;
    const full = { ...original, grade: 2, constructionSlots: Array.from({ length: 14 }, (_, index) => ({ id: `s${index}`, buildingId: built.id })),
      inventory: { food: 2500, wood: 100 }, buildings: original.buildings.map((building) => building.type === 'warehouse' ? { ...building, storageCapacity: 4200 } : building) };
    const enough = selectGuidance(full);
    expect(enough.advice.title).toBe('Objetivo de reservas alcanzado');
    expect(enough.advice.buildingType).toBeUndefined();
    const tooSmall = { ...full, inventory: { food: 300, wood: 100 }, buildings: original.buildings };
    expect(selectGuidance(tooSmall).advice.title).toBe('Has alcanzado el límite de solares');
    expect(selectGuidance(tooSmall).advice.route).toBe('economy');
    const damaged = { ...tooSmall, grade: 1, elapsedDays: 60, buildings: original.buildings.map((building, index) => index === 0 ? { ...building, condition: 70 } : building) };
    expect(selectGuidance(damaged).advice.action).toBe('plot');
    expect(selectGuidance(damaged).advice.plotId).toBe(original.buildings[0]!.slotId);
  });

  it('pausar tala requiere confirmación: conserva el resto de órdenes y permite volver a elegir oficio', () => {
    let world = initial(); const person = world.residents.find((resident) => resident.initialAge >= 18)!;
    world = assignWork(world, person.id, 'woodcutter', 'work:forest');
    world = freezeDeep({ ...world, inventory: { ...world.inventory, wood: 160 } });
    const before = JSON.stringify(world);
    expect(selectWorkAdjustments(world).map((order) => order.residentId)).toEqual([person.id]);
    expect(JSON.stringify(world)).toBe(before);
    const next = applyWorkAdjustments(world);
    expect(next.residents.find((resident) => resident.id === person.id)!.profession).toBeNull();
    expect(next.inventory).toBe(world.inventory); expect(next.rng).toBe(world.rng); expect(next.elapsedDays).toBe(world.elapsedDays);
    expect(applyWorkAdjustments(next)).toBe(next);
    expect(selectWorkAdjustments({ ...world, pendingDecision: { id: 'p', type: 'story_event', sinceElapsedDay: 0 } })).toHaveLength(0);
    expect(() => applyWorkAdjustments({ ...world, pendingDecision: { id: 'p', type: 'bandit_attack', sinceElapsedDay: 0 } })).toThrow();
  });

  it('recupera un constructor exclusivo pendiente sin tocar su oficio ni otra asignación', () => {
    let world = initial(); const person = world.residents.find((resident) => resident.initialAge >= 18)!;
    const slot = world.constructionSlots.find((plot) => !plot.buildingId)!;
    world = prepareConstruction(world, slot.id, 'orchard');
    const project = world.constructionProjects![0]!;
    world = assignWork(world, person.id, 'builder', project.id);
    world = changeConstruction(world, project.id, 'cancel');
    expect(selectGuidance(world).advice.action).toBe('adjust');
    const next = applyWorkAdjustments(world);
    expect(next.workAssignments![0]!.workplaceId).toBe('work:builder-auto');
  });

  it('el final no muestra crecimiento ni historia en marcha y el avance destaca logros reales', () => {
    const world = initial(); const ended = { ...world, residents: world.residents.map((person) => ({ ...person, alive: false })) };
    expect(renderFirstSteps(ended)).not.toContain('La comida puede crecer');
    expect(renderSlots({ ...createSession(), slots: { 1: ended, 2: null, 3: null } })).toContain('Una historia concluida');
    const next = advanceVillageDays(applyRecommendedWork(world), 1).state;
    expect(renderAdvanceRecap(world, next)).toContain('Primera jornada');
    expect(renderAdvanceRecap(next, next)).toBe('');
  });

  it('negociar muestra un precio acorde a las reservas, protegiendo la madera de obras', () => {
    const world = initial(); const threat = { id: 'raid', detectedAt: 0, arrivalDay: 0, warned: true, attackers: 5, strength: 100, demandFood: 20, demandWood: 10 };
    const rich = { ...world, inventory: { food: 2000, wood: 200 }, defense: { nextCheckDay: 50, threat } };
    const quote = selectDefenseOptions(rich).find((option) => option.tactic === 'negotiate')!;
    expect(quote.foodCost).toBe(120); expect(quote.woodCost).toBe(12);
    const defense = selectDefenseOptions(rich).find((option) => option.tactic === 'defend')!;
    expect(defense.foodAfterDefeat).toEqual({ minimum: 1500, maximum: 1800 });
    expect(selectDefenseOptions({ ...rich, elapsedDays: 336 }).find((option) => option.tactic === 'defend')!.foodAfterDefeat).toEqual({ minimum: 1200, maximum: 1700 });
    expect(selectDefenseOptions({ ...rich, inventory: { food: 100, wood: 20 } }).find((option) => option.tactic === 'negotiate')!.foodCost).toBe(20);
  });

  it('un fallo al ajustar guarda/reintenta todo el reparto una sola vez', async () => {
    const repo = new IndexedDbSaveRepository('ajustes-primer-ano', new IDBFactory()); const session = new PersistentSession(repo);
    await session.load(); await session.perform({ type: 'create', slot: 1, seed: 'opinion-jugador-2026-11-02', confirmReplacement: false });
    const adult = session.village!.residents.find((person) => person.initialAge >= 18)!;
    await session.perform({ type: 'assign-work', residentId: adult.id, profession: 'woodcutter', workplaceId: 'work:forest' });
    const original = session.village!;
    // 99 iniciales: autorizar una reserva mínima de 50 no debería sugerir pausarlo.
    expect(selectWorkAdjustments(original)).toHaveLength(0);
    // Simula la llegada legítima a un destino que ya no existe mediante obra cancelada.
    const slot = original.constructionSlots.find((plot) => !plot.buildingId)!;
    await session.perform({ type: 'prepare-construction', slotId: slot.id, buildingType: 'orchard' });
    const project = session.village!.constructionProjects![0]!;
    await session.perform({ type: 'assign-work', residentId: adult.id, profession: 'builder', workplaceId: project.id });
    await session.perform({ type: 'change-construction', projectId: project.id, action: 'cancel' });
    const before = session.village!;
    vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'adjust-work' })).rejects.toThrow(); expect(session.village).toBe(before);
    await session.retry(); expect(session.village!.workAssignments![0]!.workplaceId).toBe('work:builder-auto');
    expect(session.village!.chronicle.length).toBe(before.chronicle.length + 1);
    const blocked = { ...session.snapshot.session, slots: { ...session.snapshot.session.slots, 1: { ...session.village!, pendingDecision: { id: 'p', type: 'story_event', sinceElapsedDay: 0 } } } };
    expect(() => reduceSession(blocked, { type: 'adjust-work' })).toThrow();
    session.dispose();
  });
});
