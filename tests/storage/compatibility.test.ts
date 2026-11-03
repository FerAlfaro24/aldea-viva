import { describe, expect, it } from 'vitest';
import legacyFixture from '../fixtures/save-v1.json';
import { IDBFactory } from 'fake-indexeddb';
import { parseSave, createSave } from '../../src/storage/schema';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { generateVillage } from '../../src/game/generation/village';
import { advanceVillageDays as advanceDays } from '../../src/game/core/workDay';
import { advanceDays as advanceCalendarDays } from '../../src/game/core/tick';
import { selectHousingSummary } from '../../src/game/selectors/village';

const fixture: unknown = legacyFixture;
const legacy = parseSave(fixture);

async function setup() {
  const factory = new IDBFactory();
  await new Promise<void>((resolve, reject) => {
    const request = factory.open('compatibility', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('slots', { keyPath: 'slot' });
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction('slots', 'readwrite');
      tx.objectStore('slots').put(fixture);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  });
  const repository = new IndexedDbSaveRepository('compatibility', factory);
  return { factory, repository, session: new PersistentSession(repository) };
}

describe('Compatibilidad de la partida 0.1 preservada con la versión actual', () => {
  it('lee varias veces sin escribir ni añadir la cuarta casa', async () => {
    const { session, repository } = await setup();
    for (let read = 0; read < 3; read++) {
      await session.load(); session.read({ type: 'continue', slot: 1 });
      expect(session.village).toEqual(legacy.village);
      expect(selectHousingSummary(session.village!).capacity).toBe(15);
      expect((await repository.readAll())[1]).toEqual(fixture);
    }
    expect(session.village!.elapsedDays).toBe(28);
    session.dispose();
  });

  it('actualiza el sobre al guardar y preserva exactamente el mundo antiguo', async () => {
    const { repository, session } = await setup();
    const updated = createSave(legacy.village, 1, legacy.revision + 1, '2026-11-02T10:00:00Z');
    expect(updated.schemaVersion).toBe(9);
    expect(updated.village).toEqual(legacy.village);
    await repository.write(updated, legacy);
    expect(parseSave((await repository.readAll())[1])).toEqual(updated);
    session.dispose();
  });

  it('continúa el tick sin regenerar RNG, habitantes ni viviendas y reabre el resultado', async () => {
    const { repository, session, factory } = await setup();
    await session.load(); session.read({ type: 'continue', slot: 1 });
    await session.perform({ type: 'advance', days: 7 });
    expect(session.village).toEqual(advanceDays(legacy.village, 7).state);
    expect(session.village!.initialConfigId).toBe('provisional-v1');
    expect(parseSave((await repository.readAll())[1]).schemaVersion).toBe(9);
    const saved = session.village; session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('compatibility', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(saved);
    reopened.dispose();
  });

  it('un fallo en la primera escritura mantiene el formato y mundo anteriores', async () => {
    const { repository, session } = await setup();
    await session.load(); session.read({ type: 'continue', slot: 1 });
    const write = repository.write.bind(repository);
    repository.write = async () => { throw new DOMException('test', 'QuotaExceededError'); };
    await expect(session.perform({ type: 'advance', days: 7 })).rejects.toThrow();
    expect(session.village).toEqual(legacy.village);
    expect((await repository.readAll())[1]).toEqual(fixture);
    repository.write = write; await session.retry();
    expect(session.village).toEqual(advanceDays(legacy.village, 7).state);
    session.dispose();
  });

  it('separa configuración de arranque y RNG: solo las aldeas nuevas tienen 20 camas', () => {
    const original = generateVillage('partida-0.1-conservada', 'provisional-v1');
    expect(advanceCalendarDays(original, 28).state).toEqual(legacy.village);
    const current = generateVillage('partida-0.1-conservada');
    expect(current.initialConfigId).toBe('housing-20-v1');
    expect(current.residents).toEqual(original.residents);
    expect(current.families).toEqual(original.families);
    expect(current.rng).toEqual(original.rng);
    expect(current.inventory).toEqual(original.inventory);
    expect(selectHousingSummary(current).capacity).toBe(20);
    expect(selectHousingSummary(current).unhousedIds).toHaveLength(0);
    expect(() => parseSave({ ...legacy, village: current })).toThrow();
    expect(() => parseSave({ ...legacy, schemaVersion: 99 })).toThrow('versión');
  });
});
