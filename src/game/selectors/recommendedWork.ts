import { getAge, getEligibleProfessions } from '../core/calendar';
import type { Profession } from '../models/simulation';
import type { Resident, VillageState } from '../models/village';
import { selectEconomyForecast, selectProduction, selectEconomyPolicy } from './economy';
import { guardPower } from './defense';
import { isFitForWork, isGameOver, physicalCapacity } from './survival';
import { selectStorage } from './storage';
import { selectWorkOccupancy, selectWorksites } from './work';
import { selectWinterPlan } from './planning';

export interface WorkRecommendation {
  readonly residentId: string;
  readonly profession: Profession;
  readonly workplaceId: string;
}

// Propuesta puntual: usa capacidades actuales públicas y deja intactas todas
// las órdenes existentes, incluso las exclusivas o pendientes de reparación.
export function selectRecommendedWork(village: VillageState) {
  let projected = village;
  const assignments: WorkRecommendation[] = [];
  const canApply = !isGameOver(village) && !village.pendingDecision;
  const available = (profession: Profession) => projected.residents.filter((person) =>
    person.profession === null && !(projected.workAssignments ?? []).some((order) => order.residentId === person.id)
    && isFitForWork(person, projected.elapsedDays)
    && getEligibleProfessions(getAge(person, projected.elapsedDays)).includes(profession));
  const count = (profession: Profession) => (projected.workAssignments ?? []).filter((order) =>
    order.profession === profession && order.authorized && order.status === 'active'
    && projected.residents.some((person) => person.id === order.residentId && isFitForWork(person, projected.elapsedDays))).length;
  const projectAssignment = (residentId: string, profession: Profession, workplaceId: string): VillageState => ({
    ...projected,
    residents: projected.residents.map((person) => person.id === residentId ? { ...person, profession, workplaceId } : person),
    workAssignments: [...(projected.workAssignments ?? []), { residentId, profession, workplaceId,
      source: 'player', manualLock: profession !== 'builder', authorized: true, status: 'active' }],
  });

  const nominate = (profession: Profession, workplaceId: string) => {
    const score = (person: Resident): number => {
      if (profession === 'farmer' || profession === 'woodcutter') {
        const production = selectProduction(projectAssignment(person.id, profession, workplaceId), projected.elapsedDays + 1);
        return profession === 'farmer' ? production.food : production.wood;
      }
      if (profession === 'warrior') return guardPower({ ...person, workplaceId }, 'defend');
      return (person.skills.builder.effective + (person.attributes.dexterity + person.attributes.endurance) / 2) * physicalCapacity(person);
    };
    const person = available(profession).map((person) => ({ person, score: score(person) }))
      .sort((a, b) => b.score - a.score || a.person.id.localeCompare(b.person.id, 'en'))[0]?.person;
    if (!person) return false;
    assignments.push({ residentId: person.id, profession, workplaceId });
    projected = projectAssignment(person.id, profession, workplaceId);
    return true;
  };

  if (canApply) {
    for (const site of selectWorksites(projected, 'farmer')) {
      while (site.capacity !== null && selectWorkOccupancy(projected, site.id) < site.capacity) {
        if (!nominate('farmer', site.id)) break;
      }
    }
    const forecast = selectEconomyForecast(projected);
    const winter = selectWinterPlan(projected);
    const needsBuilding = (projected.constructionProjects ?? []).some((project) => project.status !== 'paused')
      || forecast.production.food < forecast.maximum && !winter.inWinter && winter.daysToWinter > 14 || winter.capacityMissing > 0
      || (projected.maintenance?.orders.length ?? 0) > 0;
    while (needsBuilding && count('builder') < 2) if (!nominate('builder', 'work:builder-auto')) break;
    if (count('woodcutter') === 0 && selectStorage(projected).availableWood < winter.woodTarget - 20
      && (selectStorage(projected).free > 30 || selectEconomyPolicy(projected).deliveryPriority === 'wood')) nominate('woodcutter', 'work:forest');
    const foodCovered = selectEconomyForecast(projected).production.food >= selectEconomyForecast(projected).maximum;
    const guardTarget = projected.defense?.threat ? 4 : foodCovered ? 2 : 0;
    for (const site of selectWorksites(projected, 'warrior')) {
      while (count('warrior') < guardTarget && site.capacity !== null && selectWorkOccupancy(projected, site.id) < site.capacity) {
        if (!nominate('warrior', site.id)) break;
      }
    }
  }
  return { assignments, forecast: selectEconomyForecast(projected), canApply };
}
