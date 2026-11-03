import type { Building, VillageState } from '../models/village';
import { CURRENT_INITIAL_CONFIG_ID, getInitialConfig } from '../rules/initialConfig';
import type { InitialConfigId } from '../rules/initialConfig';
import { validateNewVillage } from '../validation/village';
import { allocateInitialHousing } from './housing';
import { GenerationRandom } from './random';
import { generatePopulation } from './residents';

function initialBuildings(config: ReturnType<typeof getInitialConfig>): readonly Building[] {
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

export function generateVillage(seed: string, initialConfigId: InitialConfigId = CURRENT_INITIAL_CONFIG_ID): VillageState {
  const config = getInitialConfig(initialConfigId);
  const random = new GenerationRandom(seed);
  const { residents, families } = generatePopulation(random);
  const buildings = initialBuildings(config);
  const state: VillageState = {
    id: 'v0001', generationVersion: 'families-v1', initialConfigId, grade: 1,
    elapsedDays: 0, residents, families, buildings,
    constructionSlots: Array.from({ length: config.constructionSlots }, (_, index) => ({
      id: `s${String(index + 1).padStart(4, '0')}`, buildingId: buildings[index]?.id ?? null,
    })),
    housingAssignments: allocateInitialHousing(residents, families, buildings),
    inventory: { food: random.int(...config.food), wood: random.int(...config.wood) },
    chronicle: [{ id: 'founded:v0001', type: 'founded', elapsedDay: 0, villageId: 'v0001', population: residents.length }],
    pendingDecision: null, rng: random.snapshot(),
  };
  validateNewVillage(state);
  return state;
}
