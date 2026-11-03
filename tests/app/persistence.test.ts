import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { PersistentSession } from '../../src/app/persistence';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { createSave } from '../../src/storage/schema';
import { generateVillage } from '../../src/game/generation/village';
import type { SaveRepository } from '../../src/storage/repository';
import { advanceVillageDays as advanceDays } from '../../src/game/core/workDay';
import { selectResidentDetails } from '../../src/game/selectors/village';
import { suppliedVillage } from '../fixtures/suppliedVillage';

const create = { type: 'create', slot: 1, seed: 'persistencia', confirmReplacement: false } as const;
function setup() {
  const factory = new IDBFactory();
  const repository = new IndexedDbSaveRepository('test', factory);
  return { repository, session: new PersistentSession(repository), factory };
}

describe('Sesión con guardado confirmado', () => {
  it('E2E-01: ficha, identidad y familia se conservan tras avanzar y reabrir', async () => {
    const { session, factory } = setup(); await session.load(); await session.perform(create);
    const person = session.village!.residents[0]!;
    session.read({ type: 'inspect', id: person.id });
    const initial = selectResidentDetails(session.village!, person.id)!;
    await session.perform({ type: 'advance', days: 28 });
    const savedWorld = session.village!;
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('test', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 }); reopened.read({ type: 'inspect', id: person.id });
    expect(reopened.village).toEqual(savedWorld);
    const details = selectResidentDetails(reopened.village!, person.id)!;
    expect(details.id).toBe(initial.id);
    expect(details.family).toEqual(initial.family);
    expect(details.relations).toEqual(initial.relations);
    expect(details.attributes).toEqual(initial.attributes);
    expect(details.skills).toEqual(initial.skills);
    expect(details.age).toBe(initial.age + (person.birthDayOfYear > 1 && person.birthDayOfYear <= 29 ? 1 : 0));
    expect(reopened.snapshot.session.selectedResidentId).toBe(person.id);
    reopened.dispose();
  });

  it('E2E-02/06: un año en la ranura 2 no altera las otras ni duplica el registro al cargar', async () => {
    const { session, factory, repository } = setup();
    for (const slot of [1, 2, 3] as const) await repository.write(createSave(suppliedVillage(`aislamiento-anual-${slot}`), slot, 1, '2026-11-02T00:00:00Z'), null);
    await session.load();
    const before = session.snapshot.session.slots;
    session.read({ type: 'continue', slot: 2 });
    for (let month = 0; month < 12; month++) await session.perform({ type: 'advance', days: 28 });
    const after = session.village!;
    expect(session.snapshot.session.slots[1]).toEqual(before[1]);
    expect(session.snapshot.session.slots[3]).toEqual(before[3]);
    expect(after.elapsedDays).toBe(336);
    expect(after.chronicle.filter((entry) => entry.type === 'season_changed').map((entry) => [entry.elapsedDay, entry.season])).toEqual([
      [84, 'summer'], [168, 'autumn'], [252, 'winter'], [336, 'spring'],
    ]);
    for (const person of after.residents) {
      const birthdays = after.chronicle.filter((entry) => entry.type === 'birthday' && entry.residentId === person.id);
      expect(birthdays).toHaveLength(1);
      expect(birthdays[0]!.elapsedDay).toBe(person.birthDayOfYear === 1 ? 336 : person.birthDayOfYear - 1);
    }
    expect(new Set(after.chronicle.map((entry) => entry.id)).size).toBe(after.chronicle.length);
    const expectedSlots = session.snapshot.session.slots;
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('test', factory));
    for (let load = 0; load < 3; load++) {
      await reopened.load(); reopened.read({ type: 'continue', slot: 2 });
      expect(reopened.snapshot.session.slots).toEqual(expectedSlots);
      expect(reopened.village!.chronicle).toEqual(after.chronicle);
    }
    reopened.dispose();
  });

  it('E2E-04: continuar a mitad de año equivale a 336 avances diarios continuos', async () => {
    const { session, factory, repository } = setup();
    await repository.write(createSave(suppliedVillage(create.seed), 1, 1, '2026-11-02T00:00:00Z'), null);
    await session.load(); session.read({ type: 'continue', slot: 1 });
    const initial = session.village!;
    let continuous = initial;
    for (let day = 0; day < 336; day++) continuous = advanceDays(continuous, 1).state;
    for (let month = 0; month < 6; month++) await session.perform({ type: 'advance', days: 28 });
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('test', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    for (let month = 0; month < 6; month++) await reopened.perform({ type: 'advance', days: 28 });
    expect(reopened.village).toEqual(continuous);
    reopened.dispose();
  });
  it('no muestra una aldea nueva hasta que se confirme su escritura', async () => {
    let confirm!: () => void;
    const repository: SaveRepository = { readAll: async () => ({ 1: null, 2: null, 3: null }),
      write: () => new Promise<void>((resolve) => { confirm = resolve; }), delete: async () => {}, close() {} };
    const session = new PersistentSession(repository);
    await session.load();
    const saving = session.perform(create);
    expect(session.snapshot.phase).toBe('saving');
    expect(session.village).toBeNull();
    expect(session.hasUnsavedChanges).toBe(true);
    expect(() => session.read({ type: 'navigate', route: 'slots' })).toThrow();
    await expect(session.perform(create)).rejects.toThrow();
    confirm(); await saving;
    expect(session.snapshot.phase).toBe('ready');
    expect(session.village?.elapsedDays).toBe(0);
    expect(session.hasUnsavedChanges).toBe(false);
    session.dispose();
  });

  it('reintenta el mismo avance tras fallo, sin aplicarlo dos veces', async () => {
    const { repository, session } = setup(); await session.load(); await session.perform(create);
    const before = session.village;
    const write = vi.spyOn(repository, 'write').mockRejectedValueOnce(new DOMException('full', 'QuotaExceededError'));
    await expect(session.perform({ type: 'advance', days: 28 })).rejects.toThrow();
    expect(session.snapshot.phase).toBe('save-error');
    expect(session.snapshot.error).toContain('espacio');
    expect(session.village).toEqual(before);
    const candidate = write.mock.calls[0]![0];
    await session.retry();
    expect(write.mock.calls[1]![0]).toBe(candidate);
    expect(session.village).toEqual(candidate.village);
    expect(session.hasUnsavedChanges).toBe(false);
    write.mockRestore(); session.dispose();
  });

  it('recupera tres aldeas y no añade tiempo de reloj al reabrir', async () => {
    const { session, factory } = setup(); await session.load();
    for (const slot of [1, 2, 3] as const) {
      await session.perform({ ...create, slot, seed: `aldea-${slot}` });
      await session.perform({ type: 'advance', days: 7 });
    }
    const worlds = session.snapshot.session.slots;
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('test', factory), () => '2099-12-31T23:59:59Z');
    await reopened.load();
    expect(reopened.snapshot.session.slots).toEqual(worlds);
    expect(reopened.snapshot.session.activeSlot).toBeNull();
    reopened.read({ type: 'continue', slot: 2 });
    expect(reopened.village?.elapsedDays).toBe(7);
    reopened.dispose();
  });

  it('un fallo de lectura bloquea la creación y se puede reintentar', async () => {
    const { repository, session } = setup();
    const read = vi.spyOn(repository, 'readAll').mockRejectedValueOnce(new Error('unavailable'));
    await session.load();
    expect(session.snapshot.phase).toBe('load-error');
    await expect(session.perform(create)).rejects.toThrow();
    await session.load();
    expect(session.snapshot.phase).toBe('ready');
    expect(read).toHaveBeenCalledTimes(2);
    session.dispose();
  });

  it('protege datos incompatibles y permite utilizar las otras ranuras', async () => {
    const { repository, session } = setup();
    vi.spyOn(repository, 'readAll').mockResolvedValue({ 1: { schemaVersion: 99 }, 2: createSave(generateVillage('sana'), 2, 1, '2026-11-02T00:00:00Z'), 3: null });
    await session.load();
    expect(session.snapshot.slots[1].kind).toBe('invalid');
    await expect(session.perform(create)).rejects.toThrow('incompatibles');
    session.read({ type: 'continue', slot: 2 });
    expect(session.village?.rng.seed).toBe('sana');
    await session.perform({ ...create, slot: 3 });
    expect(session.snapshot.slots[1].kind).toBe('invalid');
    session.dispose();
  });

  it('descartar tras conflicto relee la partida de la otra pestaña', async () => {
    const { session, factory } = setup(); await session.load(); await session.perform(create);
    const other = new PersistentSession(new IndexedDbSaveRepository('test', factory));
    await other.load(); other.read({ type: 'continue', slot: 1 });
    await other.perform({ type: 'advance', days: 7 });
    await expect(session.perform({ type: 'advance', days: 28 })).rejects.toThrow('pestaña');
    expect(session.village?.elapsedDays).toBe(0);
    await session.discardPending();
    expect(session.snapshot.session.slots[1]?.elapsedDays).toBe(7);
    expect(session.snapshot.session.route).toBe('slots');
    expect(session.hasUnsavedChanges).toBe(false);
    session.dispose(); other.dispose();
  });

  it('no borra sin confirmación y un fallo conserva la aldea previa', async () => {
    const { repository, session } = setup(); await session.load(); await session.perform(create);
    await expect(session.perform({ type: 'delete', slot: 1, confirmed: false })).rejects.toThrow('Confirma');
    const deletion = vi.spyOn(repository, 'delete').mockRejectedValueOnce(new Error('failed'));
    await expect(session.perform({ type: 'delete', slot: 1, confirmed: true })).rejects.toThrow();
    expect(session.village).not.toBeNull();
    await session.retry(); expect(session.snapshot.session.slots[1]).toBeNull();
    expect(session.snapshot.slots[1].kind).toBe('empty');
    deletion.mockRestore(); session.dispose();
  });
});
