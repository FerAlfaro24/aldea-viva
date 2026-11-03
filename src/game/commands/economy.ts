import type { EconomyPolicy } from '../models/economy';
import type { VillageState } from '../models/village';
import { selectEconomyPolicy } from '../selectors/economy';
import { validateEconomyPolicy } from '../validation/economy';
import { validateVillageState } from '../validation/village';

export function configureEconomy(village: VillageState, policy: EconomyPolicy): VillageState {
  validateVillageState(village);
  validateEconomyPolicy(village, policy);
  const current = selectEconomyPolicy(village);
  const nextPolicy: EconomyPolicy = { ...policy, priorityHouseIds: [...policy.priorityHouseIds].sort() };
  if (current.ration === nextPolicy.ration && current.priority === nextPolicy.priority && current.deliveryPriority === nextPolicy.deliveryPriority
    && JSON.stringify([...current.priorityHouseIds].sort()) === JSON.stringify(nextPolicy.priorityHouseIds)) return village;
  const next: VillageState = { ...village, economy: { ...village.economy, policy: nextPolicy },
    chronicle: [...village.chronicle, { id: `economy-policy:${village.elapsedDays}:${village.chronicle.length}`, elapsedDay: village.elapsedDays, type: 'economy_policy_changed', policy: nextPolicy }] };
  validateVillageState(next);
  return next;
}
