import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { advanceVillageDays } from '../../src/game/core/workDay';
import { configureEconomy } from '../../src/game/commands/economy';
import { configureMaintenance } from '../../src/game/commands/maintenance';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction } from '../../src/game/commands/construction';
import { DEFAULT_ECONOMY_POLICY } from '../../src/game/rules/economy';
import { isGameOver, isFitForWork, selectWinter, shelterProtection } from '../../src/game/selectors/survival';
import { selectProduction } from '../../src/game/selectors/economy';
import { selectResidentDetails } from '../../src/game/selectors/village';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { renderSurvival } from '../../src/ui/survival';
import { renderResident, filterResidents } from '../../src/ui/residents';
import { EMPTY_FILTERS } from '../../src/app/session';
import { suppliedVillage } from '../fixtures/suppliedVillage';
import { freezeDeep } from '../fixtures/simulation';
import type { VillageState } from '../../src/game/models/village';

function days(world: VillageState, count: number): VillageState {
  let next = world;
  for (let day = 0; day < count && !isGameOver(next); day++) next = advanceVillageDays(next, 1).state;
  return next;
}
function winter(world: VillageState): VillageState {
  return { ...world, elapsedDays: 252, survival: { winters: [{ year: 1, severity: 'harsh', forecast: 'uncertain', outlookIssuedAt: 168, revealedAt: 252 }] } };
}

describe('0.5: supervivencia, conservación y final', () => {
  it('el hambre se acumula, avisa e interrumpe antes de dañar gravemente; alimentar permite recuperarse', () => {
    const original = freezeDeep({ ...generateVillage('hambre-05'), defense: { nextCheckDay: 100000 }, inventory: { food: 0, wood: 90 } });
    const first = advanceVillageDays(original, 28);
    expect(first.processedDays).toBeLessThan(28); expect(first.interrupted).toBe(true);
    expect(first.state.residents.every((person) => person.alive && person.condition.health > 90)).toBe(true);
    expect(first.events.some((entry) => entry.type === 'health_warning' && entry.warning === 'hungry')).toBe(true);
    const hungry = days(first.state, 10);
    expect(hungry.residents.some((person) => person.condition.health < 100)).toBe(true);
    const fed = days(configureEconomy({ ...hungry, inventory: { food: 10000, wood: 90 }, buildings: hungry.buildings.map((building) => building.type === 'warehouse' ? { ...building, storageCapacity: 20000 } : building) }, { ...DEFAULT_ECONOMY_POLICY, ration: 'abundant' }), 28);
    expect(fed.residents[0]!.condition.hunger).toBeLessThan(hungry.residents[0]!.condition.hunger);
    expect(fed.residents[0]!.condition.health).toBeGreaterThan(hungry.residents[0]!.condition.health);
    expect(original.residents.every((person) => person.condition.hunger === 0)).toBe(true);
  });

  it('reducida y emergencia generan riesgos acumulativos aun cuando se sirve todo lo solicitado', () => {
    const original = suppliedVillage('raciones-05');
    const normal = days(original, 28);
    const reduced = days(configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, ration: 'reduced' }), 28);
    const emergency = days(configureEconomy(original, { ...DEFAULT_ECONOMY_POLICY, ration: 'emergency' }), 28);
    expect(normal.residents[0]!.condition.hunger).toBe(0);
    expect(reduced.residents[0]!.condition.hunger).toBeGreaterThan(20);
    expect(emergency.residents[0]!.condition.hunger).toBeGreaterThan(reduced.residents[0]!.condition.hunger);
    expect(emergency.residents.some((person) => person.condition.health < 100)).toBe(true);
  });

  it('el mismo invierno perjudica más sin techo o con una vivienda inutilizable', () => {
    const housed = winter(suppliedVillage('frio-05'));
    const outside = { ...housed, housingAssignments: housed.housingAssignments.map((assignment) => ({ ...assignment, houseId: null })) };
    const healthy = days(housed, 28); const exposed = days(outside, 28);
    expect(healthy.residents.every((person) => person.condition.health >= 99)).toBe(true);
    expect(exposed.residents[0]!.condition.health).toBeLessThan(healthy.residents[0]!.condition.health);
    expect(exposed.residents.some((person) => person.medical?.episodes?.some((episode) => episode.type === 'illness'))).toBe(true);
    const unusable = { ...housed, buildings: housed.buildings.map((building) => building.type === 'house' ? { ...building, condition: 20 } : building) };
    expect(shelterProtection(unusable, unusable.residents[0]!.id)).toBe(0);
    expect(advanceVillageDays(unusable, 1).state.residents[0]!.condition.health).toBeLessThan(100);
  });

  it('los indicios de otoño son sembrados, se guardan y no revelan la severidad real antes del invierno', () => {
    const original = { ...suppliedVillage('otono-05'), elapsedDays: 167 };
    const result = advanceVillageDays(original, 28);
    expect(result.processedDays).toBe(1); expect(result.events.some((entry) => entry.type === 'winter_outlook')).toBe(true);
    expect(advanceVillageDays(original, 28)).toEqual(result);
    expect(selectWinter(result.state).severity).toBeNull();
    const actual = result.state.survival!.winters[0]!.severity;
    expect(selectWinter({ ...result.state, survival: { winters: [{ ...result.state.survival!.winters[0]!, severity: actual === 'harsh' ? 'mild' : 'harsh' }] } })).toEqual(selectWinter(result.state));
    const after = days(result.state, 84);
    expect(selectWinter(after).severity).toBe(actual);
    expect(after.chronicle.filter((entry) => entry.type === 'winter_outlook')).toHaveLength(1);
    expect(after.chronicle.filter((entry) => entry.type === 'winter_started')).toHaveLength(1);
  });

  it('una enfermedad impide trabajar sin borrar el oficio y se recupera con tiempo y cuidados', () => {
    let original = suppliedVillage('incapacidad-05'); const person = original.residents.find((resident) => resident.initialAge >= 18)!;
    original = assignWork(original, person.id, 'woodcutter', 'work:forest');
    original = { ...original, residents: original.residents.map((resident) => resident.id === person.id ? { ...resident,
      medical: { illnessActive: true, incapacityUntil: 3 } } : resident) };
    expect(selectProduction(original).wood).toBe(0);
    const recovering = days(original, 3); const recovered = recovering.residents.find((resident) => resident.id === person.id)!;
    expect(recovered.profession).toBe('woodcutter'); expect(isFitForWork(recovered, recovering.elapsedDays)).toBe(true);
    expect(recovered.skills.woodcutter.experience).toBe(person.skills.woodcutter.experience);
    expect(days(recovering, 1).inventory.wood).toBeGreaterThan(recovering.inventory.wood);
  });

  it('una casa deteriorada conserva sus órdenes manuales al repararse y el derrumbe desaloja con aviso', () => {
    let original = suppliedVillage('vivienda-05'); const house = original.buildings[0]!;
    const resident = original.housingAssignments.find((assignment) => assignment.houseId === house.id)!.residentId;
    original = { ...original, buildings: original.buildings.map((building) => building.id === house.id ? { ...building, condition: 19 } : building),
      housingAssignments: original.housingAssignments.map((assignment) => assignment.residentId === resident ? { ...assignment, source: 'player' as const, locked: true } : assignment) };
    const builder = original.residents.find((person) => person.initialAge >= 18)!;
    let repairing = configureMaintenance(original, house.id, 'high'); repairing = assignWork(repairing, builder.id, 'builder', house.id);
    const repaired = advanceVillageDays(repairing, 1).state;
    expect(shelterProtection(repaired, resident)).toBeGreaterThan(0); expect(repaired.housingAssignments).toEqual(original.housingAssignments);
    const doomed = { ...original, buildings: original.buildings.map((building) => building.id === house.id ? { ...building, condition: 0, zeroConditionDays: 6, warningLevel: 4 } : building) };
    const collapsed = advanceVillageDays(doomed, 1).state;
    const assignment = collapsed.housingAssignments.find((entry) => entry.residentId === resident)!;
    expect(assignment).toMatchObject({ houseId: null, source: 'player', locked: true });
    expect(collapsed.constructionSlots.find((slot) => slot.id === house.slotId)!.buildingId).toBeNull();
    expect(collapsed.chronicle.some((entry) => entry.type === 'building_collapsed' && entry.displacedResidentIds.includes(resident))).toBe(true);
    let rebuilt = prepareConstruction(collapsed, house.slotId, 'house'); rebuilt = assignWork(rebuilt, builder.id, 'builder', 'work:builder-auto');
    rebuilt = days(rebuilt, 14); expect(rebuilt.constructionSlots.find((slot) => slot.id === house.slotId)!.buildingId).not.toBeNull();
    expect(() => validateVillageState(rebuilt)).not.toThrow();
  });

  it('un almacén derrumbado registra pérdidas y cancela reservas imposibles sin duplicar recursos', () => {
    let original = generateVillage('almacen-05'); original = prepareConstruction(original, original.constructionSlots[7]!.id, 'house');
    original = { ...original, buildings: original.buildings.map((building) => building.type === 'warehouse' ? { ...building, condition: 0, zeroConditionDays: 6, warningLevel: 4 } : building) };
    const before = original.inventory; const after = advanceVillageDays(freezeDeep(original), 1).state;
    expect(after.inventory).toEqual({ food: 0, wood: 0 }); expect(after.constructionProjects).toEqual([]);
    const event = after.chronicle.find((entry) => entry.type === 'building_collapsed')!;
    expect(event).toMatchObject({ lostFood: before.food, lostWood: before.wood, cancelledProjectIds: [original.constructionProjects![0]!.id] });
    expect(() => parseSave(createSave(after, 1, 1, '2026-11-02T00:00:00Z'))).not.toThrow();
  });

  it('muertes permanentes liberan trabajo y cama, detienen el tiempo al morir todos y conservan la crónica', () => {
    const initial = generateVillage('final-05');
    const doomed = { ...initial, inventory: { food: 0, wood: 80 }, residents: initial.residents.map((person) => ({ ...person, condition: { health: 0.1, hunger: 100 } })) };
    const result = advanceVillageDays(doomed, 28); const ended = result.state;
    expect(result.processedDays).toBe(1); expect(isGameOver(ended)).toBe(true); expect(ended.survival!.endedAt).toBe(1);
    expect(ended.housingAssignments.every((assignment) => assignment.houseId === null)).toBe(true);
    expect(ended.workAssignments).toEqual([]); expect(ended.chronicle.filter((entry) => entry.type === 'resident_died')).toHaveLength(initial.residents.length);
    expect(advanceVillageDays(ended, 28).state).toBe(ended);
    expect(filterResidents(ended, { ...EMPTY_FILTERS, life: 'dead' })).toHaveLength(initial.residents.length);
    expect(renderSurvival(ended)).toContain('La historia de esta aldea ha terminado');
    expect(renderResident(ended, ended.residents[0]!.id)).toContain('Fallecido');
    const saved = parseSave(createSave(ended, 1, 1, '2026-11-02T00:00:00Z'));
    expect(saved.village).toEqual(ended); expect(() => parseSave({ ...saved, schemaVersion: 6 })).toThrow();
    expect(selectResidentDetails(ended, ended.residents[0]!.id)!.age).toBe(selectResidentDetails({ ...ended, elapsedDays: 100 }, ended.residents[0]!.id)!.age);
  });

  it('la aldea continúa aunque su único superviviente sea menor o anciano', () => {
    for (const kind of ['child', 'old']) {
      const initial = suppliedVillage('ultimo-05');
      const survivor = initial.residents.find((person) => kind === 'child' ? person.initialAge < 12 : person.initialAge >= 60)!;
      const world: VillageState = { ...initial, residents: initial.residents.map((person) => person.id === survivor.id ? person : { ...person, alive: false,
        condition: { health: 0, hunger: 0 }, medical: { death: { elapsedDay: 0, cause: 'hunger', lastProfession: null } } }),
        housingAssignments: initial.housingAssignments.map((assignment) => assignment.residentId === survivor.id ? assignment : { ...assignment, houseId: null }) };
      const after = advanceVillageDays(world, 7).state;
      expect(after.elapsedDays).toBe(7); expect(isGameOver(after)).toBe(false); expect(after.residents.filter((person) => person.alive)).toHaveLength(1);
    }
  });

  it('el rescate excepcional deja salud 1, incapacidad larga y secuelas sin resucitar fallecidos', () => {
    let rescued: VillageState | null = null;
    for (let seed = 0; seed < 64 && !rescued; seed++) {
      const initial = winter(generateVillage(`rescate-${seed}`));
      const world = { ...initial, inventory: { food: 400, wood: 80 }, residents: initial.residents.map((person) => ({ ...person, condition: { health: 0.1, hunger: 0 } })),
        housingAssignments: initial.housingAssignments.map((assignment) => ({ ...assignment, houseId: null })) };
      const after = advanceVillageDays(world, 1).state;
      if (after.residents.some((person) => person.medical?.episodes?.some((episode) => episode.type === 'rescue'))) rescued = after;
    }
    expect(rescued).not.toBeNull();
    const person = rescued!.residents.find((resident) => resident.alive)!;
    expect(person.condition.health).toBe(1); expect(person.medical!.incapacityUntil).toBeGreaterThanOrEqual(rescued!.elapsedDays + 120);
    expect(person.medical!.permanentCapacity).toBeLessThan(1); expect(isFitForWork(person, rescued!.elapsedDays)).toBe(false);
    expect(parseSave(createSave(rescued!, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(rescued);
  });

  it('abre v6 sin simular; fallo/reintento aplica una sola muerte, desgaste y sorteo', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('survival-retry', factory);
    const initial = generateVillage('persistencia-05');
    const world = { ...initial, inventory: { food: 0, wood: 80 }, residents: initial.residents.map((person) => ({ ...person, condition: { health: 0.1, hunger: 100 } })) };
    const legacy = { ...createSave(world, 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 6 as const, gameVersion: '0.4.0-dev' };
    await repo.write(legacy, null); const session = new PersistentSession(repo); await session.load(); session.read({ type: 'continue', slot: 1 });
    expect((await repo.readAll())[1]).toEqual(legacy); expect(session.village).toEqual(world);
    const expected = advanceVillageDays(world, 28).state; vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'advance', days: 28 })).rejects.toThrow(); expect(session.village).toEqual(world);
    await session.retry(); expect(session.village).toEqual(expected); expect(session.snapshot.session.route).toBe('survival');
    expect(parseSave((await repo.readAll())[1]).schemaVersion).toBe(9);
    session.dispose(); const reopened = new PersistentSession(new IndexedDbSaveRepository('survival-retry', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 }); expect(reopened.village).toEqual(expected); reopened.dispose();
  });

  it('100 semillas muestran consecuencias de preparación y abandono sin condenar el inicio', () => {
    let protectedLiving = 0; let protectedTotal = 0; let abandonedDeaths = 0; let abandonedLiving = 0;
    for (let seed = 0; seed < 100; seed++) {
      const initial = seed % 2 === 0 ? winter(suppliedVillage(`equilibrio-${seed}`)) : winter(generateVillage(`equilibrio-${seed}`));
      const prepared = seed % 2 === 0;
      const world = prepared ? initial : { ...initial, inventory: { food: 0, wood: 80 }, housingAssignments: initial.housingAssignments.map((assignment) => ({ ...assignment, houseId: null })) };
      const after = days(world, 28); const living = after.residents.filter((person) => person.alive).length;
      if (prepared) { protectedLiving += living; protectedTotal += world.residents.length; }
      else { abandonedDeaths += world.residents.length - living; abandonedLiving += living; }
    }
    expect(protectedLiving).toBe(protectedTotal); expect(abandonedDeaths).toBeGreaterThan(0); expect(abandonedLiving).toBeGreaterThan(0);
  });
});
