import type { VillageState } from '../models/village';
import { roundResource } from '../rules/resources';
import { isBuildingUsable, isStanding } from './survival';

export function selectStorage(village: VillageState) {
  const capacity = village.buildings.reduce((sum, building) => sum + (building.type === 'warehouse' && isStanding(building) ? building.storageCapacity : 0), 0);
  const deliveryCapacity = village.buildings.reduce((sum, building) => sum + (building.type === 'warehouse' && isBuildingUsable(building) ? building.storageCapacity : 0), 0);
  const occupied = roundResource(village.inventory.food + village.inventory.wood);
  const reservedWood = (village.constructionProjects ?? []).reduce((sum, project) => sum + (project.materialsConsumed ? 0 : project.reservedWood), 0);
  return { capacity, deliveryCapacity, occupied, free: Math.max(0, roundResource(deliveryCapacity - occupied)), reservedWood, availableWood: roundResource(village.inventory.wood - reservedWood) };
}
