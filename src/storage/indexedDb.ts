import { SLOT_IDS } from '../game/models/save';
import type { SaveEnvelope, SlotId } from '../game/models/save';
import type { SaveExpectation, SaveRepository } from './repository';
import { SaveConflictError } from './repository';
import { parseSave } from './schema';

export class IndexedDbSaveRepository implements SaveRepository {
  private connection: Promise<IDBDatabase> | null = null;

  constructor(private readonly databaseName = 'aldea-viva', private readonly factory?: IDBFactory) {}

  private open(): Promise<IDBDatabase> {
    if (this.connection) return this.connection;
    this.connection = new Promise<IDBDatabase>((resolve, reject) => {
      let request: IDBOpenDBRequest;
      let settled = false;
      try {
        const factory = this.factory ?? globalThis.indexedDB;
        if (!factory) throw new Error('Este navegador no permite guardar partidas con IndexedDB.');
        request = factory.open(this.databaseName, 1);
      } catch (error) { reject(error); return; }
      request.onupgradeneeded = (event) => {
        if (event.oldVersion === 0) request.result.createObjectStore('slots', { keyPath: 'slot' });
      };
      request.onblocked = () => {
        settled = true;
        reject(new Error('Otra pestaña impide abrir las partidas. Ciérrala y vuelve a intentarlo.'));
      };
      request.onerror = () => { settled = true; reject(request.error ?? new Error('No se pudieron abrir las partidas.')); };
      request.onsuccess = () => {
        const database = request.result;
        if (settled) { database.close(); return; }
        if (!database.objectStoreNames.contains('slots')) {
          database.close();
          reject(new Error('El almacenamiento tiene un formato desconocido. No se modificaron sus datos.'));
          return;
        }
        if (database.transaction('slots', 'readonly').objectStore('slots').keyPath !== 'slot') {
          database.close();
          reject(new Error('El almacenamiento tiene claves desconocidas. No se modificaron sus datos.'));
          return;
        }
        database.onversionchange = () => { database.close(); this.connection = null; };
        resolve(database);
      };
    }).catch((error: unknown) => { this.connection = null; throw error; });
    return this.connection;
  }

  async readAll(): Promise<Record<SlotId, unknown | null>> {
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const result: Record<SlotId, unknown | null> = { 1: null, 2: null, 3: null };
      const transaction = database.transaction('slots', 'readonly');
      for (const slot of SLOT_IDS) {
        const request = transaction.objectStore('slots').get(slot);
        request.onsuccess = () => { const raw: unknown = request.result; result[slot] = raw === undefined ? null : raw; };
      }
      transaction.oncomplete = () => resolve(result);
      transaction.onabort = () => reject(transaction.error ?? new Error('Se interrumpió la lectura de las partidas.'));
      transaction.onerror = () => reject(transaction.error ?? new Error('No se pudieron leer las partidas.'));
    });
  }

  private async change(
    slot: SlotId,
    expectedRevision: SaveExpectation | null,
    save: SaveEnvelope | null,
  ): Promise<void> {
    if (!SLOT_IDS.includes(slot)) throw new RangeError('Espacio de partida desconocido.');
    if (expectedRevision !== null && (!Number.isSafeInteger(expectedRevision.revision) || expectedRevision.revision < 1 || !expectedRevision.saveId)) {
      throw new RangeError('La revisión esperada no es válida.');
    }
    const validated = save === null ? null : parseSave(save, slot);
    if (validated && validated.revision !== (expectedRevision?.revision ?? 0) + 1) throw new RangeError('La revisión nueva no es consecutiva.');
    const database = await this.open();
    return new Promise((resolve, reject) => {
      const transaction = database.transaction('slots', 'readwrite', { durability: 'strict' });
      const store = transaction.objectStore('slots');
      let failure: unknown = null;
      const request = store.get(slot);
      request.onsuccess = () => {
        try {
          const raw: unknown = request.result;
          const current = raw === undefined ? null : parseSave(raw, slot);
          if ((current?.revision ?? null) !== (expectedRevision?.revision ?? null) || (current?.saveId ?? null) !== (expectedRevision?.saveId ?? null)) throw new SaveConflictError();
          if (validated === null) store.delete(slot);
          else store.put(validated);
        } catch (error) {
          failure = error;
          transaction.abort();
        }
      };
      // El éxito de put() no equivale a la confirmación de la transacción.
      transaction.oncomplete = () => resolve();
      transaction.onabort = () => reject(failure ?? transaction.error ?? new Error('Se interrumpió el guardado. La partida anterior se conserva.'));
      transaction.onerror = () => reject(failure ?? transaction.error ?? new Error('No se pudo guardar. La partida anterior se conserva.'));
    });
  }

  write(save: SaveEnvelope, expectedRevision: SaveExpectation | null): Promise<void> {
    return this.change(save.slot, expectedRevision, save);
  }

  delete(slot: SlotId, expectedRevision: SaveExpectation): Promise<void> {
    return this.change(slot, expectedRevision, null);
  }

  close(): void {
    void this.connection?.then((database) => database.close()).catch(() => {});
    this.connection = null;
  }
}
