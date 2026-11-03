import { describe, expect, it } from 'vitest';
import { selectCalendarMonth } from '../../src/game/selectors/calendar';
import { generateVillage } from '../../src/game/generation/village';
import { advanceDays } from '../../src/game/core/tick';
import { createSession, reduceSession } from '../../src/app/session';
import { renderCalendar } from '../../src/ui/calendar';
import { freezeDeep } from '../fixtures/simulation';

function session() {
  const created = reduceSession(createSession(), { type: 'create', slot: 1, seed: 'calendario-visual', confirmReplacement: false });
  return reduceSession(created, { type: 'navigate', route: 'calendar' });
}

describe('Calendario visual basado en el mundo guardado', () => {
  it.each([[0,1,1,'spring'],[83,1,3,'spring'],[84,1,4,'summer'],[168,1,7,'autumn'],[252,1,10,'winter'],[335,1,12,'winter'],[336,2,1,'spring']] as const)(
    'representa 28 días y la estación correcta al consultar %i', (day, year, month, season) => {
      const village = freezeDeep(generateVillage('meses'));
      const calendar = selectCalendarMonth(village, day);
      expect(calendar.days).toHaveLength(28);
      expect([calendar.year, calendar.month, calendar.season]).toEqual([year, month, season]);
      expect(calendar.days.map((entry) => entry.number)).toEqual(Array.from({ length: 28 }, (_, index) => index + 1));
      expect(calendar.days.filter((entry) => entry.selected)).toHaveLength(1);
      expect(calendar.selected.elapsedDay).toBe(day);
      expect(calendar.days.filter((entry) => entry.today)).toHaveLength(day < 28 ? 1 : 0);
    });

  it('muestra cumpleaños reales, edad prevista y enlace por ID sin revelar potenciales', () => {
    const village = freezeDeep(generateVillage('cumples'));
    const person = village.residents.find((resident) => resident.birthDayOfYear > 1)!;
    const day = person.birthDayOfYear - 1;
    const calendar = selectCalendarMonth(village, day);
    expect(calendar.selected.birthdays.find((birthday) => birthday.id === person.id)).toEqual({ id: person.id, displayName: person.displayName, age: person.initialAge + 1 });
    const markup = renderCalendar(village, day);
    expect(markup).toContain(`data-person="${person.id}"`);
    expect(markup).toContain('Cumpleaños previstos');
    expect(markup).not.toMatch(/potentialSecret|experience|historicalBest/);
    expect(markup).not.toContain('data-action="advance"');
  });

  it('los sucesos se toman del registro y no se inventan en fechas futuras', () => {
    const village = freezeDeep(advanceDays(advanceDays(advanceDays(generateVillage('registro-calendario'),28).state,28).state,28).state);
    expect(selectCalendarMonth(village,84).selected.events.some((entry) => entry.type === 'season_changed' && entry.season === 'summer')).toBe(true);
    expect(selectCalendarMonth(village,168).selected.events).toEqual([]);
    expect(renderCalendar(village,84)).toContain('Llega verano.');
  });

  it('navegar, seleccionar y volver a hoy no cambia ninguna aldea ni consume RNG', () => {
    const initial = freezeDeep(session());
    let current = initial;
    for (let month = 0; month < 12; month++) current = reduceSession(current, { type: 'calendar-month', delta: 1 });
    expect(current.selectedCalendarDay).toBe(336);
    current = reduceSession(current, { type: 'calendar-day', elapsedDay: 340 });
    expect(current.selectedCalendarDay).toBe(340);
    current = reduceSession(current, { type: 'inspect', id: current.slots[1]!.residents[0]!.id });
    current = reduceSession(current, { type: 'navigate', route: 'calendar' });
    expect(current.selectedCalendarDay).toBe(340);
    current = reduceSession(current, { type: 'calendar-today' });
    expect(current.selectedCalendarDay).toBe(0);
    expect(current.slots).toBe(initial.slots);
    expect(() => reduceSession(initial, { type: 'calendar-month', delta: -1 })).toThrow();
    expect(() => reduceSession(initial, { type: 'calendar-day', elapsedDay: 28 })).toThrow();
    expect(() => selectCalendarMonth(initial.slots[1]!, -1)).toThrow();
  });

  it('seguir hoy acompaña el avance real y consultar otro mes conserva su selección', () => {
    let current = session();
    current = reduceSession(current, { type: 'advance', days: 28 });
    const firstDay = current.slots[1]!.elapsedDays;
    expect(current.selectedCalendarDay).toBe(firstDay);
    current = reduceSession(current, { type: 'calendar-month', delta: 1 });
    current = reduceSession(current, { type: 'advance', days: 7 });
    expect(current.slots[1]!.elapsedDays).toBeGreaterThan(firstDay);
    expect(current.selectedCalendarDay).toBe(firstDay + 28);
    current = reduceSession(current, { type: 'calendar-today' });
    expect(current.selectedCalendarDay).toBe(current.slots[1]!.elapsedDays);
    current = reduceSession(current, { type: 'create', slot: 2, seed: 'otra', confirmReplacement: false });
    current = reduceSession(current, { type: 'navigate', route: 'calendar' });
    expect(current.selectedCalendarDay).toBe(0);
    current = reduceSession(current, { type: 'continue', slot: 1 });
    current = reduceSession(current, { type: 'navigate', route: 'calendar' });
    expect(current.selectedCalendarDay).toBe(current.slots[1]!.elapsedDays);
  });

  it('escapa nombres de habitantes y señala hoy y la selección de forma accesible', () => {
    const original = generateVillage('escape-calendario');
    const person = original.residents[0]!;
    const village = { ...original, residents: original.residents.map((resident) => resident.id === person.id ? { ...resident, displayName: '<img src=x onerror=alert(1)>' } : resident) };
    const markup = renderCalendar(village, person.birthDayOfYear - 1);
    expect(markup).toContain('&lt;img');
    expect(markup).not.toContain('<img');
    expect(renderCalendar(original,0)).toContain('aria-current="date"');
    expect(renderCalendar(original,0).match(/aria-pressed="true"/g)).toHaveLength(1);
  });
});
