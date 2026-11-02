import { describe, expect, it } from 'vitest';
import { activeVillage, createSession, EMPTY_FILTERS, reduceSession } from '../../src/app/session';
import type { SlotId } from '../../src/app/session';
import { freezeDeep } from '../fixtures/simulation';

describe('Sesión de tres aldeas en memoria', () => {
  it('comienza con tres espacios vacíos y sin mundo activo', () => {
    const session = createSession();
    expect(session.slots).toEqual({ 1: null, 2: null, 3: null });
    expect(session.route).toBe('home');
    expect(activeVillage(session)).toBeNull();
    expect(reduceSession(session, { type: 'navigate', route: 'village' }).route).toBe('slots');
  });

  it('la creación deja el mundo activo y no modifica el estado anterior', () => {
    const initial = freezeDeep(createSession());
    const created = reduceSession(initial, { type: 'create', slot: 2, seed: 'semilla-m3', confirmReplacement: false });
    expect(created.activeSlot).toBe(2);
    expect(created.route).toBe('village');
    expect(activeVillage(created)?.rng.seed).toBe('semilla-m3');
    expect(created.slots[1]).toBeNull();
    expect(initial.slots[2]).toBeNull();
  });

  it('impide sobrescribir una aldea sin confirmación explícita', () => {
    const session = freezeDeep(reduceSession(createSession(), { type: 'create', slot: 1, seed: 'original', confirmReplacement: false }));
    expect(() => reduceSession(session, { type: 'create', slot: 1, seed: 'otra', confirmReplacement: false })).toThrow(/Confirma/);
    expect(session.slots[1]?.rng.seed).toBe('original');
    const replaced = reduceSession(session, { type: 'create', slot: 1, seed: 'otra', confirmReplacement: true });
    expect(replaced.slots[1]?.rng.seed).toBe('otra');
  });

  it('un fallo de generación conserva el mundo que se iba a reemplazar', () => {
    const session = freezeDeep(reduceSession(createSession(), { type: 'create', slot: 1, seed: 'conservar', confirmReplacement: false }));
    const before = JSON.stringify(session);
    expect(() => reduceSession(session, { type: 'create', slot: 1, seed: null as unknown as string, confirmReplacement: true })).toThrow();
    expect(JSON.stringify(session)).toBe(before);
  });

  it('cada espacio mantiene su tiempo y su identidad al cambiar entre aldeas', () => {
    let session = createSession();
    for (const slot of [1, 2, 3] as const) session = reduceSession(session, { type: 'create', slot, seed: `aldea-${slot}`, confirmReplacement: false });
    const first = session.slots[1];
    const third = session.slots[3];
    session = reduceSession(session, { type: 'continue', slot: 2 });
    session = reduceSession(session, { type: 'advance', days: 28 });
    session = reduceSession(session, { type: 'advance', days: 7 });
    session = reduceSession(session, { type: 'continue', slot: 1 });
    expect(session.slots[2]?.elapsedDays).toBe(35);
    expect(session.slots[1]).toBe(first);
    expect(session.slots[3]).toBe(third);
    expect(activeVillage(session)).toBe(first);
  });

  it('inspeccionar, filtrar y navegar no modifica el mundo ni consume RNG', () => {
    const original = reduceSession(createSession(), { type: 'create', slot: 1, seed: 'leer', confirmReplacement: false });
    const world = activeVillage(original);
    if (!world) throw new Error('Falta la aldea de prueba.');
    let session = reduceSession(original, { type: 'inspect', id: world.residents[0]!.id });
    session = reduceSession(session, { type: 'filter', filters: { search: 'cualquier nombre', housing: 'unhoused' } });
    session = reduceSession(session, { type: 'navigate', route: 'chronicle' });
    expect(activeVillage(session)).toBe(world);
    expect(session.selectedResidentId).toBe(world.residents[0]?.id);
    expect(() => reduceSession(session, { type: 'inspect', id: 'ausente' })).toThrow();
  });

  it('los filtros se conservan al inspeccionar y volver, y se reinician al cambiar de aldea', () => {
    let session = reduceSession(createSession(), { type: 'create', slot: 1, seed: 'filtros', confirmReplacement: false });
    session = reduceSession(session, { type: 'filter', filters: { age: 'older', sort: 'age' } });
    session = reduceSession(session, { type: 'inspect', id: session.slots[1]!.residents[0]!.id });
    session = reduceSession(session, { type: 'navigate', route: 'residents' });
    expect(session.filters.age).toBe('older');
    session = reduceSession(session, { type: 'continue', slot: 1 });
    expect(session.filters).toEqual(EMPTY_FILTERS);
  });

  it('rechaza espacios inexistentes, espacios vacíos y avances sin mundo', () => {
    const session = createSession();
    expect(() => reduceSession(session, { type: 'continue', slot: 1 })).toThrow();
    expect(() => reduceSession(session, { type: 'continue', slot: 4 as SlotId })).toThrow(RangeError);
    expect(() => reduceSession(session, { type: 'advance', days: 1 })).toThrow();
  });

  it('una sesión nueva no finge recuperar las aldeas anteriores', () => {
    const previous = reduceSession(createSession(), { type: 'create', slot: 3, seed: 'temporal', confirmReplacement: false });
    expect(activeVillage(previous)).not.toBeNull();
    expect(createSession().slots).toEqual({ 1: null, 2: null, 3: null });
  });
});
