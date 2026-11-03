import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { moveResident } from '../../src/game/commands/housing';
import { advanceDays } from '../../src/game/core/tick';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { freezeDeep } from '../fixtures/simulation';
import { renderBuildings } from '../../src/ui/buildings';

function scenario() {
  // Reducir ocupación sin eliminar personas permite una plaza libre de prueba
  // incluso cuando esta semilla genera 20 habitantes.
  const generated = generateVillage('vivienda-manual');
  const person = generated.residents[0]!;
  const origin = generated.housingAssignments.find((entry) => entry.residentId === person.id)!.houseId!;
  const destination = generated.buildings.find((building) => building.type === 'house' && building.id !== origin)!;
  const released = generated.housingAssignments.find((entry) => entry.houseId === destination.id);
  const village = { ...generated, housingAssignments: generated.housingAssignments.map((entry) => entry.residentId === released?.residentId ? { ...entry, houseId: null } : entry) };
  validateVillageState(village);
  return { village, person, origin, destination };
}

describe('Órdenes de vivienda protegidas y solares reales', () => {
  it('mueve una persona, registra la orden y no cambia identidad, familia, RNG ni recursos', () => {
    const { village, person, origin, destination } = scenario(); freezeDeep(village);
    const result = moveResident(village, person.id, destination.id);
    expect(result.residents).toBe(village.residents);
    expect(result.families).toBe(village.families);
    expect(result.rng).toBe(village.rng);
    expect(result.inventory).toBe(village.inventory);
    expect(result.housingAssignments.find((entry) => entry.residentId === person.id)).toEqual({ residentId: person.id, houseId: destination.id, source: 'player', locked: true });
    expect(village.housingAssignments.find((entry) => entry.residentId === person.id)!.houseId).toBe(origin);
    expect(result.chronicle.at(-1)).toMatchObject({ type: 'housing_changed', residentId: person.id, fromHouseId: origin, toHouseId: destination.id, elapsedDay: 0 });
    expect(() => validateVillageState(result)).not.toThrow();
    expect(advanceDays(result,28).state.housingAssignments).toEqual(result.housingAssignments);
  });

  it('una casa llena, un destino de otro tipo o una persona inexistente no alteran nada', () => {
    const { village, person, destination } = scenario();
    const full = freezeDeep({ ...village, buildings: village.buildings.map((building) => building.id === destination.id && building.type === 'house'
      ? { ...building, housingCapacity: village.housingAssignments.filter((entry) => entry.houseId === destination.id).length } : building) });
    const before = JSON.stringify(full);
    expect(() => moveResident(full,person.id,destination.id)).toThrow('plazas libres');
    expect(() => moveResident(full,person.id,full.buildings.find((building) => building.type === 'orchard')!.id)).toThrow('vivienda');
    expect(() => moveResident(full,'nadie',destination.id)).toThrow('habitante');
    expect(() => moveResident(full,person.id,'otra-aldea')).toThrow('vivienda');
    expect(JSON.stringify(full)).toBe(before);
  });

  it('elegir la misma casa es una operación sin cambios ni registro adicional', () => {
    const { village, person, origin } = scenario(); freezeDeep(village);
    expect(moveResident(village,person.id,origin)).toBe(village);
  });

  it('varios traslados legítimos el mismo día tienen IDs únicos y pueden guardarse', () => {
    const { village, person, origin, destination } = scenario();
    const first = moveResident(village,person.id,destination.id);
    const second = moveResident(first,person.id,origin);
    const third = moveResident(second,person.id,destination.id);
    expect(third.chronicle.filter((entry) => entry.type === 'housing_changed')).toHaveLength(3);
    expect(new Set(third.chronicle.map((entry) => entry.id)).size).toBe(third.chronicle.length);
    const save = createSave(third,1,1,'2026-11-02T00:00:00Z');
    expect(parseSave(JSON.parse(JSON.stringify(save))).village).toEqual(third);
    expect(() => parseSave({ ...save, schemaVersion: 1 })).toThrow();
  });

  it('no acepta referencias de vivienda rotas dentro del registro', () => {
    const { village, person, destination } = scenario();
    const save = createSave(moveResident(village,person.id,destination.id),1,1,'2026-11-02T00:00:00Z');
    const broken = { ...save, village: { ...save.village, chronicle: save.village.chronicle.map((entry) => entry.type === 'housing_changed' ? { ...entry, toHouseId: 'ausente' } : entry) } };
    expect(() => parseSave(broken)).toThrow('incoherentes');
  });

  it('un fallo de escritura conserva la vivienda anterior; reintentar aplica una sola orden', async () => {
    const { village, person, destination } = scenario();
    const factory = new IDBFactory(); const repository = new IndexedDbSaveRepository('housing',factory);
    await repository.write(createSave(village,1,1,'2026-11-02T00:00:00Z'),null);
    const session = new PersistentSession(repository); await session.load(); session.read({ type: 'continue', slot: 1 });
    const write = vi.spyOn(repository,'write').mockRejectedValueOnce(new Error('interrumpido'));
    await expect(session.perform({ type: 'move-resident', residentId: person.id, houseId: destination.id })).rejects.toThrow();
    expect(session.village).toEqual(village);
    await session.retry();
    expect(session.village!.chronicle.filter((entry) => entry.type === 'housing_changed')).toHaveLength(1);
    write.mockRestore(); const expected = session.village; session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('housing',factory)); await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(expected);
    await reopened.perform({ type: 'advance', days: 28 });
    expect(reopened.village!.housingAssignments).toEqual(expected!.housingAssignments);
    reopened.dispose();
  });

  it('las fichas muestran solares y reservas reales, y escapan nombres', () => {
    const { village, person, destination } = scenario();
    const modified = { ...village, residents: village.residents.map((resident) => resident.id === person.id ? { ...resident, displayName: '<img src=x onerror=alert(1)>' } : resident) };
    const markup = renderBuildings(modified,destination.slotId);
    expect(markup.match(/data-action="inspect-plot"/g)).toHaveLength(10);
    expect(markup).toContain('move-resident-form');
    expect(markup).toContain('&lt;img');
    expect(markup).not.toContain('<img src=x');
    const warehouse = village.buildings.find((building) => building.type === 'warehouse')!;
    const storage = renderBuildings(village,warehouse.slotId);
    expect(storage).toContain(`value="${village.inventory.food + village.inventory.wood}"`);
    expect(storage).not.toMatch(/potentialSecret|historicalBest|experience/);
  });
});
