export const DAYS_PER_MONTH = 28;
export const MONTHS_PER_YEAR = 12;
export const DAYS_PER_YEAR = DAYS_PER_MONTH * MONTHS_PER_YEAR;
export const DAYS_PER_SEASON = DAYS_PER_YEAR / 4;

export const SEASONS = ['spring', 'summer', 'autumn', 'winter'] as const;

export const PROFESSIONS = ['farmer', 'builder', 'woodcutter', 'warrior'] as const;

export const MINIMUM_WORK_AGES = {
  farmer: 12,
  builder: 14,
  woodcutter: 15,
  warrior: 16,
} as const;
