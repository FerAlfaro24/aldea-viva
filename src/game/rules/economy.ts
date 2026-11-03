import type { EconomyPolicy } from '../models/economy';

export const DEFAULT_ECONOMY_POLICY: EconomyPolicy = {
  ration: 'normal', priority: 'balanced', priorityHouseIds: [], deliveryPriority: 'food',
};
// Valores provisionales para jugar y ajustar; no añaden consecuencias físicas de 0.5.
export const ECONOMY_RULES = {
  rationFactors: { abundant: 1.25, normal: 1, reduced: 0.8, emergency: 0.6 },
  dailyVariationPercent: 5,
  preferredWeight: 2,
  farmer: { base: 3, skill: 0.06, attribute: 0.025 },
  woodcutter: { base: 2, skill: 0.04, attribute: 0.02 },
  activity: { farmer: 1.1, builder: 1.15, woodcutter: 1.2, warrior: 1.15 },
  age: { infant: 0.45, child: 0.65, teenager: 0.85, adult: 1, older: 0.9 },
} as const;
