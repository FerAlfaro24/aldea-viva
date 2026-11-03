import type { Profession } from '../models/simulation';
import type { VillageState, WorkAssignment } from '../models/village';
import { GUARD_POSTS } from '../rules/work';
import { isBuildingUsable, isStanding } from './survival';

export interface Worksite {
  readonly id: string;
  readonly label: string;
  readonly capacity: number | null;
  readonly flexible: boolean;
}

export function selectWorksites(village: VillageState, profession: Profession): readonly Worksite[] {
  switch (profession) {
    case 'farmer': return village.buildings.filter((building) => building.type === 'orchard').filter(isBuildingUsable)
      .map((building) => ({ id: building.id, label: building.displayName, capacity: building.workerCapacity, flexible: false }));
    case 'woodcutter': return [{ id: 'work:forest', label: 'Bosque', capacity: null, flexible: false }];
    case 'warrior': return GUARD_POSTS.map((post) => ({ ...post, flexible: false }));
    case 'builder': return [
      { id: 'work:builder-auto', label: 'Flexible · Solo tareas autorizadas', capacity: null, flexible: true },
      ...(village.constructionProjects ?? []).map((project) => ({ id: project.id,
        label: `Obra en solar ${village.constructionSlots.findIndex((slot) => slot.id === project.slotId) + 1}${project.status === 'paused' ? ' · Pausada' : ''}`,
        capacity: null, flexible: false })),
      ...(village.maintenance?.orders ?? []).filter((order) => village.buildings.some((building) => building.id === order.buildingId && isStanding(building))).map((order) => ({ id: order.buildingId,
        label: `Mantenimiento · ${village.buildings.find((building) => building.id === order.buildingId)?.displayName ?? 'Edificio'}`,
        capacity: null, flexible: false })),
    ];
  }
}

export function selectWorkOccupancy(village: VillageState, workplaceId: string, excludingResidentId?: string): number {
  return (village.workAssignments ?? []).filter((order) => order.status === 'active'
    && order.workplaceId === workplaceId && order.residentId !== excludingResidentId).length;
}

export function selectWorkAssignment(village: VillageState, residentId: string): WorkAssignment | null {
  return (village.workAssignments ?? []).find((order) => order.residentId === residentId) ?? null;
}

export function selectWorkplaceLabel(village: VillageState, residentId: string): string {
  const order = selectWorkAssignment(village, residentId);
  if (!order) return 'Sin destino';
  if (order.status === 'conflict') return 'Destino terminado, inutilizable o sin autorización · Requiere tu decisión o reparación';
  return selectWorksites(village, order.profession).find((site) => site.id === order.workplaceId)?.label ?? 'Destino no disponible';
}

// Una orden exclusiva que pierde su destino queda pendiente; no cambia de oficio ni de tarea.
export function markUnavailableWork(village: VillageState): VillageState {
  if (!village.workAssignments) return village;
  let changed = false;
  const workAssignments = village.workAssignments.map((order): WorkAssignment => {
    const status = selectWorksites(village, order.profession).some((site) => site.id === order.workplaceId) ? 'active' : 'conflict';
    if (order.status === status) return order;
    changed = true;
    return { ...order, status };
  });
  return changed ? { ...village, workAssignments } : village;
}
