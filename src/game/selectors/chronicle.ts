import { getCalendarDate } from '../core/calendar';
import type { ChronicleEntry, Season } from '../models/simulation';
import type { VillageState } from '../models/village';

export interface ChronicleFilters {
  readonly residentId: string;
  readonly familyId: string;
  readonly year: string;
  readonly season: '' | Season;
  readonly kind: 'important' | 'all' | 'economy';
  readonly page: number;
}
export const EMPTY_CHRONICLE_FILTERS: ChronicleFilters = { residentId: '', familyId: '', year: '', season: '', kind: 'important', page: 0 };
export function entryParticipants(entry: ChronicleEntry): readonly string[] {
  if ('residentId' in entry && entry.residentId) return [entry.residentId];
  if (entry.type === 'bandit_resolved') return [...new Set([...(entry.participantIds ?? []), ...entry.injuredIds, ...entry.deadIds])];
  if (entry.type === 'visitors_resolved') return entry.residentIds;
  if (entry.type === 'building_collapsed') return entry.displacedResidentIds;
  return [];
}
export function selectChronicle(village: VillageState, filters: ChronicleFilters = EMPTY_CHRONICLE_FILTERS) {
  const family = village.families.find((candidate) => candidate.id === filters.familyId);
  const familyIds = new Set(family?.memberIds ?? []);
  const matches = village.chronicle.filter((entry) => {
    if (filters.kind === 'important' && ['economy_day', 'building_repaired', 'work_insight'].includes(entry.type)) return false;
    if (filters.kind === 'economy' && !['economy_day', 'economy_policy_changed'].includes(entry.type)) return false;
    const date = getCalendarDate(entry.elapsedDay);
    if (filters.year && String(date.year) !== filters.year) return false;
    if (filters.season && date.season !== filters.season) return false;
    const participants = entryParticipants(entry);
    return (!filters.residentId || participants.includes(filters.residentId)) && (!filters.familyId || participants.some((id) => familyIds.has(id)));
  });
  const pages = Math.max(1, Math.ceil(matches.length / 25));
  const page = Math.max(0, Math.min(pages - 1, Math.trunc(filters.page) || 0));
  const end = matches.length - page * 25;
  return { entries: matches.slice(Math.max(0, end - 25), end).reverse(), total: matches.length, page, pages };
}
export function selectMemorial(village: VillageState) {
  return { days: village.elapsedDays, deaths: village.residents.filter((person) => !person.alive),
    built: village.chronicle.filter((entry) => entry.type === 'construction_changed' && entry.action === 'completed').length,
    raids: village.chronicle.filter((entry) => entry.type === 'bandit_resolved').length,
    arrivals: village.chronicle.filter((entry) => entry.type === 'visitors_resolved' && entry.accepted).length,
    talents: village.chronicle.filter((entry) => entry.type === 'talent_discovered').length };
}
