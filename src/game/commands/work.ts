import { getAge, getEligibleProfessions } from '../core/calendar';
import type { Profession } from '../models/simulation';
import type { VillageState, WorkAssignment } from '../models/village';
import { selectWorkAssignment, selectWorkOccupancy, selectWorksites } from '../selectors/work';
import { validateVillageState } from '../validation/village';

export function assignWork(village: VillageState, residentId: string, profession: Profession | null, workplaceId: string | null): VillageState {
  validateVillageState(village);
  const person = village.residents.find((resident) => resident.id === residentId);
  if (!person?.alive) throw new Error('Elige un habitante vivo de esta aldea.');
  let order: WorkAssignment | null = null;
  if (profession === null) {
    if (workplaceId !== null) throw new Error('Sin oficio no puede haber un destino de trabajo.');
  } else {
    if (!getEligibleProfessions(getAge(person, village.elapsedDays)).includes(profession)) throw new Error('Todavía no tiene edad para este oficio.');
    const site = selectWorksites(village, profession).find((candidate) => candidate.id === workplaceId);
    if (!site) throw new Error('El destino no existe o no está autorizado para este oficio.');
    if (site.capacity !== null && selectWorkOccupancy(village, site.id, residentId) >= site.capacity) throw new Error('No quedan plazas en este destino.');
    order = { residentId, profession, workplaceId: site.id, source: 'player', manualLock: !site.flexible, authorized: true, status: 'active' };
  }
  const current = selectWorkAssignment(village, residentId);
  if (person.profession === profession && person.workplaceId === workplaceId
    && (order === null ? current === null : current?.status === 'active' && current.authorized && current.source === 'player' && current.manualLock === order.manualLock)) return village;
  const next: VillageState = {
    ...village,
    residents: village.residents.map((resident) => resident.id === residentId ? { ...resident, profession, workplaceId } : resident),
    workAssignments: [...(village.workAssignments ?? []).filter((assignment) => assignment.residentId !== residentId), ...(order ? [order] : [])],
    chronicle: [...village.chronicle, { id: `job:${residentId}:${village.elapsedDays}:${village.chronicle.length}`, type: 'job_changed',
      elapsedDay: village.elapsedDays, residentId, profession, workplaceId, manualLock: order?.manualLock ?? false }],
  };
  validateVillageState(next);
  return next;
}
