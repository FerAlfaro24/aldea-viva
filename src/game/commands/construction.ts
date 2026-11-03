import type { Building, ConstructionProject, VillageState } from '../models/village';
import type { ChronicleEntry } from '../models/simulation';
import { CONSTRUCTION_CATALOG } from '../rules/construction';
import { selectStorage } from '../selectors/storage';
import { validateVillageState } from '../validation/village';
import { markUnavailableWork } from '../selectors/work';

function record(village: VillageState, project: ConstructionProject, action: Extract<ChronicleEntry, {type: 'construction_changed'}>['action']): VillageState {
  const next: VillageState = { ...village, chronicle: [...village.chronicle, {
    id: `construction:${project.id}:${village.chronicle.length}`, type: 'construction_changed', elapsedDay: village.elapsedDays,
    projectId: project.id, slotId: project.slotId, buildingType: project.buildingType, action, reservedWood: project.reservedWood,
    ...(project.materialsConsumed ? { materialsConsumed: true } : {}),
  }] };
  validateVillageState(next);
  return next;
}

export function prepareConstruction(village: VillageState, slotId: string, buildingType: Building['type']): VillageState {
  validateVillageState(village);
  if (buildingType !== 'house' && buildingType !== 'orchard' && buildingType !== 'warehouse') throw new Error('Tipo de edificio desconocido.');
  const slot = village.constructionSlots.find((candidate) => candidate.id === slotId);
  if (!slot || slot.buildingId !== null || (village.constructionProjects ?? []).some((project) => project.slotId === slotId)) throw new Error('Este solar no está libre.');
  const cost = CONSTRUCTION_CATALOG[buildingType].wood;
  if (selectStorage(village).availableWood < cost) throw new Error('No hay suficiente madera disponible. La reservada para otras obras no se puede reutilizar.');
  const project: ConstructionProject = { id: `project:${slotId}:${village.elapsedDays}:${village.chronicle.length}`, slotId, buildingType, reservedWood: cost, status: 'prepared', progress: 0 };
  return record({ ...village, constructionProjects: [...(village.constructionProjects ?? []), project] }, project, 'prepared');
}

export function changeConstruction(village: VillageState, projectId: string, action: 'pause' | 'resume' | 'cancel'): VillageState {
  validateVillageState(village);
  const projects = village.constructionProjects ?? [];
  const project = projects.find((candidate) => candidate.id === projectId);
  if (!project) throw new Error('No se encontró esta obra.');
  if (action !== 'pause' && action !== 'resume' && action !== 'cancel') throw new Error('Orden de obra desconocida.');
  const status: ConstructionProject['status'] = action === 'pause' ? 'paused' : project.materialsConsumed ? 'working' : 'prepared';
  if (action !== 'cancel' && project.status === status) return village;
  const nextProjects = action === 'cancel' ? projects.filter((candidate) => candidate.id !== projectId)
    : projects.map((candidate) => candidate.id === projectId ? { ...candidate, status } : candidate);
  return record(markUnavailableWork({ ...village, constructionProjects: nextProjects }), project, action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'cancelled');
}
