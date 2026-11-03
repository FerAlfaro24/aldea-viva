import { getCalendarDate } from './calendar';
import { randomInt } from './rng';
import type { ChronicleEntry } from '../models/simulation';
import type { MedicalState, SurvivalCause, WinterPlan, WinterSeverity } from '../models/survival';
import type { Building, VillageState } from '../models/village';
import { SURVIVAL_RULES as R } from '../rules/survival';
import { resourceAmount, resourceUnits, roundResource as round } from '../rules/resources';
import { fragility, isGameOver, isStanding, shelterProtection } from '../selectors/survival';
import { markUnavailableWork } from '../selectors/work';

function prepareWinter(village: VillageState): VillageState {
  const date = getCalendarDate(village.elapsedDays);
  if (date.season !== 'autumn' && date.season !== 'winter') return village;
  let rng = village.rng;
  let plan = village.survival?.winters.find((winter) => winter.year === date.year);
  const events: ChronicleEntry[] = [];
  if (!plan) {
    const weather = randomInt(rng, 0, 99); rng = weather.rng;
    const severity: WinterSeverity = weather.value < 20 ? 'mild' : weather.value < 80 ? 'normal' : 'harsh';
    const signal = randomInt(rng, 0, 99); rng = signal.rng;
    const forecast = signal.value < 70 ? severity : signal.value < 90 ? 'uncertain'
      : severity === 'mild' ? 'harsh' : severity === 'harsh' ? 'mild' : signal.value < 95 ? 'mild' : 'harsh';
    plan = { year: date.year, severity, forecast, outlookIssuedAt: date.season === 'autumn' ? village.elapsedDays : null, revealedAt: null };
    if (plan.outlookIssuedAt !== null) events.push({ id: `winter-outlook:${date.year}`, type: 'winter_outlook', elapsedDay: village.elapsedDays, year: date.year, forecast });
  }
  if (date.season === 'winter' && plan.revealedAt === null) {
    plan = { ...plan, revealedAt: village.elapsedDays };
    events.push({ id: `winter-start:${date.year}`, type: 'winter_started', elapsedDay: village.elapsedDays, year: date.year, severity: plan.severity });
  }
  const winters: readonly WinterPlan[] = [...(village.survival?.winters ?? []).filter((winter) => winter.year !== date.year), plan];
  return { ...village, rng, survival: { ...village.survival, winters }, chronicle: [...village.chronicle, ...events] };
}

function collapse(village: VillageState, building: Building): VillageState {
  const displacedResidentIds = village.housingAssignments.filter((assignment) => assignment.houseId === building.id).map((assignment) => assignment.residentId);
  const buildings = village.buildings.map((candidate) => candidate.id === building.id ? { ...candidate, condition: 0, collapsedAt: village.elapsedDays } : candidate);
  const capacity = resourceUnits(buildings.reduce((sum, candidate) => sum + (isStanding(candidate) && candidate.type === 'warehouse' ? candidate.storageCapacity : 0), 0));
  const projects = village.constructionProjects ?? [];
  const reserved = projects.reduce((sum, project) => sum + (project.materialsConsumed ? 0 : resourceUnits(project.reservedWood)), 0);
  const keepReserved = Math.min(reserved, capacity);
  const keepFood = Math.min(resourceUnits(village.inventory.food), capacity - keepReserved);
  const keepWood = keepReserved + Math.min(resourceUnits(village.inventory.wood) - reserved, capacity - keepReserved - keepFood);
  let remainingReservation = reserved;
  const cancelledProjectIds: string[] = [];
  for (const project of [...projects].reverse()) {
    if (remainingReservation <= keepWood) break;
    if (project.materialsConsumed) continue;
    cancelledProjectIds.push(project.id); remainingReservation -= resourceUnits(project.reservedWood);
  }
  const lostFood = round(village.inventory.food - resourceAmount(keepFood));
  const lostWood = round(village.inventory.wood - resourceAmount(keepWood));
  return { ...village, buildings, inventory: { food: resourceAmount(keepFood), wood: resourceAmount(keepWood) },
    constructionSlots: village.constructionSlots.map((slot) => slot.id === building.slotId ? { ...slot, buildingId: null } : slot),
    housingAssignments: village.housingAssignments.map((assignment) => assignment.houseId === building.id ? { ...assignment, houseId: null } : assignment),
    constructionProjects: projects.filter((project) => !cancelledProjectIds.includes(project.id)),
    ...(village.maintenance ? { maintenance: { ...village.maintenance, orders: village.maintenance.orders.filter((order) => order.buildingId !== building.id) } } : {}),
    chronicle: [...village.chronicle, { id: `collapse:${building.id}:${village.elapsedDays}`, type: 'building_collapsed', elapsedDay: village.elapsedDays,
      buildingId: building.id, lostFood, lostWood, displacedResidentIds, cancelledProjectIds }] };
}

export function prepareSurvivalDay(village: VillageState): VillageState {
  let next = prepareWinter(village);
  const date = getCalendarDate(next.elapsedDays);
  const severity = next.survival?.winters.find((winter) => winter.year === date.year)?.severity ?? 'normal';
  const wear = R.dailyWear * (date.season === 'winter' ? R.winterWear[severity] : 1);
  for (const building of next.buildings) {
    if (!isStanding(building)) continue;
    const condition = round(Math.max(0, building.condition - wear));
    const zeroConditionDays = condition === 0 ? (building.zeroConditionDays ?? 0) + 1 : 0;
    const level = condition <= 10 ? 4 : condition <= R.unusableCondition ? 3 : condition <= 40 ? 2 : condition <= 70 ? 1 : 0;
    next = { ...next, buildings: next.buildings.map((candidate) => candidate.id === building.id ? { ...candidate, condition, zeroConditionDays, warningLevel: level } : candidate) };
    if (level > 0 && level !== (building.warningLevel ?? 0)) next = { ...next, chronicle: [...next.chronicle,
      { id: `building-warning:${building.id}:${next.elapsedDays}`, elapsedDay: next.elapsedDays, type: 'building_warning', buildingId: building.id, level, condition }] };
    if (zeroConditionDays >= R.collapseAfterZeroDays) next = collapse(next, building);
  }
  return markUnavailableWork(next);
}

export function finishSurvivalDay(village: VillageState): VillageState {
  const date = getCalendarDate(village.elapsedDays);
  const winter = village.survival?.winters.find((plan) => plan.year === date.year);
  const baseCold = date.season === 'winter' ? R.coldDamage[winter?.severity ?? 'normal'] : 0;
  let rng = village.rng;
  const events: ChronicleEntry[] = [];
  const residents = [...village.residents].sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0).map((person) => {
    if (!person.alive) return person;
    const ration = village.economy?.lastDay?.allocations.find((allocation) => allocation.residentId === person.id);
    const coverage = ration && ration.need > 0 ? ration.served / ration.need : 0;
    const hunger = round(Math.max(0, Math.min(100, person.condition.hunger + (coverage >= 0.995
      ? -R.hungerRecovery - Math.max(0, coverage - 1) * 4 : (1 - coverage) * R.hungerGain))));
    const hungerDamage = Math.max(0, hunger - R.hungerDamageFrom) / (100 - R.hungerDamageFrom) * R.maximumHungerDamage;
    const coldDamage = baseCold * (1 - shelterProtection(village, person.id)) * fragility(person, village.elapsedDays);
    const cause: SurvivalCause = hungerDamage > 0 && coldDamage > 0.05 ? 'combined' : hungerDamage > 0 ? 'hunger' : 'cold';
    let medical: MedicalState = { ...person.medical };
    const stabilized = (medical.stabilizedUntil ?? 0) > village.elapsedDays;
    const recovery = coverage >= 0.995 && hunger < 40 ? R.healthRecovery + Math.max(0, coverage - 1) * R.abundantRecoveryBonus : 0;
    let health = round(Math.max(0, Math.min(100, person.condition.health + recovery - (stabilized ? 0 : hungerDamage + coldDamage))));
    const episode = (action: 'illness' | 'rescue' | 'recovered', untilElapsedDay: number) => {
      events.push({ id: `medical:${person.id}:${action}:${village.elapsedDays}`, type: 'medical_episode', elapsedDay: village.elapsedDays, residentId: person.id, action, cause: action === 'recovered' ? medical.episodes?.at(-1)?.cause ?? cause : cause, untilElapsedDay });
      if (action !== 'recovered') medical = { ...medical, episodes: [...(medical.episodes ?? []), { type: action, elapsedDay: village.elapsedDays, untilElapsedDay, cause }] };
    };
    if (health <= 0 && hunger < 60 && !(medical.episodes ?? []).some((entry) => entry.type === 'rescue')) {
      const chance = randomInt(rng, 0, 999); rng = chance.rng;
      if (chance.value < R.rescueChancePerThousand) {
        const duration = randomInt(rng, 120, 672); rng = duration.rng;
        medical = { ...medical, illnessActive: true, incapacityUntil: village.elapsedDays + duration.value,
          permanentCapacity: chance.value < 15 ? 0.5 : 0.75, stabilizedUntil: village.elapsedDays + R.rescueStabilizedDays };
        health = 1; episode('rescue', medical.incapacityUntil!);
      }
    }
    if (health <= 0) {
      events.push({ id: `death:${person.id}`, elapsedDay: village.elapsedDays, type: 'resident_died', residentId: person.id, cause });
      return { ...person, alive: false, profession: null, workplaceId: null, condition: { health: 0, hunger },
        medical: { ...medical, death: { elapsedDay: village.elapsedDays, cause, lastProfession: person.profession } } };
    }
    if (health < 60 && (hunger >= 50 || coldDamage > 0.1) && !medical.illnessActive) {
      const duration = randomInt(rng, 7, 28); rng = duration.rng;
      medical = { ...medical, illnessActive: true, incapacityUntil: village.elapsedDays + duration.value };
      episode('illness', medical.incapacityUntil!);
    } else if (medical.illnessActive && (medical.incapacityUntil ?? 0) <= village.elapsedDays) {
      if (health >= 60 && hunger < 30) { medical = { ...medical, illnessActive: false }; episode('recovered', village.elapsedDays); }
      else medical = { ...medical, incapacityUntil: village.elapsedDays + 7 };
    }
    const warning = health <= 25 || hunger >= 80 ? 'critical' : health <= 60 || hunger >= 50 ? 'weak' : hunger >= 25 ? 'hungry' : 'well';
    if (warning !== (medical.warning ?? 'well')) events.push({ id: `health:${person.id}:${village.elapsedDays}`, elapsedDay: village.elapsedDays,
      type: 'health_warning', residentId: person.id, warning, health, hunger });
    medical = { ...medical, warning };
    return { ...person, condition: { health, hunger }, medical };
  });
  const people = new Map(residents.map((person) => [person.id, person]));
  // Mantener el orden original de habitantes, relaciones e identidades.
  return finishCasualties({ ...village, rng, residents: village.residents.map((person) => people.get(person.id)!), chronicle: [...village.chronicle, ...events] });
}

// Compartido por supervivencia y combate: una sola limpieza y regla de final.
export function finishCasualties(village: VillageState): VillageState {
  const living = new Set(village.residents.filter((person) => person.alive).map((person) => person.id));
  const hasDeaths = living.size !== village.residents.length;
  let next: VillageState = { ...village,
    ...(hasDeaths || village.workAssignments ? { workAssignments: (village.workAssignments ?? []).filter((order) => living.has(order.residentId)) } : {}),
    housingAssignments: hasDeaths ? village.housingAssignments.map((assignment) => !living.has(assignment.residentId) && assignment.houseId !== null ? { ...assignment, houseId: null } : assignment) : village.housingAssignments };
  if (isGameOver(next) && next.survival?.endedAt === undefined) next = { ...next, survival: { winters: next.survival?.winters ?? [], endedAt: next.elapsedDays },
    ...(next.defense ? { defense: { nextCheckDay: next.defense.nextCheckDay } } : {}),
    pendingDecision: null,
    chronicle: [...next.chronicle, { id: 'village-ended', type: 'village_ended', elapsedDay: next.elapsedDays, populationLost: next.residents.length }] };
  return next;
}
