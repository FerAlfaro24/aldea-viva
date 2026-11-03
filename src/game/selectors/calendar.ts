import { getAge, getCalendarDate } from '../core/calendar';
import type { VillageState } from '../models/village';
import { DAYS_PER_MONTH } from '../rules/calendar';

// Una fecha de consulta nunca cambia el calendario del mundo ni consume RNG.
export function selectCalendarMonth(village: VillageState, selectedDay = village.elapsedDays) {
  const selectedDate = getCalendarDate(selectedDay);
  const start = selectedDay - selectedDate.dayOfMonth + 1;
  getCalendarDate(start + DAYS_PER_MONTH - 1);
  const days = Array.from({ length: DAYS_PER_MONTH }, (_, index) => {
    const elapsedDay = start + index;
    const date = getCalendarDate(elapsedDay);
    return {
      elapsedDay, number: index + 1,
      today: elapsedDay === village.elapsedDays, selected: elapsedDay === selectedDay,
      birthdays: village.residents.filter((person) => person.alive && (person.arrivedAt ?? 0) <= elapsedDay && person.birthDayOfYear === date.dayOfYear)
        .map((person) => ({ id: person.id, displayName: person.displayName, age: getAge(person, elapsedDay) })),
      events: village.chronicle.filter((entry) => entry.elapsedDay === elapsedDay).map((entry) => ({ ...entry })),
    };
  });
  return { year: selectedDate.year, month: selectedDate.month, season: selectedDate.season, days,
    selected: days[selectedDate.dayOfMonth - 1]!, canGoBack: start >= DAYS_PER_MONTH };
}
