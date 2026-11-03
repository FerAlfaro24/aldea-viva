import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { prepareConstruction, changeConstruction } from '../../src/game/commands/construction';
import { receiveResource } from '../../src/game/commands/storage';
import { selectStorage } from '../../src/game/selectors/storage';
import { advanceDays } from '../../src/game/core/tick';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { freezeDeep } from '../fixtures/simulation';

const village = () => generateVillage('obras-0.2');
const freeSlots = (world: ReturnType<typeof village>) => world.constructionSlots.filter((slot) => slot.buildingId === null);

describe('Obras preparadas y almacén compartido', () => {
  it('reserva una sola vez, rechaza solar ocupado y respeta materiales ya comprometidos', () => {
    const original = freezeDeep(village()); const slots = freeSlots(original);
    let next = prepareConstruction(original,slots[0]!.id,'warehouse');
    next = prepareConstruction(next,slots[1]!.id,'house');
    expect(selectStorage(next).reservedWood).toBe(70);
    expect(selectStorage(next).availableWood).toBe(original.inventory.wood - 70);
    expect(next.inventory).toBe(original.inventory);
    expect(next.rng).toBe(original.rng);
    expect(() => prepareConstruction(next,slots[0]!.id,'orchard')).toThrow('solar');
    expect(() => prepareConstruction(next,original.constructionSlots[0]!.id,'orchard')).toThrow('solar');
    expect(() => prepareConstruction(next,slots[2]!.id,'warehouse')).toThrow('madera');
    expect(original.constructionProjects).toBeUndefined();
    expect(() => validateVillageState(next)).not.toThrow();
  });

  it('pausar, reanudar, avanzar y cancelar no gastan ni duplican madera', () => {
    const original = freezeDeep(village());
    let next = prepareConstruction(original,freeSlots(original)[0]!.id,'house');
    const project = next.constructionProjects![0]!;
    next = changeConstruction(next,project.id,'pause');
    expect(next.constructionProjects![0]!.status).toBe('paused');
    expect(changeConstruction(next,project.id,'pause')).toBe(next);
    next = changeConstruction(next,project.id,'resume');
    next = advanceDays(next,28).state;
    expect(next.constructionProjects![0]).toEqual(project);
    expect(next.buildings).toBe(original.buildings);
    expect(next.inventory).toBe(original.inventory);
    expect(selectStorage(next).occupied).toBe(selectStorage(original).occupied);
    next = changeConstruction(next,project.id,'cancel');
    expect(selectStorage(next).availableWood).toBe(original.inventory.wood);
    expect(next.constructionProjects).toEqual([]);
    expect(() => changeConstruction(next,project.id,'cancel')).toThrow('obra');
    expect(next.chronicle.filter((entry) => entry.type === 'construction_changed')).toHaveLength(4);
    expect(parseSave(createSave(next,1,1,'2026-11-02T00:00:00Z')).village).toEqual(next);
  });

  it('la recepción parcial comparte capacidad y las reservas siguen ocupando espacio', () => {
    const initial = village();
    const almostFull = { ...initial, inventory: { food: 490, wood: 100 } };
    const reserved = prepareConstruction(almostFull,freeSlots(almostFull)[0]!.id,'house');
    const receipt = receiveResource(reserved,'food',15);
    expect([receipt.accepted,receipt.rejected]).toEqual([10,5]);
    expect(receipt.state.inventory).toEqual({ food: 500, wood: 100 });
    expect(selectStorage(receipt.state).reservedWood).toBe(30);
    expect(receiveResource(receipt.state,'wood',5)).toMatchObject({ accepted: 0, rejected: 5 });
    expect(receiveResource(receipt.state,'wood',0).state).toBe(receipt.state);
    expect(() => receiveResource(reserved,'food',-1)).toThrow();
  });

  it('carga v2 sin alterar el mundo, guarda el proyecto en v3 y recupera pausa y reservas', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('project-compat',factory);
    const original = village();
    const oldSave = { ...createSave(original,1,1,'2026-11-02T00:00:00Z'), schemaVersion: 2 as const };
    await repo.write(oldSave,null);
    const session = new PersistentSession(repo); await session.load(); session.read({ type:'continue',slot:1 });
    expect(session.village).toEqual(original);
    const slot = freeSlots(original)[0]!.id;
    await session.perform({ type:'prepare-construction',slotId:slot,buildingType:'orchard' });
    const id = session.village!.constructionProjects![0]!.id;
    await session.perform({ type:'change-construction',projectId:id,action:'pause' });
    const raw = (await repo.readAll())[1]; expect(parseSave(raw).schemaVersion).toBe(9);
    expect(() => parseSave({ ...parseSave(raw),schemaVersion:2 })).toThrow();
    const saved = session.village; session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('project-compat',factory));
    await reopened.load(); reopened.read({ type:'continue',slot:1 });
    expect(reopened.village).toEqual(saved);
    expect(selectStorage(reopened.village!).reservedWood).toBe(20);
    reopened.dispose();
  });

  it('un fallo de guardado mantiene el solar libre y reintentar crea un solo proyecto', async () => {
    const repo = new IndexedDbSaveRepository('project-failure',new IDBFactory()); const session = new PersistentSession(repo);
    await session.load(); await session.perform({ type:'create',slot:1,seed:'obras-0.2',confirmReplacement:false });
    const before = session.village!;
    const write = vi.spyOn(repo,'write').mockRejectedValueOnce(new Error('interrumpido'));
    await expect(session.perform({ type:'prepare-construction',slotId:freeSlots(before)[0]!.id,buildingType:'house' })).rejects.toThrow();
    expect(session.village).toBe(before);
    await session.retry();
    expect(session.village!.constructionProjects).toHaveLength(1);
    expect(selectStorage(session.village!).reservedWood).toBe(30);
    const valid = createSave(session.village!,1,3,'2026-11-02T00:00:00Z');
    expect(() => parseSave({ ...valid,village:{ ...valid.village,constructionProjects:[valid.village.constructionProjects![0],valid.village.constructionProjects![0]] } })).toThrow();
    expect(() => parseSave({ ...valid,village:{ ...valid.village,constructionProjects:valid.village.constructionProjects!.map((project)=>({...project,progress:1})) } })).toThrow();
    write.mockRestore(); session.dispose();
  });
});
