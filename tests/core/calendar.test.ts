import { describe, expect, it } from 'vitest';
import { getAge, getCalendarDate, getEligibleProfessions } from '../../src/game/core/calendar';
import { DAYS_PER_YEAR } from '../../src/game/rules/calendar';
import { resident } from '../fixtures/simulation';

describe('Calendario confirmado de 12 meses por 28 días', () => {
  it.each([
    ['CAL-01', 0, 1, 1, 1, 1, 'spring'],
    ['CAL-02', 27, 1, 1, 28, 28, 'spring'],
    ['CAL-03', 28, 1, 2, 1, 29, 'spring'],
    ['CAL-04', 83, 1, 3, 28, 84, 'spring'],
    ['CAL-05', 84, 1, 4, 1, 85, 'summer'],
    ['CAL-06', 168, 1, 7, 1, 169, 'autumn'],
    ['CAL-07', 252, 1, 10, 1, 253, 'winter'],
    ['CAL-08', 335, 1, 12, 28, 336, 'winter'],
    ['CAL-09', 336, 2, 1, 1, 1, 'spring'],
    ['CAL-10', 672, 3, 1, 1, 1, 'spring'],
    ['BORDE-VERANO', 167, 1, 6, 28, 168, 'summer'],
    ['BORDE-OTONO', 251, 1, 9, 28, 252, 'autumn'],
    ['BORDE-ANO-2', 671, 2, 12, 28, 336, 'winter'],
  ] as const)('%s: día absoluto %i', (_code, elapsedDays, year, month, dayOfMonth, dayOfYear, season) => {
    expect(getCalendarDate(elapsedDays)).toEqual({ elapsedDays, year, month, dayOfMonth, dayOfYear, season });
  });

  it('cada año contiene doce meses de 28 días y cuatro estaciones de 84', () => {
    const months = new Map<number, number>();
    const seasons = new Map<string, number>();
    for (let day = 0; day < DAYS_PER_YEAR; day++) {
      const date = getCalendarDate(day);
      months.set(date.month, (months.get(date.month) ?? 0) + 1);
      seasons.set(date.season, (seasons.get(date.season) ?? 0) + 1);
    }
    expect(months.size).toBe(12);
    expect([...months.values()]).toEqual(Array.from({ length: 12 }, () => 28));
    expect([...seasons.values()]).toEqual([84, 84, 84, 84]);
  });

  it.each([-1, 0.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])('rechaza fecha inválida %s', (day) => {
    expect(() => getCalendarDate(day)).toThrow(RangeError);
  });
});

describe('Edad derivada y permisos de oficio informativos', () => {
  it('cumpleaños día 1: conserva edad al iniciar y aumenta al entrar en el año siguiente', () => {
    const person = resident({ initialAge: 11, birthDayOfYear: 1 });
    expect([0, 335, 336, 671, 672].map((day) => getAge(person, day))).toEqual([11, 11, 12, 12, 13]);
  });

  it('cumpleaños día 336: aumenta en el último día del año', () => {
    const person = resident({ initialAge: 30, birthDayOfYear: 336 });
    expect([334, 335, 336, 670, 671].map((day) => getAge(person, day))).toEqual([30, 31, 31, 31, 32]);
  });

  it.each([
    [11, []],
    [12, ['farmer']],
    [13, ['farmer']],
    [14, ['farmer', 'builder']],
    [15, ['farmer', 'builder', 'woodcutter']],
    [16, ['farmer', 'builder', 'woodcutter', 'warrior']],
    [90, ['farmer', 'builder', 'woodcutter', 'warrior']],
  ] as const)('oficios permitidos a los %i años', (age, expected) => {
    expect(getEligibleProfessions(age)).toEqual(expected);
  });

  it.each([0, 337, 1.5, NaN])('rechaza cumpleaños inválido %s', (birthDayOfYear) => {
    expect(() => getAge(resident({ birthDayOfYear }), 0)).toThrow(RangeError);
  });

  it.each([-1, 1.5, NaN, Infinity])('rechaza edad inválida %s', (age) => {
    expect(() => getAge(resident({ initialAge: age }), 0)).toThrow(RangeError);
    expect(() => getEligibleProfessions(age)).toThrow(RangeError);
  });

  it('rechaza edades que superarían el rango seguro', () => {
    expect(() => getAge(resident({ initialAge: Number.MAX_SAFE_INTEGER }), 1)).toThrow(RangeError);
  });
});
