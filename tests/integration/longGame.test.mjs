import { expect, it } from 'vitest';
import { runManagedVillage } from '../fixtures/managedVillage';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { generateVillage } from '../../src/game/generation/village';

it('integra economía, invierno, obras, ataques, decisiones y reaperturas durante varios años', () => {
  const summaries = [];
  mkdirSync('.tools.local', { recursive: true });
  for (const seed of ['integracion-1', 'integracion-2', 'integracion-3']) for (const strategy of ['reserves', 'fields']) {
    const result = runManagedVillage(seed, 5, strategy);
    summaries.push(result.summary);
    writeFileSync('.tools.local/balance-10.json', JSON.stringify(summaries, null, 2));
    expect(result.world.inventory.food).toBeGreaterThanOrEqual(0);
    expect(result.world.inventory.wood).toBeGreaterThanOrEqual(0);
    expect(result.summary.raids).toBeGreaterThan(0);
    expect(result.summary.endDay, JSON.stringify(result.summary)).toBe(1680);
    expect(result.summary.living, JSON.stringify(result.summary)).toBeGreaterThanOrEqual(Math.floor(result.summary.initialPopulation / 2));
  }
}, 120000);

it('comprueba los extremos de 15 y 20 habitantes con las mismas reglas durante cinco años', () => {
  const summaries = existsSync('.tools.local/balance-10.json') ? JSON.parse(readFileSync('.tools.local/balance-10.json', 'utf8')) : [];
  mkdirSync('.tools.local', { recursive: true });
  for (const population of [15, 20]) {
    const seed = Array.from({ length: 100 }, (_, index) => `extremo-${index}`).find((candidate) => generateVillage(candidate).residents.length === population);
    expect(seed).toBeDefined();
    const result = runManagedVillage(seed, 5, population === 15 ? 'reserves' : 'fields');
    summaries.push(result.summary);
    writeFileSync('.tools.local/balance-10.json', JSON.stringify(summaries, null, 2));
    expect(result.summary.endDay, JSON.stringify(result.summary)).toBe(1680);
    expect(result.summary.reopenings).toBe(5);
    expect(result.summary.living, JSON.stringify(result.summary)).toBeGreaterThanOrEqual(Math.floor(population / 2));
  }
}, 120000);
