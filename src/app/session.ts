import { advanceVillageDays } from '../game/core/workDay';
import { generateVillage } from '../game/generation/village';
import type { AdvanceDays, Profession } from '../game/models/simulation';
import type { VillageState } from '../game/models/village';
import { SLOT_IDS } from '../game/models/save';
import type { SlotId } from '../game/models/save';
import { getCalendarDate } from '../game/core/calendar';
import { DAYS_PER_MONTH } from '../game/rules/calendar';
import { moveResident } from '../game/commands/housing';
import { prepareConstruction, changeConstruction } from '../game/commands/construction';
import { expandVillage } from '../game/commands/expansion';
import { configureMaintenance } from '../game/commands/maintenance';
import { assignWork } from '../game/commands/work';
import { configureEconomy } from '../game/commands/economy';
import type { EconomyPolicy } from '../game/models/economy';
import { isGameOver } from '../game/selectors/survival';
import type { Building } from '../game/models/village';
import type { DefenseTactic } from '../game/models/defense';
import { resolveBanditAttack } from '../game/commands/defense';
import type { StoryChoice } from '../game/models/story';
import { resolveStory } from '../game/commands/story';
import { EMPTY_CHRONICLE_FILTERS, type ChronicleFilters } from '../game/selectors/chronicle';

export { SLOT_IDS } from '../game/models/save';
export type { SlotId } from '../game/models/save';
export type Route = 'home' | 'slots' | 'village' | 'residents' | 'resident' | 'chronicle' | 'calendar' | 'buildings' | 'professions' | 'economy' | 'survival' | 'defense' | 'events' | 'help';

export interface ResidentFilters {
  readonly search: string;
  readonly family: string;
  readonly housing: string;
  readonly age: 'all' | 'children' | 'adults' | 'older';
  readonly employment: 'all' | 'unassigned' | Profession;
  readonly life: 'alive' | 'dead' | 'all';
  readonly sort: 'name' | 'age';
}

export const EMPTY_FILTERS: ResidentFilters = {
  search: '', family: '', housing: '', age: 'all', employment: 'all', life: 'alive', sort: 'name',
};

export interface Session {
  readonly slots: Readonly<Record<SlotId, VillageState | null>>;
  readonly activeSlot: SlotId | null;
  readonly route: Route;
  readonly selectedResidentId: string | null;
  readonly selectedCalendarDay: number | null;
  readonly selectedPlotId: string | null;
  readonly filters: ResidentFilters;
  readonly chronicleFilters: ChronicleFilters;
}

export type SessionAction =
  | { readonly type: 'navigate'; readonly route: Route }
  | { readonly type: 'create'; readonly slot: SlotId; readonly seed: string; readonly confirmReplacement: boolean }
  | { readonly type: 'continue'; readonly slot: SlotId }
  | { readonly type: 'delete'; readonly slot: SlotId; readonly confirmed: boolean }
  | { readonly type: 'inspect'; readonly id: string }
  | { readonly type: 'filter'; readonly filters: Partial<ResidentFilters> }
  | { readonly type: 'calendar-month'; readonly delta: -1 | 1 }
  | { readonly type: 'calendar-today' }
  | { readonly type: 'calendar-day'; readonly elapsedDay: number }
  | { readonly type: 'inspect-plot'; readonly id: string }
  | { readonly type: 'move-resident'; readonly residentId: string; readonly houseId: string }
  | { readonly type: 'assign-work'; readonly residentId: string; readonly profession: Profession | null; readonly workplaceId: string | null }
  | { readonly type: 'set-economy-policy'; readonly policy: EconomyPolicy }
  | { readonly type: 'resolve-attack'; readonly threatId: string; readonly tactic: DefenseTactic }
  | { readonly type: 'resolve-story'; readonly eventId: string; readonly choice: StoryChoice }
  | { readonly type: 'chronicle-filter'; readonly filters: Partial<ChronicleFilters> }
  | { readonly type: 'person-history'; readonly residentId: string }
  | { readonly type: 'prepare-construction'; readonly slotId: string; readonly buildingType: Building['type'] }
  | { readonly type: 'change-construction'; readonly projectId: string; readonly action: 'pause' | 'resume' | 'cancel' }
  | { readonly type: 'expand-village' }
  | { readonly type: 'set-maintenance'; readonly buildingId: string; readonly priority: 'normal' | 'high' | null }
  | { readonly type: 'set-maintenance-reserve'; readonly wood: number }
  | { readonly type: 'advance'; readonly days: AdvanceDays };

export function createSession(): Session {
  return { slots: { 1: null, 2: null, 3: null }, activeSlot: null, route: 'home', selectedResidentId: null, selectedCalendarDay: null, selectedPlotId: null, filters: { ...EMPTY_FILTERS }, chronicleFilters: { ...EMPTY_CHRONICLE_FILTERS } };
}

export function activeVillage(session: Session): VillageState | null {
  return session.activeSlot === null ? null : session.slots[session.activeSlot];
}

function assertSlot(slot: SlotId): void {
  if (!SLOT_IDS.includes(slot)) throw new RangeError('El espacio debe ser 1, 2 o 3.');
}

export function reduceSession(session: Session, action: SessionAction): Session {
  const world = activeVillage(session);
  const management = ['assign-work', 'move-resident', 'prepare-construction', 'change-construction', 'expand-village', 'set-maintenance', 'set-maintenance-reserve', 'set-economy-policy'];
  if (world?.pendingDecision?.type === 'story_event' && management.includes(action.type)) throw new Error('Resuelve el suceso pendiente antes de cambiar órdenes.');
  if (world && isGameOver(world) && action.type === 'resolve-story') throw new Error('Esta aldea ha terminado.');
  if (world?.pendingDecision?.type === 'bandit_attack' && management.includes(action.type)) throw new Error('El asalto está en curso. Resuelve la decisión en Defensa antes de cambiar órdenes.');
  if (world && isGameOver(world) && action.type === 'resolve-attack') throw new Error('Esta aldea ha terminado.');
  if (world && isGameOver(world) && ['advance', 'assign-work', 'move-resident', 'prepare-construction', 'change-construction', 'expand-village', 'set-maintenance', 'set-maintenance-reserve', 'set-economy-policy'].includes(action.type)) {
    if (action.type === 'advance') return session;
    throw new Error('Esta aldea ha terminado. Puedes consultar su historia o fundar otra en Tus aldeas.');
  }
  switch (action.type) {
    case 'create': {
      assertSlot(action.slot);
      if (session.slots[action.slot] && !action.confirmReplacement) {
        throw new Error('Confirma el reemplazo antes de crear otra aldea en este espacio.');
      }
      const village = generateVillage(action.seed);
      return { ...session, slots: { ...session.slots, [action.slot]: village }, activeSlot: action.slot,
        route: 'village', selectedResidentId: null, selectedCalendarDay: null, selectedPlotId: null, filters: { ...EMPTY_FILTERS }, chronicleFilters: { ...EMPTY_CHRONICLE_FILTERS } };
    }
    case 'continue': {
      assertSlot(action.slot);
      if (!session.slots[action.slot]) throw new Error('Este espacio todavía no tiene una aldea en esta sesión.');
      return { ...session, activeSlot: action.slot, route: session.slots[action.slot]?.pendingDecision?.type === 'bandit_attack' ? 'defense' : session.slots[action.slot]?.pendingDecision?.type === 'story_event' ? 'events' : 'village', selectedResidentId: null, selectedCalendarDay: null, selectedPlotId: null, filters: { ...EMPTY_FILTERS }, chronicleFilters: { ...EMPTY_CHRONICLE_FILTERS } };
    }
    case 'delete': {
      assertSlot(action.slot);
      if (!action.confirmed) throw new Error('Confirma el borrado de la aldea.');
      return { ...session, slots: { ...session.slots, [action.slot]: null },
        activeSlot: session.activeSlot === action.slot ? null : session.activeSlot,
        selectedResidentId: null, route: 'slots', filters: { ...EMPTY_FILTERS }, chronicleFilters: { ...EMPTY_CHRONICLE_FILTERS } };
    }
    case 'navigate': {
      const protectedRoute = action.route !== 'home' && action.route !== 'slots' && action.route !== 'help';
      if (protectedRoute && !activeVillage(session)) return { ...session, route: 'slots' };
      if (action.route === 'resident' && !session.selectedResidentId) return { ...session, route: 'residents' };
      return { ...session, route: action.route, selectedCalendarDay: action.route === 'calendar' ? session.selectedCalendarDay ?? activeVillage(session)!.elapsedDays : session.selectedCalendarDay };
    }
    case 'inspect': {
      const village = activeVillage(session);
      if (!village?.residents.some((person) => person.id === action.id)) throw new Error('No se encontró a esa persona en la aldea.');
      return { ...session, route: 'resident', selectedResidentId: action.id };
    }
    case 'filter': return { ...session, filters: { ...session.filters, ...action.filters } };
    case 'chronicle-filter': return { ...session, route: 'chronicle', chronicleFilters: { ...session.chronicleFilters, page: 0, ...action.filters } };
    case 'person-history': {
      if (!world?.residents.some((person) => person.id === action.residentId)) throw new Error('Habitante no encontrado.');
      return { ...session, route: 'chronicle', chronicleFilters: { ...EMPTY_CHRONICLE_FILTERS, residentId: action.residentId, kind: 'all' } };
    }
    case 'inspect-plot': {
      const village = activeVillage(session);
      if (!village?.constructionSlots.some((plot) => plot.id === action.id)) throw new Error('No se encontró ese solar.');
      return { ...session, route: 'buildings', selectedPlotId: action.id };
    }
    case 'move-resident': {
      const village = activeVillage(session);
      if (!village || session.activeSlot === null) throw new Error('Primero abre una aldea.');
      const next = moveResident(village, action.residentId, action.houseId);
      return next === village ? session : { ...session, slots: { ...session.slots, [session.activeSlot]: next } };
    }
    case 'expand-village':
    case 'resolve-attack':
    case 'resolve-story':
    case 'assign-work':
    case 'set-economy-policy':
    case 'set-maintenance':
    case 'set-maintenance-reserve':
    case 'prepare-construction':
    case 'change-construction': {
      const village = activeVillage(session);
      if (!village || session.activeSlot === null) throw new Error('Primero abre una aldea.');
      let next: VillageState;
      if (action.type === 'resolve-story') next = resolveStory(village, action.eventId, action.choice);
      else if (action.type === 'resolve-attack') next = resolveBanditAttack(village, action.threatId, action.tactic);
      else if (action.type === 'prepare-construction') next = prepareConstruction(village, action.slotId, action.buildingType);
      else if (action.type === 'change-construction') next = changeConstruction(village, action.projectId, action.action);
      else if (action.type === 'expand-village') next = expandVillage(village);
      else if (action.type === 'assign-work') next = assignWork(village, action.residentId, action.profession, action.workplaceId);
      else if (action.type === 'set-economy-policy') next = configureEconomy(village, action.policy);
      else if (action.type === 'set-maintenance') next = configureMaintenance(village, action.buildingId, action.priority);
      else next = configureMaintenance(village, null, null, action.wood);
      return next === village ? session : { ...session, slots: { ...session.slots, [session.activeSlot]: next }, route: isGameOver(next) ? 'survival' : session.route };
    }
    case 'calendar-month':
    case 'calendar-day':
    case 'calendar-today': {
      const village = activeVillage(session);
      if (!village) throw new Error('Primero abre una aldea para consultar el calendario.');
      const currentDay = session.selectedCalendarDay ?? village.elapsedDays;
      let selectedDay = village.elapsedDays;
      if (action.type === 'calendar-month') {
        if (action.delta !== -1 && action.delta !== 1) throw new Error('Cambio de mes no válido.');
        selectedDay = currentDay + action.delta * DAYS_PER_MONTH;
      } else if (action.type === 'calendar-day') {
        selectedDay = action.elapsedDay;
        if (Math.floor(selectedDay / DAYS_PER_MONTH) !== Math.floor(currentDay / DAYS_PER_MONTH)) throw new Error('Elige un día del mes que estás consultando.');
      }
      const date = getCalendarDate(selectedDay);
      getCalendarDate(selectedDay - date.dayOfMonth + DAYS_PER_MONTH);
      return { ...session, route: 'calendar', selectedCalendarDay: selectedDay };
    }
    case 'advance': {
      const village = activeVillage(session);
      if (!village || session.activeSlot === null) throw new Error('Primero crea o abre una aldea.');
      const result = advanceVillageDays(village, action.days);
      const followToday = session.selectedCalendarDay === village.elapsedDays;
      const defenseNotice = result.events.some((entry) => entry.type === 'bandit_warning' || entry.type === 'bandit_attack');
      return { ...session, slots: { ...session.slots, [session.activeSlot]: result.state }, route: isGameOver(result.state) ? 'survival' : result.state.pendingDecision?.type === 'story_event' ? 'events' : defenseNotice || result.state.pendingDecision?.type === 'bandit_attack' ? 'defense' : result.events.some((entry) => entry.type === 'talent_discovered') ? 'events' : session.route,
        selectedCalendarDay: followToday ? result.state.elapsedDays : session.selectedCalendarDay };
    }
  }
}
