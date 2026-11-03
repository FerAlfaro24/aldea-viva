import type { VillageState } from '../models/village';
import type { ChronicleEntry } from '../models/simulation';
import { DEFENSE_RULES as R } from '../rules/defense';
import { detectionChance } from '../selectors/defense';
import { isGameOver } from '../selectors/survival';
import { randomInt } from './rng';

// Se ejecuta después del día completo: nunca vuelve a producir/comer al decidir.
export function processDefenseDay(village: VillageState): VillageState {
  if (isGameOver(village) || village.pendingDecision) return village;
  const defense = village.defense ?? { nextCheckDay: village.elapsedDays + R.firstCheckDay };
  const arrive = (state: VillageState): VillageState => {
    const threat = state.defense?.threat;
    if (!threat || threat.arrivalDay > state.elapsedDays) return state;
    const event: ChronicleEntry = { id: `attack:${threat.id}`, type: 'bandit_attack', elapsedDay: state.elapsedDays,
      threatId: threat.id, attackers: threat.attackers, surprise: !threat.warned };
    return { ...state, pendingDecision: { id: threat.id, type: 'bandit_attack', sinceElapsedDay: state.elapsedDays }, chronicle: [...state.chronicle, event] };
  };
  if (defense.threat) return arrive(village);
  if (defense.nextCheckDay > village.elapsedDays) return village.defense ? village : { ...village, defense };
  let rng = village.rng;
  const draw = (min: number, max: number) => { const result = randomInt(rng, min, max); rng = result.rng; return result.value; };
  const occurs = draw(0, 99) < R.attackChance;
  const nextCheckDay = village.elapsedDays + draw(R.interval[0], R.interval[1]);
  if (!occurs) return { ...village, rng, defense: { nextCheckDay } };
  const attackers = draw(2 + village.grade, 4 + village.grade * 2);
  const warned = draw(0, 99) < detectionChance(village);
  const threat = { id: `bandits:${village.elapsedDays}`, detectedAt: village.elapsedDays,
    arrivalDay: village.elapsedDays + (warned ? draw(2, 4) : 0), warned, attackers,
    strength: attackers * draw(16, 24), demandFood: attackers * 4, demandWood: attackers * 2 };
  const events: ChronicleEntry[] = warned ? [{ id: `warning:${threat.id}`, type: 'bandit_warning', elapsedDay: village.elapsedDays,
    threatId: threat.id, arrivalDay: threat.arrivalDay, attackers }] : [];
  return arrive({ ...village, rng, defense: { nextCheckDay, threat }, chronicle: [...village.chronicle, ...events] });
}
