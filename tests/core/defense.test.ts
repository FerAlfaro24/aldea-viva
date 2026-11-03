import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction } from '../../src/game/commands/construction';
import { resolveBanditAttack } from '../../src/game/commands/defense';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { processDefenseDay } from '../../src/game/core/defenseDay';
import { createRng } from '../../src/game/core/rng';
import { detectionChance, selectDefenseOptions, selectGuards } from '../../src/game/selectors/defense';
import { isFitForWork } from '../../src/game/selectors/survival';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { createSession, reduceSession } from '../../src/app/session';
import { renderDefense } from '../../src/ui/defense';
import { freezeDeep } from '../fixtures/simulation';
import { suppliedVillage } from '../fixtures/suppliedVillage';
import type { VillageState } from '../../src/game/models/village';

function guarded(): VillageState {
  let world = suppliedVillage('defensa-06');
  const people = world.residents.filter((person) => person.initialAge >= 18);
  for (let index = 0; index < 4; index++) world = assignWork(world, people[index]!.id, 'warrior', index < 2 ? 'work:guard-village' : 'work:guard-forest');
  return world;
}
function attacking(world = guarded(), seed = 'combate-06'): VillageState {
  const threat = { id: 'bandits:test', detectedAt: world.elapsedDays, arrivalDay: world.elapsedDays, warned: false, attackers: 5, strength: 100, demandFood: 20, demandWood: 10 };
  return { ...world, rng: createRng(seed), defense: { nextCheckDay: world.elapsedDays + 40, threat },
    pendingDecision: { id: threat.id, type: 'bandit_attack', sinceElapsedDay: world.elapsedDays },
    chronicle: [...world.chronicle, { id: 'attack:bandits:test', type: 'bandit_attack', elapsedDay: world.elapsedDays, threatId: threat.id, attackers: 5, surprise: true }] };
}
const resolve = (world: VillageState, tactic: 'defend' | 'protect-storage' | 'sortie' | 'negotiate' = 'defend') => resolveBanditAttack(world, world.defense!.threat!.id, tactic);

describe('0.6: amenazas, decisiones y consecuencias', () => {
  it('un asalto detiene el lote exactamente en su día y conserva la decisión al reabrir', () => {
    const base = suppliedVillage('pausa-06');
    const threat = { id: 'bandits:warning', detectedAt: 0, arrivalDay: 9, warned: true, attackers: 5, strength: 100, demandFood: 20, demandWood: 10 };
    const world: VillageState = { ...base, defense: { nextCheckDay: 45, threat }, chronicle: [...base.chronicle,
      { id: 'warning:test', type: 'bandit_warning', elapsedDay: 0, threatId: threat.id, arrivalDay: 9, attackers: 5 }] };
    const result = advanceVillageDays(freezeDeep(world), 28);
    expect(result.processedDays).toBe(9); expect(result.remainingDays).toBe(19); expect(result.interrupted).toBe(true);
    expect(result.state.pendingDecision?.id).toBe(threat.id);
    const reopened = parseSave(createSave(result.state, 1, 1, '2026-11-02T00:00:00Z')).village;
    expect(advanceVillageDays(reopened, 28).state).toBe(reopened);
    const after = resolve(reopened); expect(after.elapsedDays).toBe(9); expect(after.economy?.lastDay).toEqual(reopened.economy?.lastDay);
    expect(after.pendingDecision).toBeNull(); expect(advanceVillageDays(after, 1).state.elapsedDays).toBe(10);
  });

  it('indicios y sorpresas se generan con RNG guardado y los indicios interrumpen el avance', () => {
    let warning: VillageState | null = null, surprise: VillageState | null = null;
    for (let seed = 0; seed < 80 && (!warning || !surprise); seed++) {
      const base = suppliedVillage(`aviso-${seed}`);
      const result = advanceVillageDays({ ...base, defense: { nextCheckDay: 1 } }, 28);
      if (result.events.some((entry) => entry.type === 'bandit_warning')) { warning = result.state; expect(result.processedDays).toBe(1); }
      if (result.state.pendingDecision?.type === 'bandit_attack') surprise = result.state;
    }
    expect(warning).not.toBeNull(); expect(warning!.pendingDecision).toBeNull(); expect(surprise).not.toBeNull();
    expect(parseSave(createSave(warning!, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(warning);
  });

  it('misma semilla y elección reproducen el resultado sin mutar ni resolver dos veces', () => {
    const world = freezeDeep(attacking()); const result = resolve(world);
    expect(resolve(world)).toEqual(result); expect(result.elapsedDays).toBe(world.elapsedDays);
    expect(() => resolveBanditAttack(result, 'bandits:test', 'defend')).toThrow('pendiente');
    expect(result.chronicle.filter((entry) => entry.type === 'bandit_resolved')).toHaveLength(1);
    expect(parseSave(createSave(result, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(result);
  });

  it('puestos, salud e incapacidades influyen; nunca recluta ni mueve órdenes manuales', () => {
    const world = guarded(); expect(detectionChance(world)).toBe(80);
    const originalOrders = world.workAssignments;
    const sick = { ...world, residents: world.residents.map((person) => person.profession === 'warrior' ? { ...person, medical: { illnessActive: true, incapacityUntil: 7 } } : person) };
    expect(selectGuards(sick)).toHaveLength(0); expect(detectionChance(sick)).toBe(40);
    const healthyOdds = selectDefenseOptions(attacking(world))[0]!.successPercent;
    expect(selectDefenseOptions(attacking(sick))[0]!.successPercent).toBeLessThan(healthyOdds);
    const result = resolve(attacking(world));
    expect(result.workAssignments).toEqual(originalOrders!.filter((order) => result.residents.find((person) => person.id === order.residentId)?.alive));
    expect(result.residents.filter((person) => person.profession && person.profession !== 'warrior')).toHaveLength(0);
    expect(result.residents.every((person) => person.skills.warrior.effective <= Math.max(person.skills.warrior.potentialSecret, person.skills.warrior.historicalBest))).toBe(true);
  });

  it('solo ofrece tácticas posibles; negociar paga exactamente una vez aun si falla', () => {
    const empty = attacking({ ...generateVillage('sin-guardia'), inventory: { food: 0, wood: 0 } });
    expect(selectDefenseOptions(empty).find((option) => option.tactic === 'sortie')?.unavailable).toBeTruthy();
    expect(() => resolve(empty, 'negotiate')).toThrow('recursos');
    const world = attacking(); const after = resolve(world, 'negotiate');
    const entry = after.chronicle.find((event) => event.type === 'bandit_resolved')!;
    if (entry.type !== 'bandit_resolved') throw new Error('Falta resolución');
    expect(entry.paidFood).toBe(20); expect(entry.paidWood).toBe(10);
    expect(after.inventory.food).toBeCloseTo(world.inventory.food - 20 - entry.stolenFood, 2);
    expect(after.inventory.wood).toBeCloseTo(world.inventory.wood - 10 - entry.stolenWood, 2);
    if (entry.success) { expect(entry.injuredIds).toHaveLength(0); expect(entry.deadIds).toHaveLength(0); expect(entry.buildingDamage).toBe(0); expect(entry.stolenFood).toBe(0); }
  });

  it('heridas, muertes, daños y reservas de obra se mantienen coherentes en muchas resoluciones', () => {
    const base = prepareConstruction(guarded(), guarded().constructionSlots.find((plot) => plot.buildingId === null)!.id, 'house');
    let injuries = 0, deaths = 0, damage = 0, cancellations = 0;
    for (let seed = 0; seed < 100; seed++) {
      const world = attacking({ ...base, inventory: { food: 100, wood: 30 }, buildings: base.buildings.map((building) => ({ ...building, condition: 22 })) }, `consecuencias-${seed}`);
      const after = resolve(world, 'sortie'); validateVillageState(after);
      injuries += after.residents.filter((person) => person.medical?.episodes?.some((episode) => episode.type === 'injury')).length;
      deaths += after.residents.filter((person) => !person.alive).length;
      damage += after.buildings.filter((building) => building.condition < 22).length;
      cancellations += 1 - (after.constructionProjects?.length ?? 0);
      expect(after.residents.filter((person) => !person.alive).every((person) => person.workplaceId === null && person.medical?.death?.cause === 'combat')).toBe(true);
      expect(after.residents.filter((person) => person.medical?.episodes?.some((episode) => episode.type === 'injury')).every((person) => !isFitForWork(person, after.elapsedDays))).toBe(true);
      expect(parseSave(createSave(after, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(after);
    }
    expect(injuries).toBeGreaterThan(0); expect(deaths).toBeGreaterThan(0); expect(damage).toBeGreaterThan(0); expect(cancellations).toBeGreaterThan(0);
  });

  it('frecuencia y porcentajes mostrados coinciden con sorteos reales, sin RNG al consultar', () => {
    const base = attacking(); const before = JSON.stringify(base.rng);
    const options = selectDefenseOptions(base); renderDefense(base); expect(JSON.stringify(base.rng)).toBe(before);
    let victories = 0, threats = 0;
    for (let seed = 0; seed < 600; seed++) {
      const result = resolve({ ...base, rng: createRng(`muestra-${seed}`) });
      if (result.chronicle.some((entry) => entry.type === 'bandit_resolved' && entry.success)) victories++;
      const check = processDefenseDay({ ...suppliedVillage('frecuencia'), elapsedDays: 28, rng: createRng(`frecuencia-${seed}`), defense: { nextCheckDay: 28 } });
      if (check.defense?.threat) threats++;
    }
    expect(Math.abs(victories / 6 - options[0]!.successPercent)).toBeLessThan(6);
    expect(Math.abs(threats / 6 - 45)).toBeLessThan(6);
    expect(options.find((option) => option.tactic === 'sortie')!.deathPercent).toBeGreaterThan(options[0]!.deathPercent);
    expect(renderDefense(base)).not.toMatch(/potentialSecret|Potencial/);
  });

  it('bloquea gestión durante el asalto pero permite consulta y resolución', () => {
    const world = attacking(); const session = { ...createSession(), slots: { 1: world, 2: null, 3: null }, activeSlot: 1 as const, route: 'defense' as const };
    expect(() => reduceSession(session, { type: 'assign-work', residentId: world.residents[0]!.id, profession: null, workplaceId: null })).toThrow('asalto');
    expect(reduceSession(session, { type: 'navigate', route: 'residents' }).route).toBe('residents');
    expect(reduceSession(session, { type: 'resolve-attack', threatId: world.defense!.threat!.id, tactic: 'defend' }).slots[1]?.pendingDecision).toBeNull();
  });

  it('abre v7 sin regenerar ni escribir, guarda v8 y reintenta una resolución sin repetir sorteos', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('defense-retry', factory);
    const original = { ...createSave(generateVillage('antigua-05'), 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 7 as const, gameVersion: '0.5.0-dev' };
    await repo.write(original, null);
    const session = new PersistentSession(repo); await session.load(); session.read({ type: 'continue', slot: 1 });
    expect((await repo.readAll())[1]).toEqual(original); expect(session.village).toEqual(original.village);
    const pending = createSave(attacking(), 1, 2, '2026-11-02T00:00:00Z'); await repo.write(pending, original);
    await session.load(); session.read({ type: 'continue', slot: 1 }); expect(session.snapshot.session.route).toBe('defense');
    const expected = resolve(session.village!); const write = vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'resolve-attack', threatId: 'bandits:test', tactic: 'defend' })).rejects.toThrow();
    expect(session.village).toEqual(pending.village); await session.retry(); expect(session.village).toEqual(expected);
    expect(write.mock.calls[0]![0]).toEqual(write.mock.calls[1]![0]);
    session.dispose(); const reopened = new PersistentSession(new IndexedDbSaveRepository('defense-retry', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 }); expect(reopened.village).toEqual(expected); reopened.dispose();
    expect(() => parseSave({ ...pending, schemaVersion: 7 })).toThrow();
    expect(() => parseSave({ ...pending, village: { ...pending.village, pendingDecision: null } })).toThrow();
  });

  it('una herida se recupera sin perder el oficio; una baja del último superviviente termina la aldea', () => {
    const base = guarded(); let injured: VillageState | undefined, ended: VillageState | undefined;
    for (let seed = 0; seed < 120 && (!injured || !ended); seed++) {
      const result = resolve(attacking(base, `recuperar-${seed}`), 'sortie');
      if (!injured && result.residents.some((person) => person.medical?.episodes?.some((episode) => episode.type === 'injury'))) injured = result;
      const onlyId = base.residents.find((person) => person.profession === 'warrior')!.id;
      const lonely: VillageState = { ...base,
        residents: base.residents.map((person) => person.id === onlyId ? person : { ...person, alive: false, profession: null, workplaceId: null, condition: { health: 0, hunger: 0 }, medical: { death: { elapsedDay: 0, cause: 'hunger', lastProfession: person.profession } } }),
        housingAssignments: base.housingAssignments.map((assignment) => assignment.residentId === onlyId ? assignment : { ...assignment, houseId: null }),
        workAssignments: base.workAssignments!.filter((order) => order.residentId === onlyId) };
      const after = resolve(attacking(lonely, `ultima-guardia-${seed}`), 'sortie');
      if (!after.residents.some((person) => person.alive)) ended = after;
    }
    expect(injured).toBeDefined(); expect(ended).toBeDefined();
    expect(ended!.survival?.endedAt).toBe(ended!.elapsedDays); expect(advanceVillageDays(ended!, 28).processedDays).toBe(0);
    expect(parseSave(createSave(ended!, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(ended);
    const personId = injured!.residents.find((person) => person.medical?.episodes?.some((episode) => episode.type === 'injury'))!.id;
    // Aislar la recuperación de nuevas incursiones que necesitarían otra decisión.
    let recovered: VillageState = { ...injured!, defense: { nextCheckDay: 100000 } };
    for (let day = 0; day < 160 && !isFitForWork(recovered.residents.find((person) => person.id === personId)!, recovered.elapsedDays); day++) recovered = advanceVillageDays(recovered, 1).state;
    const person = recovered.residents.find((resident) => resident.id === personId)!;
    expect(isFitForWork(person, recovered.elapsedDays)).toBe(true); expect(person.profession).toBe('warrior');
    expect(recovered.workAssignments?.find((order) => order.residentId === personId)).toEqual(base.workAssignments!.find((order) => order.residentId === personId));
  });
});
