import { assignWork } from './work';
import { selectRecommendedWork } from '../selectors/recommendedWork';
import type { VillageState } from '../models/village';
import { selectWorkAdjustments } from '../selectors/workAdjustments';

export function applyRecommendedWork(village: VillageState): VillageState {
  const plan = selectRecommendedWork(village);
  if (!plan.canApply) throw new Error('Resuelve la decisión pendiente o abre una aldea en marcha antes de asignar oficios.');
  return plan.assignments.reduce((state, order) => assignWork(state, order.residentId, order.profession, order.workplaceId), village);
}

export function applyWorkAdjustments(village: VillageState): VillageState {
  if (village.pendingDecision || !village.residents.some((person) => person.alive)) throw new Error('Resuelve la decisión pendiente antes de ajustar oficios.');
  return selectWorkAdjustments(village).reduce((state, order) => assignWork(state, order.residentId, order.profession, order.workplaceId), village);
}
