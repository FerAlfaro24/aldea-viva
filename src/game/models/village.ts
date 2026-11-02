import type { Profession, ResidentClock, SimulationState } from './simulation';

export const ATTRIBUTE_KEYS = ['strength', 'endurance', 'agility', 'dexterity', 'vitality'] as const;
export type AttributeKey = (typeof ATTRIBUTE_KEYS)[number];
export type Attributes = Readonly<Record<AttributeKey, number>>;
export type FamilyKind = 'parents-and-children' | 'partners' | 'siblings' | 'single';
export type ClueId = 'strong-build' | 'steady-hands' | 'field-learning' | 'wood-learning'
  | 'craft-learning' | 'defense-learning' | 'unknown-aptitudes';

export interface Skill {
  readonly effective: number;
  readonly historicalBest: number;
  readonly experience: number;
  readonly potentialSecret: number;
}

export interface Resident extends ResidentClock {
  readonly displayName: string;
  readonly familyId: string;
  readonly relations: {
    readonly parentIds: readonly string[];
    readonly childIds: readonly string[];
    readonly siblingIds: readonly string[];
    readonly partnerId: string | null;
  };
  readonly attributes: Attributes;
  readonly skills: Readonly<Record<Profession, Skill>>;
  readonly condition: { readonly health: number; readonly hunger: number };
  readonly initialClueIds: readonly ClueId[];
  readonly origin: string;
}

export interface Family {
  readonly id: string;
  readonly displayName: string;
  readonly kind: FamilyKind;
  readonly memberIds: readonly string[];
}

interface BuildingBase {
  readonly id: string;
  readonly displayName: string;
  readonly slotId: string;
  readonly condition: number;
}

export type Building = BuildingBase & (
  | { readonly type: 'house'; readonly housingCapacity: number }
  | { readonly type: 'orchard'; readonly workerCapacity: number }
  | { readonly type: 'warehouse'; readonly storageCapacity: number }
);

export interface HousingAssignment {
  readonly residentId: string;
  readonly houseId: string | null;
  readonly source: 'system' | 'player';
  readonly locked: boolean;
}

export interface VillageState extends SimulationState {
  readonly id: string;
  readonly generationVersion: 'families-v1';
  readonly initialConfigId: 'provisional-v1';
  readonly grade: number;
  readonly residents: readonly Resident[];
  readonly families: readonly Family[];
  readonly buildings: readonly Building[];
  readonly constructionSlots: readonly { readonly id: string; readonly buildingId: string | null }[];
  readonly housingAssignments: readonly HousingAssignment[];
  readonly inventory: { readonly food: number; readonly wood: number };
}
