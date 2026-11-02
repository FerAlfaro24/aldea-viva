import { afterEach, describe, expect, it, vi } from 'vitest';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { advanceDays } from '../../src/game/core/tick';
import { generateVillage } from '../../src/game/generation/village';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { createSave, parseSave } from '../../src/storage/schema';
import { SaveConflictError } from '../../src/storage/repository';

afterEach(() => vi.restoreAllMocks());
const timestamp = '2026-11-02T18:00:00.000Z';

describe('IndexedDB transaccional y tres partidas independientes', () => {
  it('una pestaña antigua no sobrescribe una aldea borrada y recreada con igual revisión', async () => {
    const repo = new IndexedDbSaveRepository('recreada', new IDBFactory());
    const first = createSave(generateVillage('misma-semilla'), 1, 1, timestamp);
    await repo.write(first, null);
    await repo.delete(1, first);
    const recreated = createSave(first.village, 1, 1, timestamp);
    await repo.write(recreated, null);
    await expect(repo.write(createSave(advanceDays(first.village, 28).state, 1, 2, timestamp), first)).rejects.toBeInstanceOf(SaveConflictError);
    expect((await repo.readAll())[1]).toEqual(recreated);
    repo.close();
  });
  it('SAVE-01/02: crea, carga y recupera las tres partidas en otra conexión', async () => {
    const factory = new IDBFactory();
    const first = new IndexedDbSaveRepository('test', factory);
    const saves = ([1, 2, 3] as const).map((slot) => createSave(generateVillage(`espacio-${slot}`), slot, 1, timestamp));
    for (const save of saves) await first.write(save, null);
    first.close();
    const reopened = new IndexedDbSaveRepository('test', factory);
    const raw = await reopened.readAll();
    for (const save of saves) expect(parseSave(raw[save.slot], save.slot)).toEqual(save);
    reopened.close();
  });

  it('SAVE-05: guarda el estado posterior al avance, incluyendo RNG e identidades', async () => {
    const repo = new IndexedDbSaveRepository('rng', new IDBFactory());
    const original = generateVillage('rng-persistente');
    const first = createSave(original, 1, 1, timestamp);
    await repo.write(first, null);
    const advanced = advanceDays(original, 28).state;
    const second = createSave(advanced, 1, 2, timestamp);
    await repo.write(second, first);
    const raw = await repo.readAll();
    expect(parseSave(raw[1], 1).village).toEqual(advanced);
    expect(advanceDays(parseSave(raw[1], 1).village, 28).state).toEqual(advanceDays(advanced, 28).state);
    repo.close();
  });

  it('SAVE-06: abortar después del éxito de put conserva el registro anterior', async () => {
    const repo = new IndexedDbSaveRepository('abortar', new IDBFactory());
    const original = createSave(generateVillage('previo-valido'), 1, 1, timestamp);
    await repo.write(original, null);
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (this: IDBObjectStore, ...args: Parameters<typeof put>) {
      const request = put.apply(this, args);
      request.addEventListener('success', () => this.transaction.abort());
      return request;
    });
    const next = createSave(advanceDays(original.village, 7).state, 1, 2, timestamp);
    await expect(repo.write(next, original)).rejects.toThrow();
    expect(parseSave((await repo.readAll())[1], 1)).toEqual(original);
    repo.close();
  });

  it('SAVE-12: el éxito de una petición individual aún no confirma el guardado', async () => {
    const repo = new IndexedDbSaveRepository('confirmacion', new IDBFactory());
    let resolved = false;
    let observedRequestSuccess = false;
    const put = IDBObjectStore.prototype.put;
    vi.spyOn(IDBObjectStore.prototype, 'put').mockImplementationOnce(function (this: IDBObjectStore, ...args: Parameters<typeof put>) {
      const request = put.apply(this, args);
      request.addEventListener('success', () => { observedRequestSuccess = true; expect(resolved).toBe(false); });
      return request;
    });
    await repo.write(createSave(generateVillage('confirmar'), 1, 1, timestamp), null).then(() => { resolved = true; });
    expect(observedRequestSuccess).toBe(true);
    expect(resolved).toBe(true);
    repo.close();
  });

  it('SAVE-09: dos escritores con la misma revisión no pisan el progreso', async () => {
    const factory = new IDBFactory();
    const first = new IndexedDbSaveRepository('competencia', factory);
    const second = new IndexedDbSaveRepository('competencia', factory);
    const initial = generateVillage('dos-pestanas');
    const initialSave = createSave(initial, 1, 1, timestamp);
    await first.write(initialSave, null);
    const results = await Promise.allSettled([
      first.write(createSave(advanceDays(initial, 7).state, 1, 2, timestamp), initialSave),
      second.write(createSave(advanceDays(initial, 28).state, 1, 2, timestamp), initialSave),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    const rejected = results.find((result) => result.status === 'rejected');
    expect(rejected?.status === 'rejected' && rejected.reason instanceof SaveConflictError).toBe(true);
    const stored = parseSave((await first.readAll())[1], 1);
    expect(stored.revision).toBe(2);
    expect([7, 28]).toContain(stored.village.elapsedDays);
    first.close(); second.close();
  });

  it('una lectura incompatible bloquea sobrescritura y borrado sin modificarla', async () => {
    const factory = new IDBFactory();
    const repo = new IndexedDbSaveRepository('version-futura', factory);
    const save = createSave(generateVillage('futuro'), 2, 1, timestamp);
    await repo.write(save, null);
    const original = { ...save, schemaVersion: 99 };
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const open = factory.open('version-futura'); open.onsuccess = () => resolve(open.result); open.onerror = () => reject(open.error);
    });
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('slots', 'readwrite'); tx.objectStore('slots').put(original);
      tx.oncomplete = () => resolve(); tx.onabort = () => reject(tx.error);
    });
    await expect(repo.write(createSave(save.village, 2, 2, timestamp), save)).rejects.toThrow(/versión/);
    await expect(repo.delete(2, save)).rejects.toThrow(/versión/);
    expect((await repo.readAll())[2]).toEqual(original);
    db.close(); repo.close();
  });

  it('SAVE-11: borrar una partida no cambia las otras dos', async () => {
    const repo = new IndexedDbSaveRepository('borrado', new IDBFactory());
    const saves = ([1, 2, 3] as const).map((slot) => createSave(generateVillage(`borrar-${slot}`), slot, 1, timestamp));
    for (const save of saves) await repo.write(save, null);
    await repo.delete(2, saves[1]!);
    const raw = await repo.readAll();
    expect(raw[2]).toBeNull();
    expect(raw[1]).toEqual(saves[0]); expect(raw[3]).toEqual(saves[2]);
    repo.close();
  });
});
