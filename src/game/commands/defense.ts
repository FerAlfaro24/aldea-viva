import type { DefenseTactic } from '../models/defense';
import type { ChronicleEntry } from '../models/simulation';
import type { VillageState } from '../models/village';
import { DEFENSE_RULES as R } from '../rules/defense';
import { roundResource as round } from '../rules/resources';
import { selectDefenseOptions } from '../selectors/defense';
import { isGameOver, isStanding } from '../selectors/survival';
import { markUnavailableWork } from '../selectors/work';
import { validateVillageState } from '../validation/village';
import { randomInt } from '../core/rng';
import { finishCasualties } from '../core/survivalDay';

export function resolveBanditAttack(village: VillageState, threatId: string, tactic: DefenseTactic): VillageState {
  validateVillageState(village);
  const threat = village.defense?.threat;
  if (isGameOver(village) || !threat || threat.id !== threatId || village.pendingDecision?.id !== threat.id || village.pendingDecision.type !== 'bandit_attack') throw new Error('Este asalto ya no está pendiente.');
  const option = selectDefenseOptions(village).find((candidate) => candidate.tactic === tactic);
  if (!option || option.unavailable) throw new Error(option?.unavailable || 'Táctica no válida.');
  let rng = village.rng;
  const draw = (min: number, max: number) => { const result = randomInt(rng, min, max); rng = result.rng; return result.value; };
  const chance = (percent: number) => draw(0, 9999) < percent * 100;
  const success = chance(option.successPercent);
  const rule = R.tactics[tactic];
  const available = { food: round(village.inventory.food - option.foodCost), wood: round(village.inventory.wood - option.woodCost) };
  // Negociar entrega el tributo aunque los bandoleros incumplan su palabra.
  const theftRate = success ? (tactic === 'negotiate' ? 0 : draw(0, 5) / 100) : draw(15, 40) / 100 * rule.theft;
  const stolenFood = round(available.food * theftRate);
  const stolenWood = round(available.wood * theftRate);
  const inventory = { food: round(available.food - stolenFood), wood: round(available.wood - stolenWood) };
  let reserved = (village.constructionProjects ?? []).reduce((sum, project) => sum + (project.materialsConsumed ? 0 : project.reservedWood), 0);
  const cancelledProjectIds: string[] = [];
  for (const project of [...(village.constructionProjects ?? [])].reverse()) {
    if (reserved <= inventory.wood) break;
    if (!project.materialsConsumed) { cancelledProjectIds.push(project.id); reserved -= project.reservedWood; }
  }
  const events: ChronicleEntry[] = [];
  const injuredIds: string[] = [], deadIds: string[] = [];
  const exposed = new Set(option.guardIds);
  const civilians = village.residents.filter((person) => person.alive && !exposed.has(person.id)).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  // Una única persona civil queda expuesta en una incursión que atraviesa la defensa.
  const civilianId = !success && option.civilianRisk && civilians.length ? civilians[draw(0, civilians.length - 1)]!.id : null;
  const updated = new Map([...village.residents].sort((a, b) => a.id.localeCompare(b.id, 'en')).map((person) => {
    if (!person.alive || (!exposed.has(person.id) && person.id !== civilianId)) return [person.id, person] as const;
    const injuryChance = person.id === civilianId ? 60 : success ? rule.injuryWin : rule.injuryLoss;
    const deathChance = person.id === civilianId ? 10 : success ? rule.deathWin : rule.deathLoss;
    if (!chance(injuryChance)) return [person.id, person] as const;
    if (chance(deathChance)) {
      deadIds.push(person.id);
      events.push({ id: `death:${person.id}`, type: 'resident_died', elapsedDay: village.elapsedDays, residentId: person.id, cause: 'combat' });
      return [person.id, { ...person, alive: false, profession: null, workplaceId: null, condition: { ...person.condition, health: 0 },
        medical: { ...person.medical, death: { elapsedDay: village.elapsedDays, cause: 'combat' as const, lastProfession: person.profession } } }] as const;
    }
    injuredIds.push(person.id);
    const untilElapsedDay = Math.max(person.medical?.incapacityUntil ?? 0, village.elapsedDays + draw(7, 42));
    events.push({ id: `injury:${threat.id}:${person.id}`, type: 'medical_episode', action: 'injury', cause: 'combat', elapsedDay: village.elapsedDays, residentId: person.id, untilElapsedDay });
    return [person.id, { ...person, condition: { ...person.condition, health: round(Math.max(1, person.condition.health - draw(success ? 10 : 25, success ? 35 : 65))) },
      medical: { ...person.medical, illnessActive: true, incapacityUntil: untilElapsedDay,
        episodes: [...(person.medical?.episodes ?? []), { type: 'injury' as const, cause: 'combat' as const, elapsedDay: village.elapsedDays, untilElapsedDay }] } }] as const;
  }));
  // Aprendizaje de combate adicional, limitado por el mismo techo individual de oficio.
  for (const id of option.guardIds) {
    const person = updated.get(id)!;
    const skill = person.skills.warrior;
    const xp = success ? 80 : 40;
    const effective = round(Math.min(Math.max(skill.potentialSecret, skill.historicalBest), skill.effective + xp / 100));
    updated.set(id, { ...person, skills: { ...person.skills, warrior: { ...skill, effective, historicalBest: Math.max(skill.historicalBest, effective), experience: Math.min(1_000_000, skill.experience + xp) } } });
  }
  const targets = village.buildings.filter(isStanding).sort((a, b) => a.id.localeCompare(b.id, 'en'));
  const damageOccurs = !(tactic === 'negotiate' && success) && chance(success ? 20 : 75);
  const target = damageOccurs && targets.length ? targets[draw(0, targets.length - 1)]! : null;
  const buildingDamage = target ? round(Math.min(target.condition, draw(success ? 3 : 12, success ? 10 : 32))) : 0;
  const buildings = village.buildings.map((building) => {
    if (building.id !== target?.id || !buildingDamage) return building;
    const condition = round(building.condition - buildingDamage);
    const level = condition <= 10 ? 4 : condition <= 20 ? 3 : condition <= 40 ? 2 : condition <= 70 ? 1 : 0;
    if (level > (building.warningLevel ?? 0)) events.push({ id: `raid-building:${threat.id}:${building.id}`, type: 'building_warning', elapsedDay: village.elapsedDays, buildingId: building.id, level, condition });
    return { ...building, condition, warningLevel: level };
  });
  events.push({ id: `resolved:${threat.id}`, type: 'bandit_resolved', elapsedDay: village.elapsedDays, threatId: threat.id,
    tactic, success, successPercent: option.successPercent, paidFood: option.foodCost, paidWood: option.woodCost,
    stolenFood, stolenWood, injuredIds, deadIds, damagedBuildingId: target?.id ?? null, buildingDamage, cancelledProjectIds, participantIds: option.guardIds });
  const next = finishCasualties(markUnavailableWork({ ...village, rng, inventory, buildings,
    residents: village.residents.map((person) => updated.get(person.id)!), pendingDecision: null,
    defense: { nextCheckDay: village.defense!.nextCheckDay },
    constructionProjects: (village.constructionProjects ?? []).filter((project) => !cancelledProjectIds.includes(project.id)),
    chronicle: [...village.chronicle, ...events] }));
  validateVillageState(next);
  return next;
}
