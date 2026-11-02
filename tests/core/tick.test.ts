import { describe, expect, it } from 'vitest';
import { getAge } from '../../src/game/core/calendar';
import { advanceDays, tickOneDay } from '../../src/game/core/tick';
import { nextRandom, restoreRng } from '../../src/game/core/rng';
import type { AdvanceDays, Profession, SimulationState } from '../../src/game/models/simulation';
import { freezeDeep, resident, simulation } from '../fixtures/simulation';

function runTicks(initial: SimulationState, count: number): SimulationState {
  let current = initial;
  for (let day = 0; day < count; day++) current = tickOneDay(current).state;
  return current;
}

describe('Tick diario y pruebas CAL-11..16', () => {
  it('CAL-11: avanzar 28 días equivale a procesar 28 ticks individuales', () => {
    const initial = simulation({ elapsedDays: 70, residents: [resident({ birthDayOfYear: 85 })] });
    const result = advanceDays(initial, 28);
    const daily = runTicks(initial, 28);
    expect(result.state).toEqual(daily);
    expect(result.events).toEqual(daily.chronicle);
    expect(result.processedDays).toBe(28);
    expect(result.remainingDays).toBe(0);
    expect(result.interrupted).toBe(false);
  });

  it('CAL-12: cumpleaños día 2 al entrar en elapsed=1 y sin duplicar después', () => {
    const initial = simulation();
    expect(initial.chronicle).toEqual([]);
    const result = tickOneDay(initial);
    expect(result.events).toContainEqual({ id: 'birthday:1:r001', elapsedDay: 1, type: 'birthday', residentId: 'r001', age: 21 });
    expect(tickOneDay(result.state).events).toEqual([]);
    expect(result.state.residents[0]?.initialAge).toBe(20);
    expect(getAge(result.state.residents[0]!, 1)).toBe(21);
  });

  it('CAL-13: cumpleaños día 1 solo al entrar en el año 2, sin incremento doble', () => {
    const initial = simulation({ residents: [resident({ birthDayOfYear: 1 })] });
    const yearEnd = runTicks(initial, 335);
    expect(yearEnd.chronicle.filter((entry) => entry.type === 'birthday')).toHaveLength(0);
    const newYear = tickOneDay(yearEnd);
    expect(newYear.events.map((entry) => entry.type)).toEqual(['year_changed', 'season_changed', 'birthday']);
    expect(newYear.events).toContainEqual({ id: 'birthday:336:r001', elapsedDay: 336, type: 'birthday', residentId: 'r001', age: 21 });
    expect(getAge(initial.residents[0]!, 336)).toBe(21);
  });

  it('CAL-14: los 336 posibles cumpleaños ocurren una sola vez tras 336 ticks', () => {
    const residents = Array.from({ length: 336 }, (_, index) => resident({ id: `r${index}`, birthDayOfYear: index + 1 }));
    const final = runTicks(simulation({ residents }), 336);
    const birthdays = final.chronicle.filter((entry) => entry.type === 'birthday');
    expect(birthdays).toHaveLength(336);
    expect(new Set(birthdays.map((entry) => entry.residentId)).size).toBe(336);
    expect(birthdays.every((entry) => entry.age === 21)).toBe(true);
    expect(final.chronicle.filter((entry) => entry.type === 'season_changed')).toHaveLength(4);
    expect(final.chronicle.filter((entry) => entry.type === 'year_changed')).toHaveLength(1);
  });

  it.each([
    [11, 'farmer'], [13, 'builder'], [14, 'woodcutter'], [15, 'warrior'],
  ] as const)('CAL-15: al pasar de %i años se informa %s sin asignar trabajo', (initialAge, profession: Profession) => {
    const person = resident({ initialAge });
    const result = tickOneDay(simulation({ residents: [person] }));
    expect(result.events.filter((entry) => entry.type === 'eligible_job')).toEqual([{
      id: `eligible_job:1:r001:${profession}`, elapsedDay: 1, type: 'eligible_job', residentId: 'r001', profession,
    }]);
    expect(result.state.residents).toEqual([person]);
    expect(result.state.residents[0]?.profession).toBeNull();
    expect(result.state.residents[0]?.workplaceId).toBeNull();
    expect(tickOneDay(result.state).events.filter((entry) => entry.type === 'eligible_job')).toEqual([]);
  });

  it('CAL-16: se detiene exactamente en el noveno día del avance de 28', () => {
    const visited: number[] = [];
    const result = advanceDays(simulation(), 28, {
      decisionAfterDay: (state) => {
        visited.push(state.elapsedDays);
        return state.elapsedDays === 9 ? { id: 'decision-de-prueba', type: 'synthetic', sinceElapsedDay: 9 } : null;
      },
    });
    expect(result.state.elapsedDays).toBe(9);
    expect(result.processedDays).toBe(9);
    expect(result.remainingDays).toBe(19);
    expect(result.interrupted).toBe(true);
    expect(visited).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(result.state.chronicle.every((entry) => entry.elapsedDay <= 9)).toBe(true);
  });

  it('una decisión pendiente bloquea cualquier tick o avance nuevo', () => {
    const initial = simulation({ elapsedDays: 9, pendingDecision: { id: 'esperar', type: 'synthetic', sinceElapsedDay: 9 } });
    expect(tickOneDay(initial)).toEqual({ state: initial, processedDays: 0, remainingDays: 1, events: [], interrupted: true });
    expect(advanceDays(initial, 28)).toEqual({ state: initial, processedDays: 0, remainingDays: 28, events: [], interrupted: true });
  });

  it('tras retirar explícitamente la decisión puede avanzar desde el mismo día', () => {
    const blocked = simulation({ elapsedDays: 9, pendingDecision: { id: 'esperar', type: 'synthetic', sinceElapsedDay: 9 } });
    // Representa una futura resolución autorizada, no un sistema de eventos jugable.
    const resolved = { ...blocked, pendingDecision: null };
    expect(advanceDays(resolved, 7).state.elapsedDays).toBe(16);
    expect(blocked.elapsedDays).toBe(9);
    expect(blocked.pendingDecision).not.toBeNull();
  });

  it('rechaza decisiones nuevas con fecha anterior o futura al tick', () => {
    for (const sinceElapsedDay of [0, 2]) {
      expect(() => tickOneDay(simulation(), {
        decisionAfterDay: () => ({ id: 'invalida', type: 'synthetic', sinceElapsedDay }),
      })).toThrow();
    }
  });

  it('no muta el estado inicial, sus habitantes ni el RNG', () => {
    const initial = freezeDeep(simulation());
    const original = JSON.stringify(initial);
    const result = advanceDays(initial, 28);
    expect(JSON.stringify(initial)).toBe(original);
    expect(result.state).not.toBe(initial);
    expect(result.state.rng).toEqual(initial.rng);
    expect(result.state.residents).toEqual(initial.residents);
  });

  it('el registro se produce por ID estable y no por orden de la interfaz', () => {
    const people = [resident({ id: 'r002' }), resident({ id: 'r001' })];
    const left = tickOneDay(simulation({ residents: people }));
    const right = tickOneDay(simulation({ residents: [...people].reverse() }));
    expect(left.events).toEqual(right.events);
    expect(left.events.filter((entry) => entry.type === 'birthday').map((entry) => entry.residentId)).toEqual(['r001', 'r002']);
    expect(left.state.residents).toEqual(people);
  });

  it('un registro de cumpleaños ya guardado no se vuelve a emitir al continuar', () => {
    const previous = tickOneDay(simulation()).state;
    const restored: SimulationState = JSON.parse(JSON.stringify(previous));
    const result = tickOneDay(restored);
    expect(result.events).toEqual([]);
    expect(result.state.chronicle).toEqual(previous.chronicle);
  });

  it('replay y snapshot JSON conservan el estado completo y las tiradas futuras', () => {
    const firstDraw = nextRandom(simulation().rng);
    const initial = simulation({ rng: firstDraw.rng });
    const actions: AdvanceDays[] = [28, 7, 1, 28, 1, 7, 28, 28, 28, 28, 28, 28, 28, 28, 28];
    const continuous = actions.reduce((state, action) => advanceDays(state, action).state, initial);
    let restored = initial;
    for (const action of actions) {
      const next = advanceDays(restored, action).state;
      const parsed: SimulationState = JSON.parse(JSON.stringify(next));
      restored = { ...parsed, rng: restoreRng(parsed.rng) };
    }
    expect(restored).toEqual(continuous);
    expect(nextRandom(restored.rng)).toEqual(nextRandom(continuous.rng));
    expect(restored.rng).not.toEqual(simulation().rng);
  });

  it('no registra cumpleaños para habitantes marcados como fallecidos', () => {
    const initial = simulation({ residents: [resident({ alive: false })] });
    expect(tickOneDay(initial).events).toEqual([]);
  });

  it('rechaza habitantes con ID vacío o duplicado', () => {
    for (const residents of [[resident({ id: '' })], [resident(), resident()]]) {
      expect(() => tickOneDay(simulation({ residents }))).toThrow(TypeError);
    }
  });

  it.each([0, 2, -1, 7.5, 29, NaN])('rechaza avances no admitidos: %s', (days) => {
    expect(() => advanceDays(simulation(), days as AdvanceDays)).toThrow(RangeError);
  });

  it('impide desbordamiento del contador temporal', () => {
    expect(() => tickOneDay(simulation({ elapsedDays: Number.MAX_SAFE_INTEGER, residents: [] }))).toThrow(RangeError);
  });
});
