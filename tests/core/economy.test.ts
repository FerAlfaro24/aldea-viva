import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { configureEconomy } from '../../src/game/commands/economy';
import { prepareConstruction } from '../../src/game/commands/construction';
import { receiveResource } from '../../src/game/commands/storage';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { distributeFood } from '../../src/game/core/economyDay';
import { getAge } from '../../src/game/core/calendar';
import { normalFoodNeed, selectEconomyForecast, selectEconomyPolicy, selectProduction } from '../../src/game/selectors/economy';
import { selectStorage } from '../../src/game/selectors/storage';
import { DEFAULT_ECONOMY_POLICY } from '../../src/game/rules/economy';
import { resourceUnits, roundResource } from '../../src/game/rules/resources';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { renderEconomy } from '../../src/ui/economy';
import type { VillageState } from '../../src/game/models/village';
import type { Ration } from '../../src/game/models/economy';
import { freezeDeep } from '../fixtures/simulation';

const initial = () => generateVillage('economia-04');
function crew(): VillageState {
  let world = initial();
  const people = world.residents.filter((person) => person.initialAge >= 18);
  const orchards = world.buildings.filter((building) => building.type === 'orchard');
  for (let index = 0; index < 4; index++) world = assignWork(world, people[index]!.id, 'farmer', orchards[Math.floor(index / 2)]!.id);
  for (const person of people.slice(4, 6)) world = assignWork(world, person.id, 'woodcutter', 'work:forest');
  return world;
}

describe('0.4: economía diaria y políticas', () => {
  it('sin trabajadores no produce; consume sin inventar salud, hambre ni nuevas profesiones', () => {
    const original = freezeDeep(initial()); const after = advanceVillageDays(original, 1).state; const report = after.economy!.lastDay!;
    expect([report.foodProduced, report.woodProduced]).toEqual([0, 0]);
    expect(after.inventory.food).toBeLessThan(original.inventory.food); expect(after.inventory.wood).toBe(original.inventory.wood);
    expect(roundResource(original.inventory.food - report.foodConsumed)).toBe(after.inventory.food);
    expect(report.allocations).toHaveLength(original.residents.length);
    expect(after.residents.map((person) => [person.profession, person.condition])).toEqual(original.residents.map((person) => [person.profession, person.condition]));
    expect(after.housingAssignments).toBe(original.housingAssignments); expect(original.economy).toBeUndefined();
  });

  it('producción responde a trabajadores, habilidad, conservación y estaciones; el invierno casi no cosecha', () => {
    const original = crew(); const summer = selectProduction(original, 84);
    expect(summer.food).toBeGreaterThan(selectProduction(original, 0).food);
    expect(selectProduction(original, 83).food).toBeGreaterThan(selectProduction(original, 0).food);
    expect(selectProduction(original, 168).food).toBeGreaterThan(selectProduction(original, 251).food);
    const damaged = { ...original, buildings: original.buildings.map((building) => building.type === 'orchard' ? { ...building, condition: 50 } : building) };
    expect(selectProduction(damaged, 84).food).toBeCloseTo(summer.food / 2, 1);
    const skilled = { ...original, residents: original.residents.map((person) => person.profession === 'farmer' ? { ...person,
      skills: { ...person.skills, farmer: { ...person.skills.farmer, effective: 90, historicalBest: 90 } } } : person) };
    expect(selectProduction(skilled, 84).food).toBeGreaterThan(summer.food);
    const yields = (elapsedDays: number) => {
      let current = { ...original, elapsedDays };
      for (let day = 0; day < 28; day++) current = advanceVillageDays(current, 1).state;
      return current.chronicle.reduce((sum, entry) => sum + (entry.type === 'economy_day' ? entry.foodProduced : 0), 0);
    };
    expect(yields(252)).toBeLessThan(yields(84) * 0.05);
    expect(selectProduction(original).wood).toBeGreaterThan(0);
  });

  it('capacidad compartida acepta entregas parciales y el orden elegido decide qué cabe', () => {
    let original = { ...crew(), inventory: { food: 500, wood: 90 } };
    original = prepareConstruction(original, original.constructionSlots.find((slot) => slot.buildingId === null)!.id, 'house');
    const foodFirst = advanceVillageDays(original, 1).state;
    const woodFirst = advanceVillageDays(configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, deliveryPriority: 'wood' }), 1).state;
    const a = foodFirst.economy!.lastDay!; const b = woodFirst.economy!.lastDay!;
    expect(a.foodStored).toBe(10); expect(a.woodStored).toBe(0);
    expect(b.woodStored).toBeGreaterThan(0); expect(b.foodStored).toBeLessThan(a.foodStored);
    for (const world of [foodFirst, woodFirst]) {
      const report = world.economy!.lastDay!;
      expect(roundResource(report.foodStored + report.woodStored)).toBe(10);
      expect(report.foodRejected + report.woodRejected).toBeGreaterThan(0);
      expect(selectStorage(world).reservedWood).toBe(30); expect(selectStorage(world).occupied).toBeLessThanOrEqual(600);
      expect(() => validateVillageState(world)).not.toThrow();
    }
    const receipt = receiveResource({ ...initial(), inventory: { food: 499.99, wood: 100 } }, 'food', 1.23);
    expect([receipt.accepted, receipt.rejected]).toEqual([0.01, 1.22]);
    expect(receipt.state.inventory.food).toBe(500);
    expect(() => receiveResource(initial(), 'food', 0.001)).toThrow();
  });

  it('las cuatro raciones modifican lo solicitado y se conservan sin cambiar de oficio o consumir azar al elegirlas', () => {
    const original = freezeDeep(initial()); const consumed: number[] = [];
    for (const ration of ['emergency', 'reduced', 'normal', 'abundant'] as const) {
      const world = configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, ration });
      expect(world.rng).toBe(original.rng); expect(world.inventory).toBe(original.inventory);
      const after = advanceVillageDays(world, 1).state;
      expect(after.economy!.policy.ration).toBe(ration);
      expect(after.economy!.lastDay!.foodMissing).toBe(0);
      consumed.push(after.economy!.lastDay!.foodConsumed);
    }
    expect(consumed).toEqual([...consumed].sort((a, b) => a - b)); expect(new Set(consumed).size).toBe(4);
    expect(configureEconomy(original, DEFAULT_ECONOMY_POLICY)).toBe(original);
    expect(() => configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, ration: 'desconocida' as Ration })).toThrow();
    expect(() => configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, priorityHouseIds: ['inexistente'] })).toThrow();
  });

  it('menores, trabajadores y viviendas reciben preferencia proporcional sin excluir al resto', () => {
    let original = initial(); const person = original.residents.find((resident) => resident.initialAge >= 18)!;
    original = assignWork(original, person.id, 'woodcutter', 'work:forest');
    original = { ...original, inventory: { food: 5, wood: 80 } };
    const houseId = original.buildings.find((building) => building.type === 'house')!.id;
    for (const priority of ['balanced', 'children', 'workers', 'houses'] as const) {
      const world = advanceVillageDays(configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, priority, priorityHouseIds: [houseId] }), 1).state;
      const report = world.economy!.lastDay!;
      expect(report.foodConsumed).toBe(5); expect(report.foodMissing).toBeGreaterThan(0);
      expect(report.allocations.every((allocation) => allocation.served > 0 && allocation.served <= allocation.requested)).toBe(true);
      const preferred = (id: string) => priority === 'children' ? getAge(world.residents.find((resident) => resident.id === id)!, world.elapsedDays) < 18
        : priority === 'workers' ? id === person.id : world.housingAssignments.some((assignment) => assignment.residentId === id && assignment.houseId === houseId);
      if (priority !== 'balanced') {
        const ratio = (group: boolean) => {
          const rows = report.allocations.filter((allocation) => preferred(allocation.residentId) === group);
          return rows.reduce((sum, allocation) => sum + allocation.served / allocation.requested, 0) / rows.length;
        };
        expect(ratio(true)).toBeGreaterThan(ratio(false));
      }
    }
    expect(distributeFood([{ requested: 1, weight: 2 }, { requested: 1, weight: 1 }], 0.03, 1)).toEqual([0.02, 0.01]);
    expect(distributeFood([{ requested: 1, weight: 2 }, { requested: 1, weight: 1 }], 10, 1)).toEqual([1, 1]);
  });

  it('publica límites de consumo y proyecciones sin consumir azar ni revelar potenciales', () => {
    const original = freezeDeep(crew()); const before = JSON.stringify(original);
    const forecast = selectEconomyForecast(original);
    expect(selectEconomyForecast(original)).toEqual(forecast); expect(JSON.stringify(original)).toBe(before);
    const after = advanceVillageDays(original, 1).state; const report = after.economy!.lastDay!;
    expect(report.foodRequested).toBeGreaterThanOrEqual(forecast.minimum); expect(report.foodRequested).toBeLessThanOrEqual(forecast.maximum);
    for (const row of report.allocations) {
      const person = after.residents.find((resident) => resident.id === row.residentId)!;
      const baseline = normalFoodNeed(after, person);
      expect(row.need).toBeGreaterThanOrEqual(roundResource(baseline * 0.95)); expect(row.need).toBeLessThanOrEqual(roundResource(baseline * 1.05));
    }
    const secret = { ...after, residents: after.residents.map((person) => ({ ...person, skills: { ...person.skills,
      farmer: { ...person.skills.farmer, potentialSecret: 987654321 } } })) };
    const markup = renderEconomy(secret);
    expect(markup).not.toMatch(/potentialSecret|987654321/); expect(markup).toContain('Reparto por persona');
  });

  it('avance mensual equivale a avances diarios con idéntico RNG, políticas y balances', () => {
    const original: VillageState = freezeDeep({ ...crew(), story: { nextCheckDay: 100000 } }); let daily = original;
    for (let day = 0; day < 28; day++) daily = advanceVillageDays(daily, 1).state;
    const monthly = advanceVillageDays(original, 28).state;
    expect(monthly).toEqual(daily); expect(monthly.chronicle.filter((entry) => entry.type === 'economy_day')).toHaveLength(28);
    expect(monthly.residents.map((person) => person.condition)).toEqual(original.residents.map((person) => person.condition));
  });

  it('lee v5 sin tocar datos y migra al primer avance con política normal y las demás ranuras intactas', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('economy-legacy', factory);
    const legacy = { ...createSave(crew(), 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 5 as const, gameVersion: '0.3.0-dev' };
    await repo.write(legacy, null); const session = new PersistentSession(repo); await session.load();
    expect((await repo.readAll())[1]).toEqual(legacy);
    await session.perform({ type: 'create', slot: 2, seed: 'economia-otra', confirmReplacement: false });
    const other = session.snapshot.session.slots[2]; session.read({ type: 'continue', slot: 1 });
    expect(session.village).toEqual(legacy.village); expect(selectEconomyPolicy(session.village!)).toEqual(DEFAULT_ECONOMY_POLICY);
    await session.perform({ type: 'advance', days: 7 }); const stored = parseSave((await repo.readAll())[1]);
    expect(stored.schemaVersion).toBe(9); expect(stored.village.economy!.policy).toEqual(DEFAULT_ECONOMY_POLICY);
    expect(session.snapshot.session.slots[2]).toEqual(other);
    const expected = session.village!; session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('economy-legacy', factory)); await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(expected); expect(() => parseSave({ ...stored, schemaVersion: 5 })).toThrow();
    reopened.dispose();
  });

  it('fallar y reintentar no duplica consumo, cosechas ni extracciones del RNG', async () => {
    const repo = new IndexedDbSaveRepository('economy-retry', new IDBFactory()); const session = new PersistentSession(repo);
    await session.load(); await session.perform({ type: 'create', slot: 1, seed: 'economia-04', confirmReplacement: false });
    const original = session.village!; const policy = { ...DEFAULT_ECONOMY_POLICY, ration: 'reduced' as const, priority: 'children' as const };
    const write = vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'set-economy-policy', policy })).rejects.toThrow(); expect(session.village).toBe(original);
    await session.retry(); expect(session.village!.economy!.policy).toEqual(policy);
    const beforeDay = session.village!; const expected = advanceVillageDays(beforeDay, 7).state;
    write.mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'advance', days: 7 })).rejects.toThrow(); expect(session.village).toBe(beforeDay);
    await session.retry(); expect(session.village).toEqual(expected);
    expect(session.village!.chronicle.filter((entry) => entry.type === 'economy_day')).toHaveLength(7);
    session.dispose();
  });

  it('rechaza balances, raciones y repartos dañados sin aceptar formatos futuros', () => {
    const world = advanceVillageDays(crew(), 1).state; const save = createSave(world, 1, 1, '2026-11-02T00:00:00Z');
    const report = world.economy!.lastDay!;
    for (const lastDay of [{ ...report, closingFood: report.closingFood + 1 }, { ...report, allocations: [...report.allocations, report.allocations[0]!] },
      { ...report, foodConsumed: -1 }]) {
      expect(() => parseSave({ ...save, village: { ...world, economy: { ...world.economy, lastDay } } })).toThrow();
    }
    expect(() => parseSave({ ...save, schemaVersion: 99 })).toThrow();
    const empty = advanceVillageDays({ ...initial(), inventory: { food: 0, wood: 80 } }, 28).state;
    expect(empty.inventory.food).toBe(0); expect(empty.residents.some((person) => person.condition.hunger > 0)).toBe(true);
    expect(empty.economy!.lastDay!.foodMissing).toBeGreaterThan(0);
    expect(empty.economy!.lastDay!.allocations.reduce((sum, row) => sum + resourceUnits(row.served), 0)).toBe(0);
  });
});
