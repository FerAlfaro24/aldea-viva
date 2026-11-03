import { parseCaravan, type Caravan } from './model';

// Una base independiente: nunca abre ni modifica las ranuras de la aldea.
export class CaravanRepository {
  private connection: Promise<IDBDatabase> | null = null;
  constructor(private readonly name = 'aldea-viva-caravana', private readonly factory?: IDBFactory) {}

  private open(): Promise<IDBDatabase> {
    return this.connection ??= new Promise<IDBDatabase>((resolve, reject) => {
      const request = (this.factory ?? indexedDB).open(this.name, 1);
      let blocked = false;
      request.onupgradeneeded = () => request.result.createObjectStore('journey');
      request.onerror = () => reject(request.error);
      request.onblocked = () => { blocked = true; reject(new Error('Cierra otras pestañas de la caravana y reintenta la lectura.')); };
      request.onsuccess = () => {
        const db = request.result;
        if (blocked) { db.close(); return; }
        db.onversionchange = () => { db.close(); this.connection = null; };
        resolve(db);
      };
    }).catch((error: unknown) => { this.connection = null; throw error; });
  }

  async read(): Promise<Caravan | null> {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('journey', 'readonly');
      const request = tx.objectStore('journey').get('current');
      tx.oncomplete = () => {
        try { resolve(request.result === undefined ? null : parseCaravan(request.result)); }
        catch (error) { reject(error); }
      };
      tx.onabort = () => reject(tx.error ?? new Error('No se pudo leer la caravana.'));
    });
  }

  async write(next: Caravan, previous: Caravan | null): Promise<void> {
    const validated = parseCaravan(next);
    if (next.revision !== (previous?.revision ?? 0) + 1) throw new Error('La revisión del guardado no es consecutiva.');
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('journey', 'readwrite', { durability: 'strict' });
      const store = tx.objectStore('journey');
      const request = store.get('current');
      let failure: unknown;
      request.onsuccess = () => {
        try {
          const current = request.result === undefined ? null : parseCaravan(request.result);
          if (current?.id !== previous?.id || current?.revision !== previous?.revision) throw new Error('La partida cambió en otra pestaña. Relee el guardado antes de continuar.');
          store.put(validated, 'current');
        } catch (error) { failure = error; tx.abort(); }
      };
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(failure ?? tx.error ?? new Error('No se pudo guardar. El estado anterior se conserva.'));
    });
  }

  async close(): Promise<void> { (await this.connection)?.close(); this.connection = null; }
}
