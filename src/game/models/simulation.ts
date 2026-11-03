import type { PROFESSIONS, SEASONS } from '../rules/calendar';
import type { EconomyDaySummary, EconomyPolicy } from './economy';
import type { HealthWarning, SurvivalCause, WinterSeverity } from './survival';
import type { DefenseTactic } from './defense';
import type { StoryChoice, StoryKind } from './story';

export type Profession = (typeof PROFESSIONS)[number];
export type Season = (typeof SEASONS)[number];
export type AdvanceDays = 1 | 7 | 28;

export interface CalendarDate {
  readonly elapsedDays: number;
  readonly year: number;
  readonly month: number;
  readonly dayOfMonth: number;
  readonly dayOfYear: number;
  readonly season: Season;
}

// Contrato temporal mínimo compartido por el habitante completo y las pruebas.
export interface ResidentClock {
  readonly id: string;
  readonly initialAge: number;
  readonly birthDayOfYear: number;
  readonly alive: boolean;
  readonly profession: Profession | null;
  readonly workplaceId: string | null;
  // Si existe, initialAge expresa la edad al llegar, no al fundarse la aldea.
  readonly arrivedAt?: number;
}

export interface RngSnapshot {
  readonly algorithm: 'xorshift32-fnv1a-utf16le-v1';
  readonly seed: string;
  readonly state: number;
}

export interface PendingDecision {
  readonly id: string;
  readonly type: string;
  readonly sinceElapsedDay: number;
}

interface CalendarEntry {
  readonly id: string;
  readonly elapsedDay: number;
}

export type ChronicleEntry = CalendarEntry & (
  | { readonly type: 'founded'; readonly villageId: string; readonly population: number }
  | { readonly type: 'year_changed'; readonly year: number }
  | { readonly type: 'season_changed'; readonly season: Season }
  | { readonly type: 'birthday'; readonly residentId: string; readonly age: number }
  | { readonly type: 'eligible_job'; readonly residentId: string; readonly profession: Profession }
  | { readonly type: 'housing_changed'; readonly residentId: string; readonly fromHouseId: string | null; readonly toHouseId: string }
  | { readonly type: 'construction_changed'; readonly projectId: string; readonly slotId: string; readonly buildingType: 'house' | 'orchard' | 'warehouse'; readonly action: 'prepared' | 'paused' | 'resumed' | 'cancelled' | 'started' | 'completed'; readonly reservedWood: number; readonly materialsConsumed?: boolean }
  | { readonly type: 'building_repaired'; readonly buildingId: string; readonly woodCost: number; readonly condition: number }
  | { readonly type: 'village_expanded'; readonly fromGrade: number; readonly toGrade: number; readonly addedSlots: number; readonly woodCost: number }
  | { readonly type: 'maintenance_changed'; readonly buildingId: string | null; readonly priority: 'normal' | 'high' | null; readonly minimumWoodReserve: number }
  | { readonly type: 'job_changed'; readonly residentId: string; readonly profession: Profession | null; readonly workplaceId: string | null; readonly manualLock: boolean }
  | { readonly type: 'economy_policy_changed'; readonly policy: EconomyPolicy }
  | ({ readonly type: 'economy_day' } & EconomyDaySummary)
  | { readonly type: 'winter_outlook'; readonly year: number; readonly forecast: WinterSeverity | 'uncertain' }
  | { readonly type: 'winter_started'; readonly year: number; readonly severity: WinterSeverity }
  | { readonly type: 'building_warning'; readonly buildingId: string; readonly level: number; readonly condition: number }
  | { readonly type: 'building_collapsed'; readonly buildingId: string; readonly lostFood: number; readonly lostWood: number; readonly displacedResidentIds: readonly string[]; readonly cancelledProjectIds: readonly string[] }
  | { readonly type: 'health_warning'; readonly residentId: string; readonly warning: HealthWarning; readonly health: number; readonly hunger: number }
  | { readonly type: 'medical_episode'; readonly residentId: string; readonly action: 'illness' | 'rescue' | 'injury' | 'recovered'; readonly cause: SurvivalCause; readonly untilElapsedDay: number }
  | { readonly type: 'resident_died'; readonly residentId: string; readonly cause: SurvivalCause }
  | { readonly type: 'village_ended'; readonly populationLost: number }
  | { readonly type: 'bandit_warning'; readonly threatId: string; readonly arrivalDay: number; readonly attackers: number }
  | { readonly type: 'bandit_attack'; readonly threatId: string; readonly attackers: number; readonly surprise: boolean }
  | { readonly type: 'bandit_resolved'; readonly threatId: string; readonly tactic: DefenseTactic; readonly success: boolean; readonly successPercent: number; readonly paidFood: number; readonly paidWood: number; readonly stolenFood: number; readonly stolenWood: number; readonly injuredIds: readonly string[]; readonly deadIds: readonly string[]; readonly damagedBuildingId: string | null; readonly buildingDamage: number; readonly cancelledProjectIds: readonly string[]; readonly participantIds?: readonly string[] }
  | { readonly type: 'story_offered'; readonly eventId: string; readonly kind: StoryKind; readonly residentId?: string }
  | { readonly type: 'story_resolved'; readonly eventId: string; readonly kind: StoryKind; readonly choice: StoryChoice; readonly residentId: string; readonly buildingId: string | null; readonly successPercent: number; readonly success: boolean; readonly experience: number; readonly foodCost: number; readonly woodCost: number; readonly foodGained: number; readonly woodGained: number; readonly foodRejected: number; readonly woodRejected: number; readonly healthLost: number; readonly buildingChange: number }
  | { readonly type: 'visitors_resolved'; readonly eventId: string; readonly accepted: boolean; readonly names: readonly string[]; readonly familyId: string | null; readonly residentIds: readonly string[] }
  | { readonly type: 'work_insight'; readonly residentId: string; readonly profession: Profession; readonly experience: number }
  | { readonly type: 'talent_discovered'; readonly residentId: string; readonly profession: Profession; readonly level: 'promising' | 'confirmed'; readonly potential?: number }
);

export interface SimulationState {
  readonly elapsedDays: number;
  readonly residents: readonly ResidentClock[];
  readonly rng: RngSnapshot;
  readonly chronicle: readonly ChronicleEntry[];
  readonly pendingDecision: PendingDecision | null;
}

export interface AdvanceResult<TState extends SimulationState = SimulationState> {
  readonly state: TState;
  readonly processedDays: number;
  readonly remainingDays: number;
  readonly events: readonly ChronicleEntry[];
  readonly interrupted: boolean;
}

// Punto de extensión puro para eventos futuros y pruebas de interrupción.
export interface TickOptions<TState extends SimulationState = SimulationState> {
  readonly decisionAfterDay?: (state: TState) => PendingDecision | null;
}
