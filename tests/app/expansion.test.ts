import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { expandVillage, selectExpansion } from '../../src/game/commands/expansion';
import { configureMaintenance, selectMaintenance } from '../../src/game/commands/maintenance';
import { prepareConstruction } from '../../src/game/commands/construction';
import { selectStorage } from '../../src/game/selectors/storage';
import { advanceDays } from '../../src/game/core/tick';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { createSave, parseSave } from '../../src/storage/schema';
import { freezeDeep } from '../fixtures/simulation';

// Escenario que ya ha completado el primer mes, nuevo requisito de ampliación.
const initial = () => ({ ...generateVillage('ampliacion-0.2'), elapsedDays: 28 });
const freeSlot = (village: ReturnType<typeof initial>) => village.constructionSlots.find((slot) => slot.buildingId === null)!.id;

describe('Cierre 0.2: ampliación y mantenimiento preparado', () => {
  it('la ampliación espera al primer mes y conserva los grados ya alcanzados', () => {
    const fresh = generateVillage('ampliacion-0.2');
    expect(selectExpansion(fresh).allowed).toBe(false);
    expect(selectExpansion({ ...fresh, elapsedDays: 27 }).allowed).toBe(false);
    expect(selectExpansion(initial()).allowed).toBe(true);
    expect(selectExpansion({ ...fresh, grade: 2 }).completed).toBe(true);
  });
  it('amplía en el límite aprobado, paga una vez y conserva personas, edificios, proyectos y RNG', () => {
    const original = initial();
    const boundary = freezeDeep(prepareConstruction({ ...original, inventory:{ food:150,wood:80 }, buildings:original.buildings.map((building)=>({...building,condition:80})) },freeSlot(original),'house'));
    expect(selectExpansion(boundary).allowed).toBe(true);
    const expanded = expandVillage(boundary);
    expect(expanded.grade).toBe(2); expect(expanded.constructionSlots).toHaveLength(14);
    expect(new Set(expanded.constructionSlots.map((slot)=>slot.id)).size).toBe(14);
    expect(expanded.constructionSlots.slice(0,10)).toEqual(boundary.constructionSlots);
    expect(expanded.inventory).toEqual({food:150,wood:30});
    expect(selectStorage(expanded).reservedWood).toBe(30);
    expect(expanded.residents).toBe(boundary.residents); expect(expanded.buildings).toBe(boundary.buildings);
    expect(expanded.rng).toBe(boundary.rng); expect(expanded.constructionProjects).toBe(boundary.constructionProjects);
    expect(() => expandVillage(expanded)).toThrow();
    expect(boundary.grade).toBe(1); expect(boundary.inventory.wood).toBe(80);
  });

  it('rechaza alimentos, conservación o madera disponible insuficientes sin cambios parciales', () => {
    const original = freezeDeep(initial());
    const blocked = [
      {...original,inventory:{...original.inventory,food:149}},
      {...original,buildings:original.buildings.map((building,index)=>index===0?{...building,condition:79}:building)},
      prepareConstruction(prepareConstruction(original,original.constructionSlots[7]!.id,'warehouse'),original.constructionSlots[8]!.id,'house'),
    ];
    for (const village of blocked) {
      const before = JSON.stringify(village);
      expect(selectExpansion(village).allowed).toBe(false);
      expect(() => expandVillage(village)).toThrow();
      expect(JSON.stringify(village)).toBe(before);
    }
    expect(selectExpansion({...original,residents:original.residents.slice(0,14)}).requirements[0]!.met).toBe(false);
  });

  it('guarda permisos/prioridad/reserva sin reparar ni gastar y permite retirar la autorización', () => {
    const original = freezeDeep(initial()); const buildingId = original.buildings[0]!.id;
    let next = configureMaintenance(original,buildingId,'high');
    next = configureMaintenance(next,null,null,20);
    expect(selectMaintenance(next)).toEqual({minimumWoodReserve:20,orders:[{buildingId,priority:'high'}]});
    expect(next.inventory).toBe(original.inventory); expect(next.buildings).toBe(original.buildings);
    expect(selectStorage(next).availableWood).toBe(original.inventory.wood);
    expect(advanceDays(next,28).state.maintenance).toEqual(next.maintenance);
    expect(configureMaintenance(next,buildingId,'high')).toBe(next);
    next = configureMaintenance(next,buildingId,null); expect(next.maintenance!.orders).toEqual([]);
    expect(() => configureMaintenance(next,null,null,-1)).toThrow();
    expect(() => configureMaintenance(next,'inexistente','normal')).toThrow();
  });

  it('abre v3, conserva las otras ranuras y recupera ampliación y mantenimiento en el formato actual', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('expansion',factory);
    const previous = prepareConstruction(initial(),freeSlot(initial()),'house');
    const oldSave = { ...createSave(previous,1,1,'2026-11-02T00:00:00Z'),schemaVersion:3 as const };
    await repo.write(oldSave,null);
    const session = new PersistentSession(repo); await session.load();
    expect((await repo.readAll())[1]).toEqual(oldSave);
    for (const slot of [2,3] as const) await session.perform({type:'create',slot,seed:`otra-${slot}`,confirmReplacement:false});
    const before = session.snapshot.session.slots;
    session.read({type:'continue',slot:1});
    await session.perform({type:'set-maintenance',buildingId:previous.buildings[0]!.id,priority:'high'});
    await session.perform({type:'set-maintenance-reserve',wood:20});
    await session.perform({type:'expand-village'});
    expect(parseSave((await repo.readAll())[1]).schemaVersion).toBe(9);
    expect(session.snapshot.session.slots[2]).toEqual(before[2]); expect(session.snapshot.session.slots[3]).toEqual(before[3]);
    const expected = session.village; session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('expansion',factory));
    await reopened.load(); reopened.read({type:'continue',slot:1});
    expect(reopened.village).toEqual(expected); expect(reopened.village!.grade).toBe(2);
    expect(() => parseSave({...createSave(expected!,1,5,'2026-11-02T00:00:00Z'),schemaVersion:3})).toThrow();
    reopened.dispose();
  });

  it('un fallo al ampliar conserva el grado anterior y reintenta sin cobrar ni añadir solares dos veces', async () => {
    const repo = new IndexedDbSaveRepository('expansion-failure',new IDBFactory()); const session = new PersistentSession(repo);
    await repo.write(createSave(initial(),1,1,'2026-11-03T00:00:00Z'),null);
    await session.load(); session.read({type:'continue',slot:1});
    const before = session.village!; const write = vi.spyOn(repo,'write').mockRejectedValueOnce(new Error('interrumpido'));
    await expect(session.perform({type:'expand-village'})).rejects.toThrow(); expect(session.village).toBe(before);
    await session.retry(); expect(session.village!.inventory.wood).toBe(before.inventory.wood-50);
    expect(session.village!.constructionSlots).toHaveLength(14);
    expect(session.village!.chronicle.filter((entry)=>entry.type==='village_expanded')).toHaveLength(1);
    write.mockRestore(); session.dispose();
  });
});
