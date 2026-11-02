import type { Building, VillageState } from '../models/village';
import { INITIAL_CONFIG } from '../rules/initialConfig';
import { validateNewVillage } from '../validation/village';
import { allocateInitialHousing } from './housing';
import { GenerationRandom } from './random';
import { generatePopulation } from './residents';

function initialBuildings(): readonly Building[] {
  const config = INITIAL_CONFIG;
  const buildings: Building[] = [];
  const add = (details: Building) => buildings.push(details);
  const slotId = () => `s${String(buildings.length + 1).padStart(4, '0')}`;
  for (let index = 1; index <= config.houseCount; index++) {
    add({ id: `b-house-${index}`, displayName: `Casa ${index}`, type: 'house',
      slotId: slotId(), condition: 100, housingCapacity: config.bedsPerHouse });
  }
  for (let index = 1; index <= config.orchardCount; index++) {
    add({ id: `b-orchard-${index}`, displayName: `Huerto ${index}`, type: 'orchard',
      slotId: slotId(), condition: 100, workerCapacity: config.workersPerOrchard });
  }
  add({ id: 'b-warehouse-1', displayName: 'Almacén', type: 'warehouse',
    slotId: slotId(), condition: 100, storageCapacity: config.storageCapacity });
  return buildings;
}

export function generateVillage(seed: string): VillageState {
  const random = new GenerationRandom(seed);
  const { residents, families } = generatePopulation(random);
  const buildings = initialBuildings();
  const state: VillageState = {
    id: 'v0001', generationVersion: 'families-v1', initialConfigId: 'provisional-v1', grade: 1,
    elapsedDays: 0, residents, families, buildings,
    constructionSlots: Array.from({ length: INITIAL_CONFIG.constructionSlots }, (_, index) => ({
      id: `s${String(index + 1).padStart(4, '0')}`, buildingId: buildings[index]?.id ?? null,
    })),
    housingAssignments: allocateInitialHousing(residents, families, buildings),
    inventory: { food: random.int(...INITIAL_CONFIG.food), wood: random.int(...INITIAL_CONFIG.wood) },
    chronicle: [{ id: 'founded:v0001', type: 'founded', elapsedDay: 0, villageId: 'v0001', population: residents.length }],
    pendingDecision: null, rng: random.snapshot(),
  };
  validateNewVillage(state);
  return state;
}
