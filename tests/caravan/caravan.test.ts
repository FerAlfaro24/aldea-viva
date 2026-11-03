import { describe, expect, it } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { act, createCaravan, parseCaravan, type Caravan, type Task } from '../../src/caravan/model';
import { CaravanRepository } from '../../src/caravan/storage';

function prepare(tasks: Task[] = ['hunt', 'guard', 'cook'], seed = 'primer-campamento'): Caravan {
  let state = createCaravan(seed, 'caravana-de-prueba');
  tasks.forEach((task, index) => { state = act(state, { type: 'assign', personId: state.people[index]!.id, task }); });
  return state;
}
function secondDay(): Caravan {
  return act(act(prepare(), { type: 'start' }), { type: 'next' });
}

describe('Primeros tres días de caravana', () => {
  it('empieza con tres adultos, cuatro bocas y ninguna tarea impuesta', () => {
    const state = createCaravan('inicio', 'uno');
    expect(state.people).toHaveLength(3);
    expect(state.people.every(person => person.age >= 18 && person.task === null)).toBe(true);
    expect(state.food).toBe(8);
    expect(() => act(state, { type: 'start' })).toThrow('Elige qué hará');
  });

  it('cocina la carne de hoy independientemente del orden de las tarjetas y consume una vez', () => {
    const state = prepare();
    const reordered = structuredClone(state);
    reordered.people = [state.people[2]!, state.people[0]!, state.people[1]!];
    const result = act(state, { type: 'start' });
    const other = act(reordered, { type: 'start' });
    expect(result.food).toBe(13); // 8 iniciales + 9 cocinadas - 4 consumidas.
    expect(other.food).toBe(result.food);
    expect(other.ingredients).toBe(result.ingredients);
    expect(result.elapsedDays).toBe(1);
    expect(state.elapsedDays).toBe(0);
    expect(result.reports[0]!.eaten).toBe(4);
    expect(() => act(result, { type: 'start' })).toThrow();
  });

  it('recolectar permite comer sin cocina; cocinar sin ingredientes no genera comida', () => {
    const gathering = act(prepare(['gather', 'gather', 'rest']), { type: 'start' });
    expect(gathering.food).toBeGreaterThanOrEqual(8);
    expect(gathering.ingredients).toBe(0);
    const emptyKitchen = act(prepare(['cook', 'guard', 'rest']), { type: 'start' });
    expect(emptyKitchen.food).toBe(4);
    expect(emptyKitchen.reports[0]!.lines.join(' ')).toContain('no había ingredientes');
  });

  it('descansar recupera salud y cansancio; bloquea cazar si hay heridas importantes', () => {
    const state = prepare(['rest', 'gather', 'gather']);
    state.people[0]!.health = 50;
    state.people[0]!.fatigue = 90;
    expect(() => act(state, { type: 'assign', personId: 'lucia', task: 'hunt' })).toThrow();
    const result = act(state, { type: 'start' });
    expect(result.people[0]!.health).toBe(68);
    expect(result.people[0]!.fatigue).toBe(45);
  });

  it('el hambre tiene consecuencias explícitas y nunca produce reservas negativas', () => {
    const state = prepare(['rest', 'rest', 'rest']);
    state.food = 1;
    const result = act(state, { type: 'start' });
    expect(result.food).toBe(0);
    expect(result.people[0]!.health).toBe(88);
    expect(result.reports[0]!.eaten).toBe(1);
  });

  it('la amenaza detiene el día; releer y decidir no repite tareas ni cena', () => {
    const morning = secondDay();
    const pending = act(morning, { type: 'start' });
    expect(pending.phase).toBe('decision');
    expect(pending.elapsedDays).toBe(1);
    expect(() => act(pending, { type: 'assign', personId: 'bruno', task: 'rest' })).toThrow();
    expect(() => act(pending, { type: 'start' })).toThrow();
    expect(() => act(pending, { type: 'choose', choice: 'salvage' })).toThrow();
    const reopened = parseCaravan(JSON.parse(JSON.stringify(pending)));
    const resolved = act(reopened, { type: 'choose', choice: 'distract' });
    expect(resolved.food).toBe(pending.food - 2 - 4);
    expect(resolved.people).toEqual(pending.people);
    expect(resolved.elapsedDays).toBe(2);
    expect(resolved.reports).toHaveLength(2);
    expect(() => act(resolved, { type: 'choose', choice: 'distract' })).toThrow();
  });

  it('no permite pagar una distracción sin comida', () => {
    const pending = act(secondDay(), { type: 'start' });
    pending.food = 1;
    expect(() => act(pending, { type: 'choose', choice: 'distract' })).toThrow('Necesitas 2');
  });

  it.each(['ruta-uno', 'ruta-dos', 'ruta-tres'])('conserva los tres primeros días y permite continuar al cuarto: %s', seed => {
    let state = prepare(undefined, seed);
    for (let day = 1; day <= 3; day++) {
      state = act(state, { type: 'start' });
      if (state.pending) state = act(state, { type: 'choose', choice: state.pending === 'wolves' ? 'stand' : 'salvage' });
      state = act(state, { type: 'next' });
    }
    expect(state.phase).toBe('planning');
    expect(state.elapsedDays).toBe(3);
    expect(state.reports).toHaveLength(3);
    expect(state.people.every(person => person.health > 0)).toBe(true);
    expect(() => act(state, { type: 'next' })).toThrow();
  });

  it('la rama de descanso del hallazgo reduce cansancio sin regalar recursos', () => {
    let state = act(act(secondDay(), { type: 'start' }), { type: 'choose', choice: 'distract' });
    state = act(act(state, { type: 'next' }), { type: 'start' });
    const result = act(state, { type: 'choose', choice: 'leave' });
    expect(result.materials).toBe(state.materials);
    expect(result.ingredients).toBe(state.ingredients);
    expect(result.people[0]!.fatigue).toBe(state.people[0]!.fatigue - 10);
  });

  it('rechaza versiones futuras y estructuras incompletas sin convertirlas', () => {
    expect(() => parseCaravan({ ...prepare(), version: 99 })).toThrow('incompatible');
    expect(() => parseCaravan({ ...prepare(), people: [] })).toThrow();
  });
});

describe('Guardados de caravana independientes y confirmados', () => {
  it('reabre las tareas guardadas y rechaza sobrescribir desde una pestaña atrasada', async () => {
    const factory = new IDBFactory();
    const repo = new CaravanRepository('caravana-test', factory);
    const initial = createCaravan('guardado', 'id');
    await repo.write(initial, null);
    const old = (await repo.read())!;
    const updated = act(old, { type: 'assign', personId: 'lucia', task: 'hunt' });
    await repo.write(updated, old);
    const conflicting = act(old, { type: 'assign', personId: 'bruno', task: 'guard' });
    await expect(repo.write(conflicting, old)).rejects.toThrow('otra pestaña');
    expect(await repo.read()).toEqual(updated);
    await repo.close();
    const reopened = new CaravanRepository('caravana-test', factory);
    expect(await reopened.read()).toEqual(updated);
    await reopened.close();
  });

  it('recupera la amenaza pendiente y guarda su resolución una sola vez', async () => {
    const factory = new IDBFactory();
    const repo = new CaravanRepository('decision-pendiente', factory);
    let saved = createCaravan('amenaza', 'viaje');
    await repo.write(saved, null);
    const actions = [
      { type: 'assign', personId: 'lucia', task: 'hunt' },
      { type: 'assign', personId: 'bruno', task: 'guard' },
      { type: 'assign', personId: 'ines', task: 'cook' },
      { type: 'start' }, { type: 'next' }, { type: 'start' },
    ] as const;
    for (const action of actions) {
      const next = act(saved, action);
      await repo.write(next, saved); saved = next;
    }
    await repo.close();
    const reopened = new CaravanRepository('decision-pendiente', factory);
    expect(await reopened.read()).toEqual(saved);
    const resolved = act((await reopened.read())!, { type: 'choose', choice: 'distract' });
    await reopened.write(resolved, saved);
    await expect(reopened.write(resolved, saved)).rejects.toThrow('otra pestaña');
    expect(await reopened.read()).toEqual(resolved);
    await reopened.close();
  });

  it('conserva un formato desconocido al fallar lectura o escritura', async () => {
    const factory = new IDBFactory();
    const repo = new CaravanRepository('formato-futuro', factory);
    const initial = createCaravan('guardado', 'id');
    await repo.write(initial, null);
    await repo.close();
    const db = await new Promise<IDBDatabase>((resolve) => { const request = factory.open('formato-futuro', 1); request.onsuccess = () => resolve(request.result); });
    const future = { ...initial, version: 99 };
    await new Promise<void>((resolve) => { const tx = db.transaction('journey', 'readwrite'); tx.objectStore('journey').put(future, 'current'); tx.oncomplete = () => resolve(); });
    await expect(repo.read()).rejects.toThrow('incompatible');
    await expect(repo.write(initial, null)).rejects.toThrow('incompatible');
    const raw = await new Promise<unknown>((resolve) => { const request = db.transaction('journey').objectStore('journey').get('current'); request.onsuccess = () => resolve(request.result); });
    expect(raw).toEqual(future);
    db.close(); await repo.close();
  });
});
