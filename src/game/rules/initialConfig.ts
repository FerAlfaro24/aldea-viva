// Salvo población y calendario, estos valores son PROVISIONALES y no balance final.
// Si cambia la generación, revisar initialConfigId/generationVersion antes de publicar.
export const INITIAL_CONFIG_V1 = {
  population: [15, 20],
  children: [2, 3],
  childAges: [0, 11],
  adultAges: [18, 76],
  minimumParentGap: 18,
  maximumParentGap: 45,
  childAgeGaps: [2, 3],
  siblingAgeGaps: [2, 6],
  partnerAgeDifference: 10,
  attributes: [20, 75],
  childAttributes: [0, 35],
  skills: [0, 40],
  childSkills: [0, 8],
  potentials: [10, 95],
  initialHealth: 100,
  initialHunger: 0,
  houseCount: 3,
  bedsPerHouse: 5,
  orchardCount: 2,
  workersPerOrchard: 2,
  constructionSlots: 10,
  storageCapacity: 600,
  food: [180, 220],
  wood: [80, 100],
  clueAttributeThreshold: 65,
  clueLearningAttributeThreshold: 45,
  cluePotentialThreshold: 70,
} as const;

export const INITIAL_CONFIG = { ...INITIAL_CONFIG_V1, houseCount: 4 } as const;
export const CURRENT_INITIAL_CONFIG_ID = 'housing-20-v1' as const;
export const INITIAL_CONFIGS = {
  'provisional-v1': INITIAL_CONFIG_V1,
  [CURRENT_INITIAL_CONFIG_ID]: INITIAL_CONFIG,
} as const;
export type InitialConfigId = keyof typeof INITIAL_CONFIGS;

export function getInitialConfig(id: InitialConfigId) {
  const config = INITIAL_CONFIGS[id];
  if (!config) throw new Error('Configuración inicial desconocida.');
  return config;
}
