import type { VillageState } from '../models/village';

export function validateDefense(village: VillageState, dayInProgress = false): void {
  const check = (value: unknown, message: string): void => { if (!value) throw new Error(`Defensa no válida: ${message}`); };
  const defense = village.defense;
  if (defense) check(Number.isSafeInteger(defense.nextCheckDay) && defense.nextCheckDay >= 0, 'fecha de comprobación');
  const threat = defense?.threat;
  const pending = village.pendingDecision;
  const warnings = village.chronicle.filter((entry) => entry.type === 'bandit_warning');
  const attacks = village.chronicle.filter((entry) => entry.type === 'bandit_attack');
  const resolved = village.chronicle.filter((entry) => entry.type === 'bandit_resolved');
  const warningById = new Map(warnings.map((entry) => [entry.threatId, entry]));
  const attackById = new Map(attacks.map((entry) => [entry.threatId, entry]));
  const resultById = new Map(resolved.map((entry) => [entry.threatId, entry]));
  for (const entries of [warnings, attacks, resolved]) check(new Set(entries.map((entry) => entry.threatId)).size === entries.length, 'suceso de asalto duplicado');
  if (threat) {
    check(threat.detectedAt <= village.elapsedDays && threat.arrivalDay >= threat.detectedAt && Number.isSafeInteger(threat.arrivalDay), 'fechas de amenaza');
    check(Number.isSafeInteger(threat.attackers) && threat.attackers > 0 && threat.strength > 0 && Number.isFinite(threat.strength), 'fuerza de amenaza');
    check(Number.isSafeInteger(threat.demandFood) && threat.demandFood >= 0 && Number.isSafeInteger(threat.demandWood) && threat.demandWood >= 0, 'tributo');
    check(!resultById.has(threat.id), 'amenaza ya resuelta');
    const warning = warningById.get(threat.id);
    check(threat.warned === (warning?.arrivalDay === threat.arrivalDay && warning.attackers === threat.attackers), 'indicio incoherente');
    if (threat.arrivalDay <= village.elapsedDays && !(dayInProgress && threat.arrivalDay === village.elapsedDays && pending === null)) check(pending?.type === 'bandit_attack' && pending.id === threat.id && pending.sinceElapsedDay === threat.arrivalDay, 'decisión de asalto ausente');
    else if (threat.arrivalDay > village.elapsedDays) check(!pending && threat.warned, 'amenaza futura sin indicios');
  }
  if (pending?.type === 'bandit_attack') check(threat?.id === pending.id && attackById.get(pending.id)?.elapsedDay === pending.sinceElapsedDay, 'ataque pendiente sin amenaza');
  for (const attack of attacks) check(resultById.has(attack.threatId) || pending?.id === attack.threatId, 'ataque sin resolución ni decisión');
  for (const entry of resolved) {
    check(attackById.get(entry.threatId)?.elapsedDay === entry.elapsedDay, 'resolución sin ataque');
    const ids = [...entry.injuredIds, ...entry.deadIds];
    check(new Set(ids).size === ids.length && ids.every((id) => village.residents.some((person) => person.id === id)), 'participantes incoherentes');
    check(entry.deadIds.every((id) => village.residents.some((person) => person.id === id && person.medical?.death?.cause === 'combat' && person.medical.death.elapsedDay === entry.elapsedDay)), 'bajas incoherentes');
    check(entry.damagedBuildingId === null ? entry.buildingDamage === 0 : village.buildings.some((building) => building.id === entry.damagedBuildingId), 'edificio dañado inexistente');
  }
}
