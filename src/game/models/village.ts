import type { Profession, ResidentClock, SimulationState } from './simulation';
import type { InitialConfigId } from '../rules/initialConfig';
import type { EconomyState } from './economy';
import type { MedicalState, SurvivalState } from './survival';
import type { DefenseState } from './defense';
import type { StoryState, TalentDiscovery } from './story';

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
  readonly medical?: MedicalState;
  readonly talents?: readonly TalentDiscovery[];
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
  readonly zeroConditionDays?: number;
  readonly warningLevel?: number;
  readonly collapsedAt?: number;
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

export interface ConstructionProject {
  readonly id: string;
  readonly slotId: string;
  readonly buildingType: Building['type'];
  readonly reservedWood: number;
  readonly status: 'prepared' | 'working' | 'paused';
  readonly progress: number;
  readonly requiredWork?: number;
  readonly materialsConsumed?: boolean;
}

export interface MaintenanceSettings {
  readonly minimumWoodReserve: number;
  readonly orders: readonly { readonly buildingId: string; readonly priority: 'normal' | 'high' }[];
}

export interface WorkAssignment {
  readonly residentId: string;
  readonly profession: Profession;
  readonly workplaceId: string;
  readonly source: 'player' | 'system';
  readonly manualLock: boolean;
  readonly authorized: boolean;
  readonly status: 'active' | 'conflict';
}

export interface VillageState extends SimulationState {
  readonly id: string;
  readonly generationVersion: 'families-v1';
  readonly initialConfigId: InitialConfigId;
  readonly grade: number;
  readonly residents: readonly Resident[];
  readonly families: readonly Family[];
  readonly buildings: readonly Building[];
  readonly constructionSlots: readonly { readonly id: string; readonly buildingId: string | null }[];
  readonly housingAssignments: readonly HousingAssignment[];
  readonly inventory: { readonly food: number; readonly wood: number };
  // Ausente en partidas anteriores; equivale a una lista vacía.
  readonly constructionProjects?: readonly ConstructionProject[];
  readonly maintenance?: MaintenanceSettings;
  readonly workAssignments?: readonly WorkAssignment[];
  readonly economy?: EconomyState;
  readonly survival?: SurvivalState;
  readonly defense?: DefenseState;
  readonly story?: StoryState;
}
