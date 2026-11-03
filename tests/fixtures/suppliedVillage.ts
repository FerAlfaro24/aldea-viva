import { generateVillage } from '../../src/game/generation/village';
import type { VillageState } from '../../src/game/models/village';
// Suministros amplios y comprobación de defensa aplazada para aislar calendario/persistencia.
export function suppliedVillage(seed: string): VillageState {
  const village = generateVillage(seed);
  return { ...village, defense: { nextCheckDay: 100000 }, story: { nextCheckDay: 100000 }, inventory: { food: 10000, wood: village.inventory.wood }, buildings: village.buildings.map((building) =>
    building.type === 'warehouse' ? { ...building, storageCapacity: 20000 } : building) };
}
