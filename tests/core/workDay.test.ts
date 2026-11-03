import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction, changeConstruction } from '../../src/game/commands/construction';
import { configureMaintenance } from '../../src/game/commands/maintenance';
import { advanceVillageDays, workEffort } from '../../src/game/core/workDay';
import { selectStorage } from '../../src/game/selectors/storage';
import { selectWorkAssignment } from '../../src/game/selectors/work';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { createSave, parseSave } from '../../src/storage/schema';
import type { VillageState } from '../../src/game/models/village';
import { freezeDeep } from '../fixtures/simulation';

const initial = () => generateVillage('trabajo-diario-03');
const adults = (world: VillageState) => world.residents.filter((person) => person.initialAge >= 18).sort((a, b) => a.id.localeCompare(b.id, 'en'));
function withProject() {
  const world = initial();
  return prepareConstruction(world, world.constructionSlots.find((slot) => slot.buildingId === null)!.id, 'house');
}
function withBuilder() {
  const world = withProject();
  return assignWork(world, adults(world)[0]!.id, 'builder', world.constructionProjects![0]!.id);
}

describe('0.3: obra, aprendizaje y trabajo diario', () => {
  it('una obra sin constructor o pausada no progresa ni consume sus materiales', () => {
    const world = freezeDeep(withProject());
    const idle = advanceVillageDays(world, 28).state;
    expect(idle.constructionProjects).toEqual(world.constructionProjects); expect(idle.inventory.wood).toBe(world.inventory.wood);
    const worker = withBuilder(); const project = worker.constructionProjects![0]!;
    const paused = changeConstruction(worker, project.id, 'pause');
    const after = advanceVillageDays(paused, 7).state;
    expect(after.constructionProjects).toEqual(paused.constructionProjects); expect(after.inventory.wood).toBe(paused.inventory.wood);
    expect(after.residents.find((person) => person.profession === 'builder')!.skills.builder.experience).toBe(0);
  });

  it('cobra una vez, conserva progreso al pausar y termina un edificio utilizable sin mover moradores', () => {
    const original: VillageState = freezeDeep({ ...withBuilder(), story: { nextCheckDay: 100000 } }); const project = original.constructionProjects![0]!;
    let world = advanceVillageDays(original, 1).state;
    expect(world.inventory.wood).toBe(original.inventory.wood - 30);
    expect(world.constructionProjects![0]!.materialsConsumed).toBe(true);
    expect(selectStorage(world).reservedWood).toBe(0);
    const progress = world.constructionProjects![0]!.progress;
    world = advanceVillageDays(changeConstruction(world, project.id, 'pause'), 7).state;
    expect(world.constructionProjects![0]!.progress).toBe(progress);
    world = advanceVillageDays(changeConstruction(world, project.id, 'resume'), 28).state;
    expect(world.constructionProjects).toEqual([]); expect(world.buildings).toHaveLength(original.buildings.length + 1);
    const built = world.buildings.find((building) => building.slotId === project.slotId)!;
    expect(built.type).toBe('house'); expect(built.condition).toBeGreaterThan(99);
    expect(world.constructionSlots.find((slot) => slot.id === project.slotId)!.buildingId).toBe(built.id);
    expect(world.inventory.wood).toBe(original.inventory.wood - 30); expect(world.housingAssignments).toBe(original.housingAssignments);
    expect(world.chronicle.filter((entry) => entry.type === 'construction_changed' && entry.action === 'started')).toHaveLength(1);
    expect(world.chronicle.filter((entry) => entry.type === 'construction_changed' && entry.action === 'completed')).toHaveLength(1);
    expect(selectWorkAssignment(world, adults(original)[0]!.id)?.status).toBe('conflict');
    expect(parseSave(createSave(world, 1, 1, '2026-11-02T00:00:00Z')).village).toEqual(world);
    expect(original.inventory.wood).toBeGreaterThan(world.inventory.wood);
  });

  it('cancelar una obra iniciada no devuelve materiales ni deja ocupados el solar o el constructor', () => {
    const started = advanceVillageDays(withBuilder(), 1).state;
    const project = started.constructionProjects![0]!;
    const cancelled = changeConstruction(started, project.id, 'cancel');
    expect(cancelled.inventory).toBe(started.inventory); expect(cancelled.constructionProjects).toEqual([]);
    expect(cancelled.constructionSlots.find((slot) => slot.id === project.slotId)!.buildingId).toBeNull();
    expect(selectStorage(cancelled).reservedWood).toBe(0);
    expect(selectWorkAssignment(cancelled, adults(started)[0]!.id)?.status).toBe('conflict');
    const after = advanceVillageDays(cancelled, 7).state;
    expect(after.inventory.wood).toBe(cancelled.inventory.wood); expect(after.buildings.map((building) => building.id)).toEqual(cancelled.buildings.map((building) => building.id));
  });

  it('limita a tres constructores por obra y la habilidad cambia el rendimiento', () => {
    let world = withProject(); const people = adults(world); const project = world.constructionProjects![0]!;
    for (const person of people.slice(0, 4)) world = assignWork(world, person.id, 'builder', project.id);
    const after = advanceVillageDays(world, 1).state;
    for (const person of people.slice(0, 3)) expect(after.residents.find((candidate) => candidate.id === person.id)!.skills.builder.experience).toBeGreaterThan(0);
    expect(after.residents.find((candidate) => candidate.id === people[3]!.id)!.skills.builder.experience).toBe(0);
    const person = people[0]!;
    expect(workEffort({ ...person, skills: { ...person.skills, builder: { ...person.skills.builder, effective: 90, historicalBest: 90 } } }, 'builder'))
      .toBeGreaterThan(workEffort({ ...person, skills: { ...person.skills, builder: { ...person.skills.builder, effective: 10 } } }, 'builder'));
  });

  it('el potencial influye en aprendizaje, los mayores aprenden y cambiar oficio conserva maestría y XP', () => {
    const original = initial(); const people = adults(original); const ids = people.slice(0, 2).map((person) => person.id);
    let world: VillageState = { ...original, story: { nextCheckDay: 100000 }, residents: original.residents.map((person) => ids.includes(person.id) ? { ...person,
      skills: { ...person.skills, farmer: { ...person.skills.farmer, effective: 10, historicalBest: 10, potentialSecret: person.id === ids[0] ? 90 : 15 } } } : person) };
    const orchard = world.buildings.find((building) => building.type === 'orchard')!.id;
    for (const id of ids) world = assignWork(world, id, 'farmer', orchard);
    world = advanceVillageDays(world, 28).state;
    const fast = world.residents.find((person) => person.id === ids[0])!;
    const slow = world.residents.find((person) => person.id === ids[1])!;
    expect(fast.skills.farmer.experience).toBeGreaterThan(slow.skills.farmer.experience);
    expect(fast.skills.farmer.effective).toBeGreaterThan(slow.skills.farmer.effective);
    expect(slow.skills.farmer.effective).toBeLessThanOrEqual(15);
    const old = adults(world).find((person) => person.initialAge >= 60)!;
    const originalOld = original.residents.find((person) => person.id === old.id)!;
    expect(old.attributes.agility).toBeLessThan(originalOld.attributes.agility);
    world = assignWork(world, old.id, 'woodcutter', 'work:forest');
    expect(advanceVillageDays(world, 1).state.residents.find((person) => person.id === old.id)!.skills.woodcutter.experience).toBeGreaterThan(old.skills.woodcutter.experience);
    world = assignWork(world, fast.id, 'woodcutter', 'work:forest');
    world = advanceVillageDays(world, 7).state;
    const rested = world.residents.find((person) => person.id === fast.id)!.skills.farmer;
    expect(rested.historicalBest).toBe(fast.skills.farmer.historicalBest); expect(rested.experience).toBe(fast.skills.farmer.experience);
    expect(fast.skills.farmer.effective - rested.effective).toBeCloseTo(0.007);
    world = assignWork(world, fast.id, 'farmer', orchard);
    const recovered = advanceVillageDays(world, 1).state.residents.find((person) => person.id === fast.id)!.skills.farmer;
    expect(recovered.effective - rested.effective).toBeGreaterThan(0.2);
    expect(world.inventory.wood).toBeGreaterThan(original.inventory.wood);
    expect(world.inventory.food).toBeLessThan(original.inventory.food);
  });

  it('el reparto flexible atiende prioridades sin desviar al exclusivo ni reclutar desempleados', () => {
    let world = withProject(); const people = adults(world); const buildingId = world.buildings[0]!.id;
    const projectId = world.constructionProjects![0]!.id;
    world = { ...world, buildings: world.buildings.map((building) => building.id === buildingId ? { ...building, condition: 90 } : building) };
    world = configureMaintenance(world, buildingId, 'high');
    world = assignWork(world, people[0]!.id, 'builder', projectId);
    world = assignWork(world, people[1]!.id, 'builder', 'work:builder-auto');
    const expectedWork = workEffort(people[0]!, 'builder');
    const after = advanceVillageDays(world, 1).state;
    expect(after.constructionProjects![0]!.progress).toBe(expectedWork);
    expect(after.buildings[0]!.condition).toBeGreaterThan(90);
    expect(after.inventory.wood).toBe(world.inventory.wood - 31);
    expect(after.workAssignments).toEqual(world.workAssignments);
    expect(after.residents.filter((person) => person.profession === null)).toHaveLength(world.residents.length - 2);
    const full = { ...after, buildings: after.buildings.map((building) => building.id === buildingId ? { ...building, condition: 100 } : building) };
    const next = advanceVillageDays(full, 1).state;
    expect(next.constructionProjects![0]!.progress - after.constructionProjects![0]!.progress).toBe(
      workEffort(after.residents.find((person) => person.id === people[0]!.id)!, 'builder')
      + workEffort(after.residents.find((person) => person.id === people[1]!.id)!, 'builder'));
  });

  it('el mantenimiento requiere autorización, protege obras y respeta el mínimo en modo flexible', () => {
    let world = withProject(); const builder = adults(world)[0]!; const building = world.buildings[0]!;
    world = { ...world, inventory: { food: 200, wood: 40 }, buildings: world.buildings.map((candidate) => candidate.id === building.id ? { ...candidate, condition: 90 } : candidate) };
    world = assignWork(world, builder.id, 'builder', 'work:builder-auto');
    // Pausa la obra: solo estamos comprobando reparaciones.
    world = changeConstruction(world, world.constructionProjects![0]!.id, 'pause');
    expect(advanceVillageDays(world, 1).state.buildings[0]!.condition).toBe(89.98);
    world = configureMaintenance(world, building.id, 'high'); world = configureMaintenance(world, null, null, 10);
    expect(advanceVillageDays(world, 1).state.inventory.wood).toBe(40);
    world = assignWork(world, builder.id, 'builder', building.id);
    world = advanceVillageDays(world, 1).state;
    expect(world.inventory.wood).toBe(39); expect(world.buildings[0]!.condition).toBeGreaterThan(90);
    world = assignWork(world, builder.id, 'builder', 'work:builder-auto'); world = configureMaintenance(world, null, null, 0);
    world = advanceVillageDays(world, 28).state;
    expect(world.buildings[0]!.condition).toBeGreaterThan(95); expect(world.inventory.wood).toBeGreaterThanOrEqual(30);
    expect(selectStorage(world).reservedWood).toBe(30);
    expect(advanceVillageDays(world, 7).state.inventory.wood).toBe(world.inventory.wood);
    expect(world.chronicle.some((entry) => entry.type === 'building_repaired')).toBe(true);
  });

  it('28 días equivalen a 28 avances diarios y una decisión pendiente detiene todo trabajo', () => {
    const original: VillageState = freezeDeep({ ...withBuilder(), story: { nextCheckDay: 100000 } });
    const batchResult = advanceVillageDays(original, 28);
    let daily = original;
    for (let day = 0; day < batchResult.processedDays; day++) daily = advanceVillageDays(daily, 1).state;
    const batch = batchResult.state;
    expect(batch).toEqual(daily); expect(batch.rng.seed).toBe(original.rng.seed);
    expect(batch.rng.state).not.toBe(original.rng.state);
    const blocked = { ...original, pendingDecision: { id: 'pending', type: 'test', sinceElapsedDay: 0 } };
    const result = advanceVillageDays(blocked, 28);
    expect(result.state).toBe(blocked); expect(result.processedDays).toBe(0); expect(result.remainingDays).toBe(28);
  });

  it('migra la obra de v4, preserva el estado ante fallo y reintenta sin doble cobro o experiencia', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('daily-work', factory);
    const legacy = { ...createSave(withProject(), 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 4 as const, gameVersion: '0.2.0' };
    await repo.write(legacy, null);
    const session = new PersistentSession(repo); await session.load(); session.read({ type: 'continue', slot: 1 });
    expect(session.village).toEqual(legacy.village);
    await session.perform({ type: 'assign-work', residentId: adults(session.village!)[0]!.id, profession: 'builder', workplaceId: session.village!.constructionProjects![0]!.id });
    const original = session.village!; const expected = advanceVillageDays(original, 1).state;
    vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'advance', days: 1 })).rejects.toThrow(); expect(session.village).toBe(original);
    await session.retry(); expect(session.village).toEqual(expected);
    const stored = parseSave((await repo.readAll())[1]); expect(stored.schemaVersion).toBe(9); expect(stored.village).toEqual(expected);
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('daily-work', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(expected);
    expect(() => parseSave({ ...stored, schemaVersion: 4 })).toThrow();
    reopened.dispose();
  });
});
