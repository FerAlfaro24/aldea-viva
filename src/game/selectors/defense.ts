import type { DefenseTactic } from '../models/defense';
import { TACTICS } from '../models/defense';
import type { Resident, VillageState } from '../models/village';
import { DEFENSE_RULES as R } from '../rules/defense';
import { selectStorage } from './storage';
import { isBuildingUsable, isFitForWork, physicalCapacity } from './survival';
import { roundResource } from '../rules/resources';

export function selectGuards(village: VillageState): readonly Resident[] {
  const ids = new Set((village.workAssignments ?? []).filter((order) => order.profession === 'warrior' && order.authorized && order.status === 'active').map((order) => order.residentId));
  return village.residents.filter((person) => ids.has(person.id) && isFitForWork(person, village.elapsedDays)).sort((a, b) => a.id.localeCompare(b.id, 'en'));
}
export function guardPower(person: Resident, tactic: DefenseTactic): number {
  const attributes = (person.attributes.strength + person.attributes.agility + person.attributes.endurance) / 3;
  const post = person.workplaceId === 'work:guard-forest' ? (tactic === 'sortie' ? 1.2 : 0.85) : (tactic === 'protect-storage' ? 1.2 : 1);
  return (10 + person.skills.warrior.effective * 0.6 + attributes * 0.4) * physicalCapacity(person) * post;
}
export function detectionChance(village: VillageState): number {
  return Math.min(90, R.baseDetectionChance + selectGuards(village).filter((guard) => guard.workplaceId === 'work:guard-forest').length * R.forestDetectionBonus);
}
export function selectDefenseOptions(village: VillageState) {
  const threat = village.defense?.threat;
  if (!threat) return [];
  const guards = selectGuards(village);
  return TACTICS.map((tactic) => {
    const rule = R.tactics[tactic];
    const power = (10 + village.residents.filter((person) => person.alive).length * 0.7 + guards.reduce((sum, person) => sum + guardPower(person, tactic), 0)) * rule.power;
    const successPercent = tactic === 'negotiate' ? Math.min(90, 65 + Math.round(power / (power + threat.strength) * 20))
      : Math.max(5, Math.min(95, Math.round(power / (power + threat.strength) * 100)));
    const foodCost = tactic === 'negotiate' ? Math.max(threat.demandFood, roundResource(village.inventory.food * R.negotiationReserveShare)) : 0;
    const woodCost = tactic === 'negotiate' ? Math.max(threat.demandWood, roundResource(selectStorage(village).availableWood * R.negotiationReserveShare)) : 0;
    const theftRange = village.elapsedDays < 336 ? R.firstYearTheftPercent : R.laterTheftPercent;
    const foodAfterPayment = Math.max(0, village.inventory.food - foodCost);
    const foodAfterDefeat = {
      minimum: roundResource(foodAfterPayment * (1 - theftRange[1] / 100 * rule.theft)),
      maximum: roundResource(foodAfterPayment * (1 - theftRange[0] / 100 * rule.theft)),
    };
    const unavailable = tactic === 'sortie' && !guards.length ? 'Necesitas al menos un guerrero apto.'
      : tactic === 'protect-storage' && !village.buildings.some((building) => building.type === 'warehouse' && isBuildingUsable(building)) ? 'No hay un almacén utilizable.'
      : foodCost > village.inventory.food || woodCost > selectStorage(village).availableWood ? 'Faltan recursos libres para ofrecer el tributo.' : '';
    const p = successPercent / 100;
    return { tactic, successPercent, foodCost, woodCost, foodAfterDefeat, unavailable, guardIds: guards.map((person) => person.id),
      injuryPercent: p * rule.injuryWin + (1 - p) * rule.injuryLoss,
      deathPercent: (p * rule.injuryWin * rule.deathWin + (1 - p) * rule.injuryLoss * rule.deathLoss) / 100,
      civilianRisk: tactic !== 'sortie',
    };
  });
}
