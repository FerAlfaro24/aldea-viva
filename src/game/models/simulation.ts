import type { PROFESSIONS, SEASONS } from '../rules/calendar';

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
