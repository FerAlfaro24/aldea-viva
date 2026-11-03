import type { Profession } from './simulation';
export type WinterSeverity = 'mild' | 'normal' | 'harsh';
export type SurvivalCause = 'hunger' | 'cold' | 'combined' | 'combat' | 'accident';
export type HealthWarning = 'well' | 'hungry' | 'weak' | 'critical';
export interface WinterPlan {
  readonly year: number;
  readonly severity: WinterSeverity;
  readonly forecast: WinterSeverity | 'uncertain';
  readonly outlookIssuedAt: number | null;
  readonly revealedAt: number | null;
}
export interface MedicalEpisode {
  readonly type: 'illness' | 'rescue' | 'injury';
  readonly elapsedDay: number;
  readonly untilElapsedDay: number;
  readonly cause: SurvivalCause;
}
export interface MedicalState {
  readonly warning?: HealthWarning;
  readonly illnessActive?: boolean;
  readonly incapacityUntil?: number;
  readonly permanentCapacity?: number;
  readonly stabilizedUntil?: number;
  readonly episodes?: readonly MedicalEpisode[];
  readonly death?: { readonly elapsedDay: number; readonly cause: SurvivalCause; readonly lastProfession: Profession | null };
}
export interface SurvivalState {
  readonly winters: readonly WinterPlan[];
  readonly endedAt?: number;
}
