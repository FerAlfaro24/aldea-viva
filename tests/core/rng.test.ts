import { describe, expect, it } from 'vitest';
import { createRng, nextRandom, randomInt, restoreRng } from '../../src/game/core/rng';
import type { RngSnapshot } from '../../src/game/models/simulation';

function sequence(initial: RngSnapshot, count: number) {
  let rng = initial;
  const values: number[] = [];
  for (let index = 0; index < count; index++) {
    const result = nextRandom(rng);
    values.push(result.value);
    rng = result.rng;
  }
  return { rng, values };
}

describe('RNG sembrado, versionado y serializable', () => {
  it('congela un vector de referencia de xorshift32 desde el estado 1', () => {
    const initial = { ...createRng('vector'), state: 1 };
    expect(sequence(initial, 5).values.map((value) => value * 0x1_0000_0000)).toEqual([
      270369, 67634689, 2647435461, 307599695, 2398689233,
    ]);
  });

  it('la misma semilla reproduce exactamente 1000 tiradas', () => {
    expect(sequence(createRng('aldea-semillada'), 1000)).toEqual(sequence(createRng('aldea-semillada'), 1000));
  });

  it('distintas semillas de prueba producen secuencias distintas', () => {
    const variants = ['aldea-1', 'aldea-2', 'aldea-3', 'aldea-4'].map((seed) => {
      return JSON.stringify(sequence(createRng(seed), 20).values);
    });
    expect(new Set(variants).size).toBe(4);
  });

  it.each(['', 'México', '🌱 Aldea', 'a\u0000b'])('conserva la semilla %j sin depender de codificación externa', (seed) => {
    const first = createRng(seed);
    expect(first.seed).toBe(seed);
    expect(restoreRng(JSON.parse(JSON.stringify(first)))).toEqual(first);
    expect(sequence(first, 25)).toEqual(sequence(createRng(seed), 25));
  });

  it('reanuda desde el estado guardado, sin volver a empezar la semilla', () => {
    const initial = createRng('guardar-y-seguir');
    const beforeSave = sequence(initial, 37);
    const restored = restoreRng(JSON.parse(JSON.stringify(beforeSave.rng)));
    const afterSave = sequence(restored, 63);
    expect([...beforeSave.values, ...afterSave.values]).toEqual(sequence(initial, 100).values);
    expect(afterSave.rng).toEqual(sequence(initial, 100).rng);
    expect(afterSave.values).not.toEqual(sequence(initial, 63).values);
  });

  it('no modifica el snapshot recibido', () => {
    const initial = Object.freeze(createRng('inmutable'));
    const copy = { ...initial };
    expect(nextRandom(initial).rng).not.toBe(initial);
    randomInt(initial, 15, 20);
    expect(initial).toEqual(copy);
  });

  it('produce decimales finitos dentro de [0,1)', () => {
    for (const value of sequence(createRng('rango'), 2000).values) {
      expect(Number.isFinite(value)).toBe(true);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('produce enteros reproducibles e incluye ambos extremos del intervalo', () => {
    let rng = createRng('poblacion');
    const populationCounts = new Set<number>();
    for (let index = 0; index < 1000; index++) {
      const result = randomInt(rng, 15, 20);
      expect(Number.isInteger(result.value)).toBe(true);
      expect(result.value).toBeGreaterThanOrEqual(15);
      expect(result.value).toBeLessThanOrEqual(20);
      populationCounts.add(result.value);
      expect(randomInt(rng, 15, 20)).toEqual(result);
      rng = result.rng;
    }
    expect([...populationCounts].sort((a, b) => a - b)).toEqual([15, 16, 17, 18, 19, 20]);
  });

  it('permite un intervalo de un único entero y consume una tirada', () => {
    const initial = createRng('unico');
    const result = randomInt(initial, -4, -4);
    expect(result.value).toBe(-4);
    expect(result.rng).toEqual(nextRandom(initial).rng);
  });

  it('descarta la cola del intervalo en vez de introducir sesgo por módulo', () => {
    // Vector conocido: 67634689 → 2647435461 (rechazado) → 307599695.
    const initial = { ...createRng('rechazo'), state: 67634689 };
    const result = randomInt(initial, 0, 2147483648);
    expect(result.value).toBe(307599694);
    expect(result.rng.state).toBe(307599695);
    expect(initial.state).toBe(67634689);
  });

  it.each([
    [3, 2], [0, 0.5], [NaN, 1], [0, Infinity],
    [0, 0xffff_ffff], [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  ])('rechaza el intervalo %s..%s', (min, max) => {
    expect(() => randomInt(createRng('intervalo-invalido'), min, max)).toThrow(RangeError);
  });

  it.each([null, [], {}, { ...createRng('x'), algorithm: 'otro-v2' },
    { ...createRng('x'), seed: null }, ...[0, -1, 1.5, NaN, Infinity, 0x1_0000_0000].map((state) => ({ ...createRng('x'), state })),
  ])('rechaza snapshots incompatibles o dañados: %j', (snapshot) => {
    expect(() => restoreRng(snapshot)).toThrow();
  });
});
