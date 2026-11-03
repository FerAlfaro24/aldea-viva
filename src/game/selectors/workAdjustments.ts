import type { Profession } from '../models/simulation';
import type { VillageState } from '../models/village';
import { isFitForWork, isGameOver } from './survival';
import { selectWinterPlan } from './planning';
import { selectStorage } from './storage';

export interface WorkAdjustment {
  readonly kind: 'conflict' | 'wood';
  readonly residentId: string;
  readonly profession: Profession | null;
  readonly workplaceId: string | null;
  readonly reason: string;
}

// Cambiar una orden previa exige revisar y aplicar este listado expresamente.
export function selectWorkAdjustments(village: VillageState): readonly WorkAdjustment[] {
  if (isGameOver(village) || village.pendingDecision) return [];
  const plan = selectWinterPlan(village), storage = selectStorage(village);
  return (village.workAssignments ?? []).flatMap((order): WorkAdjustment[] => {
    const person = village.residents.find((candidate) => candidate.id === order.residentId);
    if (!person || !isFitForWork(person, village.elapsedDays)) return [];
    if (order.status === 'conflict') return [{ kind: 'conflict', residentId: person.id, profession: order.profession === 'builder' ? 'builder' : null,
      workplaceId: order.profession === 'builder' ? 'work:builder-auto' : null,
      reason: order.profession === 'builder' ? 'Devolver al reparto flexible: su destino anterior ya no está disponible.' : 'Liberar su destino no disponible para poder elegir otro oficio.' }];
    if (order.profession === 'woodcutter' && (storage.availableWood >= plan.woodTarget + 20 || storage.free < 40 && storage.availableWood >= plan.woodTarget)) {
      return [{ kind: 'wood', residentId: person.id, profession: null, workplaceId: null,
        reason: 'Pausar la tala dejando a esta persona sin oficio. Ya hay madera de reserva; así evitas que siga ocupando espacio para comida.' }];
    }
    return [];
  });
}
