import type { CalendarDate, Profession, ResidentClock } from '../models/simulation';
import {
  DAYS_PER_MONTH,
  DAYS_PER_SEASON,
  DAYS_PER_YEAR,
  MINIMUM_WORK_AGES,
  PROFESSIONS,
  SEASONS,
} from '../rules/calendar';

export function assertElapsedDays(elapsedDays: number): void {
  if (!Number.isSafeInteger(elapsedDays) || elapsedDays < 0) {
    throw new RangeError('Los días transcurridos deben ser un entero seguro no negativo.');
  }
}

export function getCalendarDate(elapsedDays: number): CalendarDate {
  assertElapsedDays(elapsedDays);
  const dayIndex = elapsedDays % DAYS_PER_YEAR;
  const season = SEASONS[Math.floor(dayIndex / DAYS_PER_SEASON)];

  if (!season) {
    throw new RangeError('La fecha no corresponde a una estación válida.');
  }

  return {
    elapsedDays,
    year: Math.floor(elapsedDays / DAYS_PER_YEAR) + 1,
    month: Math.floor(dayIndex / DAYS_PER_MONTH) + 1,
    dayOfMonth: (dayIndex % DAYS_PER_MONTH) + 1,
    dayOfYear: dayIndex + 1,
    season,
  };
}

export function getAge(
  resident: Pick<ResidentClock, 'initialAge' | 'birthDayOfYear'>,
  elapsedDays: number,
): number {
  assertElapsedDays(elapsedDays);
  const { initialAge, birthDayOfYear } = resident;

  if (!Number.isSafeInteger(initialAge) || initialAge < 0) {
    throw new RangeError('La edad inicial debe ser un entero seguro no negativo.');
  }
  if (!Number.isInteger(birthDayOfYear) || birthDayOfYear < 1 || birthDayOfYear > DAYS_PER_YEAR) {
    throw new RangeError('El cumpleaños debe estar entre los días 1 y 336.');
  }

  // Un cumpleaños el día inicial ya está incluido en initialAge.
  const firstBirthday = birthDayOfYear === 1 ? DAYS_PER_YEAR : birthDayOfYear - 1;
  const birthdays = elapsedDays < firstBirthday
    ? 0
    : Math.floor((elapsedDays - firstBirthday) / DAYS_PER_YEAR) + 1;
  const age = initialAge + birthdays;

  if (!Number.isSafeInteger(age)) {
    throw new RangeError('La edad supera el rango de enteros seguros.');
  }
  return age;
}

export function getEligibleProfessions(age: number): readonly Profession[] {
  if (!Number.isSafeInteger(age) || age < 0) {
    throw new RangeError('La edad debe ser un entero seguro no negativo.');
  }
  return PROFESSIONS.filter((profession) => age >= MINIMUM_WORK_AGES[profession]);
}

export function getBirthElapsedDay(resident: Pick<ResidentClock, 'initialAge' | 'birthDayOfYear'>): number {
  getAge(resident, 0);
  const yearsBack = resident.initialAge + (resident.birthDayOfYear === 1 ? 0 : 1);
  const birthDay = resident.birthDayOfYear - 1 - yearsBack * DAYS_PER_YEAR;
  if (!Number.isSafeInteger(birthDay)) throw new RangeError('La fecha de nacimiento excede el rango seguro.');
  return birthDay;
}
