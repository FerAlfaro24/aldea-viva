export type Ration = 'abundant' | 'normal' | 'reduced' | 'emergency';
export type FoodPriority = 'balanced' | 'children' | 'workers' | 'houses';
export interface EconomyPolicy {
  readonly ration: Ration;
  readonly priority: FoodPriority;
  readonly priorityHouseIds: readonly string[];
  readonly deliveryPriority: 'food' | 'wood';
}
export interface FoodAllocation {
  readonly residentId: string;
  readonly need: number;
  readonly requested: number;
  readonly served: number;
  readonly missing: number;
}
export interface EconomyDaySummary {
  readonly openingFood: number;
  readonly openingWood: number;
  readonly foodProduced: number;
  readonly woodProduced: number;
  readonly foodStored: number;
  readonly woodStored: number;
  readonly foodRejected: number;
  readonly woodRejected: number;
  readonly foodRequested: number;
  readonly foodConsumed: number;
  readonly foodMissing: number;
  readonly workWoodSpent: number;
  readonly closingFood: number;
  readonly closingWood: number;
}
export interface EconomyDay extends EconomyDaySummary {
  readonly elapsedDay: number;
  readonly policy: EconomyPolicy;
  readonly allocations: readonly FoodAllocation[];
}
export interface EconomyState {
  readonly policy: EconomyPolicy;
  readonly lastDay?: EconomyDay;
}
