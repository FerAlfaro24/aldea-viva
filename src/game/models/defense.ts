export const TACTICS = ['defend', 'protect-storage', 'negotiate', 'sortie'] as const;
export type DefenseTactic = (typeof TACTICS)[number];

export interface BanditThreat {
  readonly id: string;
  readonly detectedAt: number;
  readonly arrivalDay: number;
  readonly warned: boolean;
  readonly attackers: number;
  readonly strength: number;
  readonly demandFood: number;
  readonly demandWood: number;
}
export interface DefenseState {
  readonly nextCheckDay: number;
  readonly threat?: BanditThreat;
}
