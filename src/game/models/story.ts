import type { Family, Resident } from './village';
import type { Profession } from './simulation';

export type StoryKind = 'harvest-trial' | 'forest-route' | 'urgent-repair' | 'visitors';
export type StoryChoice = 'decline' | 'careful' | 'bold' | 'patch' | 'reinforce' | 'accept' | 'reject';
export interface TalentDiscovery { readonly profession: Profession; readonly level: 'promising' | 'confirmed'; readonly elapsedDay: number }
interface StoryBase { readonly id: string; readonly elapsedDay: number }
export type StoryEvent = StoryBase & (
  | { readonly kind: 'harvest-trial' | 'forest-route'; readonly residentId: string }
  | { readonly kind: 'urgent-repair'; readonly residentId: string; readonly buildingId: string }
  | { readonly kind: 'visitors'; readonly residents: readonly Resident[]; readonly family: Family }
);
export interface StoryState {
  readonly nextCheckDay: number;
  readonly lastVisitorDay?: number;
  readonly pending?: StoryEvent;
}
