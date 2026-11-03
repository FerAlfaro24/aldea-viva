import { describe, expect, it } from 'vitest';
import { act, createCaravan, parseCaravan, type Caravan, type Task } from '../../src/caravan/model';
import { renderCaravan, renderTasks, suggestedTasks } from '../../src/caravan/view';

function assign(state: Caravan, tasks: Task[]): Caravan {
  let result = state;
  tasks.forEach((task, index) => { result = act(result, { type: 'assign', personId: result.people[index]!.id, task }); });
  return result;
}

function resolve(state: Caravan): Caravan {
  const result = act(state, { type: 'start' });
  return result.pending ? act(result, { type: 'choose', choice: result.pending === 'wolves' ? 'distract' : 'salvage' }) : result;
}

function fourthMorning(): Caravan {
  let state = createCaravan('primera-semana', 'campamento');
  for (let day = 1; day <= 3; day++) {
    state = assign(state, suggestedTasks(state).map(item => item.task));
    state = act(resolve(state), { type: 'next' });
  }
  return state;
}

describe('Refugio y primera semana', () => {
  it('descubre la obra al cuarto día sin mostrar tareas futuras en el inicio', () => {
    const initial = createCaravan('inicio', 'caravana');
    expect(renderTasks(initial, 'bruno')).not.toContain('data-task="build"');
    expect(() => act(initial, { type: 'assign', personId: 'bruno', task: 'build' })).toThrow('día 4');
    const fourth = fourthMorning();
    expect(renderTasks(fourth, 'bruno')).toContain('data-task="build"');
    expect(renderCaravan(fourth, 'improvements')).toContain('4 materiales');
  });

  it('utiliza los materiales recogidos hoy y cobra una sola vez durante la obra', () => {
    const fourth = assign(fourthMorning(), ['rest', 'materials', 'build']);
    expect(fourth.materials).toBe(3);
    const started = resolve(fourth);
    expect(started.materials).toBe(1); // 3 + 2 recogidos - 4 de obra.
    expect(started.shelter).toBe(1);
    const fifth = assign(act(started, { type: 'next' }), ['gather', 'rest', 'build']);
    const completed = resolve(fifth);
    expect(completed.shelter).toBe(2);
    expect(completed.materials).toBe(1);
    expect(completed.reports.at(-1)!.lines.join(' ')).toContain('mantuvo secos');
    expect(completed.reports.at(-1)!.lines.join(' ')).not.toContain('suman 14');
  });

  it('dos trabajadores terminan en un día y no se puede seguir construyendo algo terminado', () => {
    const completed = resolve(assign(fourthMorning(), ['materials', 'build', 'build']));
    expect(completed.shelter).toBe(2);
    expect(completed.materials).toBe(1);
    const fifth = act(completed, { type: 'next' });
    expect(() => act(fifth, { type: 'start' })).toThrow('ya está reforzado');
    expect(renderCaravan(fifth, 'camp')).toContain('disabled');
  });

  it('no permite comenzar una obra sin materiales suficientes ni gastar al asignarla', () => {
    const state = fourthMorning();
    state.materials = 0;
    const planned = assign(state, ['rest', 'build', 'gather']);
    expect(planned.materials).toBe(0);
    expect(planned.shelter).toBe(0);
    expect(() => act(planned, { type: 'start' })).toThrow('4 materiales');
    expect(renderCaravan(planned, 'camp')).toContain('necesita 4 materiales');
  });

  it('la lluvia penaliza una lona sin arreglar; el refugio terminado evita ese cansancio', () => {
    const fifth = act(resolve(assign(fourthMorning(), ['rest', 'rest', 'rest'])), { type: 'next' });
    const bare = resolve(fifth);
    const protectedCamp = structuredClone(fifth);
    protectedCamp.shelter = 2;
    const protectedNight = resolve(protectedCamp);
    expect(bare.people.map(person => person.fatigue)).toEqual([14, 14, 14]);
    expect(protectedNight.people.map(person => person.fatigue)).toEqual([0, 0, 0]);
    expect(bare.reports.at(-1)!.lines.join(' ')).toContain('suman 14');
  });

  it('el beneficio del techo también permite descansar mejor en una noche seca', () => {
    const state = assign(fourthMorning(), ['gather', 'gather', 'gather']);
    state.shelter = 2;
    state.people.forEach(person => { person.fatigue = 20; });
    expect(resolve(state).people.map(person => person.fatigue)).toEqual([28, 28, 28]);
  });

  it('un descanso produce una reacción vinculada a su recuperación', () => {
    const state = assign(fourthMorning(), ['rest', 'gather', 'gather']);
    state.people[0]!.health = 70;
    const result = resolve(state);
    expect(result.reports.at(-1)!.reactions.join(' ')).toContain('Lucía: «Gracias');
    expect(result.people[0]!.health).toBe(88);
  });

  it.each(['semana-1', 'semana-2', 'semana-3'])('permite completar siete días usando las sugerencias: %s', seed => {
    let state = createCaravan(seed, seed);
    for (let day = 1; day <= 7; day++) {
      state = assign(state, suggestedTasks(state).map(item => item.task));
      state = act(resolve(state), { type: 'next' });
    }
    expect(state.phase).toBe('complete');
    expect(state.elapsedDays).toBe(7);
    expect(state.reports).toHaveLength(7);
    expect(state.people.every(person => person.health > 0)).toBe(true);
    expect(state.shelter).toBe(2);
    expect(renderCaravan(state, 'camp')).toContain('7 de 28 días');
    expect(() => act(state, { type: 'start' })).toThrow();
    expect(() => act(state, { type: 'next' })).toThrow();
  });

  it('una caravana antigua terminada continúa desde el día 4 sin volver a simular', () => {
    const fourth = fourthMorning();
    const legacy: Record<string, unknown> = structuredClone(fourth);
    legacy.version = 1; legacy.phase = 'complete'; delete legacy.shelter;
    legacy.reports = fourth.reports.map(report => ({ day: report.day, foodBefore: report.foodBefore, ingredientsBefore: report.ingredientsBefore, lines: report.lines, eaten: report.eaten }));
    const original = JSON.stringify(legacy);
    const loaded = parseCaravan(legacy);
    expect(JSON.stringify(legacy)).toBe(original);
    expect(loaded.phase).toBe('summary');
    expect(loaded.version).toBe(2);
    expect(loaded.shelter).toBe(0);
    expect(loaded.food).toBe(fourth.food);
    expect(loaded.rng).toEqual(fourth.rng);
    const next = act(loaded, { type: 'next' });
    expect(next.elapsedDays).toBe(3);
    expect(next.phase).toBe('planning');
    expect(next.revision).toBe(loaded.revision + 1);
  });
});
