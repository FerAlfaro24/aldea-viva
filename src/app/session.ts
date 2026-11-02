import { advanceDays } from '../game/core/tick';
import { generateVillage } from '../game/generation/village';
import type { AdvanceDays } from '../game/models/simulation';
import type { VillageState } from '../game/models/village';
import { SLOT_IDS } from '../game/models/save';
import type { SlotId } from '../game/models/save';

export { SLOT_IDS } from '../game/models/save';
export type { SlotId } from '../game/models/save';
export type Route = 'home' | 'slots' | 'village' | 'residents' | 'resident' | 'chronicle';

export interface ResidentFilters {
  readonly search: string;
  readonly family: string;
  readonly housing: string;
  readonly age: 'all' | 'children' | 'adults' | 'older';
  readonly employment: 'all' | 'unassigned';
  readonly sort: 'name' | 'age';
}

export const EMPTY_FILTERS: ResidentFilters = {
  search: '', family: '', housing: '', age: 'all', employment: 'all', sort: 'name',
};

export interface Session {
  readonly slots: Readonly<Record<SlotId, VillageState | null>>;
  readonly activeSlot: SlotId | null;
  readonly route: Route;
  readonly selectedResidentId: string | null;
  readonly filters: ResidentFilters;
}

export type SessionAction =
  | { readonly type: 'navigate'; readonly route: Route }
  | { readonly type: 'create'; readonly slot: SlotId; readonly seed: string; readonly confirmReplacement: boolean }
  | { readonly type: 'continue'; readonly slot: SlotId }
  | { readonly type: 'delete'; readonly slot: SlotId; readonly confirmed: boolean }
  | { readonly type: 'inspect'; readonly id: string }
  | { readonly type: 'filter'; readonly filters: Partial<ResidentFilters> }
  | { readonly type: 'advance'; readonly days: AdvanceDays };

export function createSession(): Session {
  return { slots: { 1: null, 2: null, 3: null }, activeSlot: null, route: 'home', selectedResidentId: null, filters: { ...EMPTY_FILTERS } };
}

export function activeVillage(session: Session): VillageState | null {
  return session.activeSlot === null ? null : session.slots[session.activeSlot];
}

function assertSlot(slot: SlotId): void {
  if (!SLOT_IDS.includes(slot)) throw new RangeError('El espacio debe ser 1, 2 o 3.');
}

export function reduceSession(session: Session, action: SessionAction): Session {
  switch (action.type) {
    case 'create': {
      assertSlot(action.slot);
      if (session.slots[action.slot] && !action.confirmReplacement) {
        throw new Error('Confirma el reemplazo antes de crear otra aldea en este espacio.');
      }
      const village = generateVillage(action.seed);
      return { ...session, slots: { ...session.slots, [action.slot]: village }, activeSlot: action.slot,
        route: 'village', selectedResidentId: null, filters: { ...EMPTY_FILTERS } };
    }
    case 'continue': {
      assertSlot(action.slot);
      if (!session.slots[action.slot]) throw new Error('Este espacio todavía no tiene una aldea en esta sesión.');
      return { ...session, activeSlot: action.slot, route: 'village', selectedResidentId: null, filters: { ...EMPTY_FILTERS } };
    }
    case 'delete': {
      assertSlot(action.slot);
      if (!action.confirmed) throw new Error('Confirma el borrado de la aldea.');
      return { ...session, slots: { ...session.slots, [action.slot]: null },
        activeSlot: session.activeSlot === action.slot ? null : session.activeSlot,
        selectedResidentId: null, route: 'slots', filters: { ...EMPTY_FILTERS } };
    }
    case 'navigate': {
      const protectedRoute = action.route !== 'home' && action.route !== 'slots';
      if (protectedRoute && !activeVillage(session)) return { ...session, route: 'slots' };
      if (action.route === 'resident' && !session.selectedResidentId) return { ...session, route: 'residents' };
      return { ...session, route: action.route };
    }
    case 'inspect': {
      const village = activeVillage(session);
      if (!village?.residents.some((person) => person.id === action.id)) throw new Error('No se encontró a esa persona en la aldea.');
      return { ...session, route: 'resident', selectedResidentId: action.id };
    }
    case 'filter': return { ...session, filters: { ...session.filters, ...action.filters } };
    case 'advance': {
      const village = activeVillage(session);
      if (!village || session.activeSlot === null) throw new Error('Primero crea o abre una aldea.');
      const result = advanceDays(village, action.days);
      return { ...session, slots: { ...session.slots, [session.activeSlot]: result.state } };
    }
  }
}
