import { getCalendarDate } from '../core/calendar';
import type { VillageState } from '../models/village';
import { DAYS_PER_SEASON, DAYS_PER_YEAR } from '../rules/calendar';
import { ECONOMY_RULES } from '../rules/economy';
import { normalFoodNeed, selectEconomyPolicy, selectProduction } from './economy';
import { selectStorage } from './storage';

// Objetivo orientativo, no altera raciones ni revela la severidad del invierno.
// Usa la comunidad y capacidad actuales; incluye 20 % de margen y variación diaria.
export function selectWinterPlan(village: VillageState) {
  const date = getCalendarDate(village.elapsedDays);
  const yearStart = Math.floor(village.elapsedDays / DAYS_PER_YEAR) * DAYS_PER_YEAR;
  const winterStart = yearStart + DAYS_PER_SEASON * 3;
  const inWinter = date.season === 'winter';
  const daysToWinter = Math.max(0, winterStart - village.elapsedDays);
  const remainingDays = inWinter ? Math.max(0, yearStart + DAYS_PER_YEAR - 1 - village.elapsedDays) : DAYS_PER_SEASON;
  const living = village.residents.filter((person) => person.alive);
  const ration = Math.max(1, ECONOMY_RULES.rationFactors[selectEconomyPolicy(village).ration]);
  const dailyNeed = living.reduce((sum, person) => sum + normalFoodNeed(village, person, inWinter ? village.elapsedDays + 1 : winterStart) * ration, 0);
  const winterProduction = selectProduction(village, inWinter ? village.elapsedDays + 1 : winterStart).food;
  const foodTarget = living.length ? Math.ceil(Math.max(0, dailyNeed * 1.05 - winterProduction) * remainingDays * 1.2 / 10) * 10 : 0;
  const woodTarget = Math.max(100, village.maintenance?.minimumWoodReserve ?? 0);
  const storage = selectStorage(village);
  const woodToStore = Math.max(woodTarget + storage.reservedWood, village.inventory.wood);
  const capacityTarget = Math.ceil((foodTarget + woodToStore) / 600) * 600;
  return { inWinter, daysToWinter, remainingDays, foodTarget, woodTarget, capacityTarget,
    foodMissing: Math.max(0, Math.round(foodTarget - village.inventory.food)),
    capacityMissing: Math.max(0, capacityTarget - storage.deliveryCapacity),
    ready: living.length > 0 && village.inventory.food >= foodTarget,
    progress: foodTarget > 0 ? Math.min(100, Math.floor(village.inventory.food / foodTarget * 100)) : 0 };
}
