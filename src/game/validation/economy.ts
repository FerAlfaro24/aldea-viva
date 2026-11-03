import type { EconomyDaySummary, EconomyPolicy } from '../models/economy';
import type { VillageState } from '../models/village';
import { isResourceAmount, resourceUnits } from '../rules/resources';

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Economía no válida: ${message}`);
}
export function validateEconomyPolicy(village: VillageState, policy: EconomyPolicy): void {
  invariant(['abundant', 'normal', 'reduced', 'emergency'].includes(policy.ration), 'ración desconocida');
  invariant(['balanced', 'children', 'workers', 'houses'].includes(policy.priority), 'prioridad desconocida');
  invariant(policy.deliveryPriority === 'food' || policy.deliveryPriority === 'wood', 'orden de entregas desconocido');
  invariant(Array.isArray(policy.priorityHouseIds) && new Set(policy.priorityHouseIds).size === policy.priorityHouseIds.length, 'viviendas repetidas');
  for (const id of policy.priorityHouseIds) invariant(village.buildings.some((building) => building.id === id && building.type === 'house'), 'vivienda señalada inexistente');
}
export function validateEconomySummary(report: EconomyDaySummary): void {
  for (const value of Object.values(report)) invariant(isResourceAmount(value), 'cantidad de balance inválida');
  const same = (left: number, right: number) => resourceUnits(left) === resourceUnits(right);
  invariant(same(report.foodProduced, report.foodStored + report.foodRejected), 'cosecha incoherente');
  invariant(same(report.woodProduced, report.woodStored + report.woodRejected), 'tala incoherente');
  invariant(same(report.foodRequested, report.foodConsumed + report.foodMissing), 'reparto incoherente');
  invariant(same(report.closingFood, report.openingFood + report.foodStored - report.foodConsumed), 'balance de alimentos incoherente');
  invariant(same(report.closingWood, report.openingWood - report.workWoodSpent + report.woodStored), 'balance de madera incoherente');
}
export function validateEconomy(village: VillageState): void {
  if (!village.economy) return;
  validateEconomyPolicy(village, village.economy.policy);
  const report = village.economy.lastDay;
  if (!report) return;
  invariant(Number.isSafeInteger(report.elapsedDay) && report.elapsedDay > 0 && report.elapsedDay <= village.elapsedDays, 'fecha de informe inválida');
  validateEconomyPolicy(village, report.policy);
  const { elapsedDay: _day, policy: _policy, allocations, ...summary } = report;
  validateEconomySummary(summary);
  invariant(new Set(allocations.map((allocation) => allocation.residentId)).size === allocations.length, 'reparto duplicado');
  for (const allocation of allocations) {
    invariant(village.residents.some((person) => person.id === allocation.residentId), 'reparto a persona inexistente');
    invariant([allocation.need, allocation.requested, allocation.served, allocation.missing].every(isResourceAmount), 'ración inválida');
    invariant(resourceUnits(allocation.requested) === resourceUnits(allocation.served) + resourceUnits(allocation.missing), 'ración incoherente');
  }
  for (const [field, key] of [['foodRequested', 'requested'], ['foodConsumed', 'served'], ['foodMissing', 'missing']] as const) {
    invariant(resourceUnits(report[field]) === allocations.reduce((sum, allocation) => sum + resourceUnits(allocation[key]), 0), 'totales del reparto incoherentes');
  }
}
