import type { EconomyDay, FoodAllocation } from '../models/economy';
import type { VillageState } from '../models/village';
import { ECONOMY_RULES } from '../rules/economy';
import { resourceAmount, resourceUnits, roundResource } from '../rules/resources';
import { foodPriorityWeight, normalFoodNeed, selectEconomyPolicy, selectProduction } from '../selectors/economy';
import { storeDelivery } from '../commands/storage';
import { randomInt } from './rng';

// Reparto proporcional ponderado, limitado a lo solicitado. Los sobrantes de redondeo
// se distribuyen por restos mayores con desempate rotativo por día, sin consumir azar.
export function distributeFood(requests: readonly { readonly requested: number; readonly weight: number }[], available: number, day: number): number[] {
  const remaining = requests.map((request) => resourceUnits(request.requested));
  const served = requests.map(() => 0);
  let budget = Math.min(resourceUnits(available), remaining.reduce((sum, quantity) => sum + quantity, 0));
  while (budget > 0) {
    const totalWeight = remaining.reduce((sum, quantity, index) => sum + quantity * requests[index]!.weight, 0);
    const initial = budget;
    const fractions: { index: number; fraction: number }[] = [];
    for (let index = 0; index < remaining.length; index++) {
      if (remaining[index] === 0) continue;
      const share = initial * remaining[index]! * requests[index]!.weight / totalWeight;
      const quantity = Math.min(remaining[index]!, Math.floor(share));
      served[index]! += quantity; remaining[index]! -= quantity; budget -= quantity;
      fractions.push({ index, fraction: share - Math.floor(share) });
    }
    if (budget === 0) break;
    fractions.sort((left, right) => right.fraction - left.fraction
      || ((left.index + day) % requests.length) - ((right.index + day) % requests.length));
    for (const { index } of fractions) {
      if (budget === 0) break;
      if (remaining[index]! > 0) { remaining[index]!--; served[index]!++; budget--; }
    }
  }
  return served.map(resourceAmount);
}

export function processEconomyDay(village: VillageState, opening: VillageState['inventory']): VillageState {
  const policy = selectEconomyPolicy(village);
  const produced = selectProduction(village);
  const firstResource = policy.deliveryPriority;
  const secondResource = firstResource === 'food' ? 'wood' : 'food';
  const quantities = { food: produced.food, wood: produced.wood };
  const first = storeDelivery(village, firstResource, quantities[firstResource]);
  const second = storeDelivery(first.state, secondResource, quantities[secondResource]);
  const receipts = { [firstResource]: first, [secondResource]: second };
  const people = [...village.residents].filter((person) => person.alive).sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  let rng = village.rng;
  const needs = people.map((person) => {
    const variation = randomInt(rng, -ECONOMY_RULES.dailyVariationPercent, ECONOMY_RULES.dailyVariationPercent);
    rng = variation.rng;
    const need = roundResource(normalFoodNeed(village, person) * (1 + variation.value / 100));
    return { need, requested: roundResource(need * ECONOMY_RULES.rationFactors[policy.ration]), weight: foodPriorityWeight(village, person, policy) };
  });
  const servings = distributeFood(needs, second.state.inventory.food, village.elapsedDays);
  const allocations: FoodAllocation[] = people.map((person, index) => ({ residentId: person.id, need: needs[index]!.need,
    requested: needs[index]!.requested, served: servings[index]!, missing: roundResource(needs[index]!.requested - servings[index]!) }));
  const sum = (key: 'requested' | 'served' | 'missing') => resourceAmount(allocations.reduce((total, allocation) => total + resourceUnits(allocation[key]), 0));
  const closingFood = roundResource(second.state.inventory.food - sum('served'));
  const summary = { openingFood: opening.food, openingWood: opening.wood,
    foodProduced: produced.food, woodProduced: produced.wood,
    foodStored: receipts.food!.accepted, woodStored: receipts.wood!.accepted,
    foodRejected: receipts.food!.rejected, woodRejected: receipts.wood!.rejected,
    foodRequested: sum('requested'), foodConsumed: sum('served'), foodMissing: sum('missing'),
    workWoodSpent: roundResource(opening.wood - village.inventory.wood), closingFood, closingWood: second.state.inventory.wood };
  const lastDay: EconomyDay = { ...summary, elapsedDay: village.elapsedDays, policy, allocations };
  const next: VillageState = { ...second.state, rng, inventory: { ...second.state.inventory, food: closingFood }, economy: { policy, lastDay },
    chronicle: [...second.state.chronicle, { ...summary, id: `economy:${village.elapsedDays}`, elapsedDay: village.elapsedDays, type: 'economy_day' }] };
  return next;
}
