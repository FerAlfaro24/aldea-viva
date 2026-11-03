import { getCalendarDate } from '../core/calendar';
import type { VillageState } from '../models/village';
import { isGameOver } from '../selectors/survival';

function invariant(value: unknown, message: string): asserts value {
  if (!value) throw new Error(`Supervivencia no válida: ${message}`);
}
export function validateSurvival(village: VillageState): void {
  const beforeNow = (day: number) => Number.isSafeInteger(day) && day >= 0 && day <= village.elapsedDays;
  for (const person of village.residents) {
    const medical = person.medical;
    if (!medical) continue;
    if (medical.permanentCapacity !== undefined) invariant(Number.isFinite(medical.permanentCapacity) && medical.permanentCapacity >= 0 && medical.permanentCapacity <= 1, 'capacidad permanente fuera de escala');
    for (const day of [medical.incapacityUntil, medical.stabilizedUntil]) if (day !== undefined) invariant(Number.isSafeInteger(day) && day >= 0, 'plazo médico inválido');
    for (const episode of medical.episodes ?? []) invariant(beforeNow(episode.elapsedDay) && Number.isSafeInteger(episode.untilElapsedDay) && episode.untilElapsedDay >= episode.elapsedDay, 'episodio médico sin fecha válida');
    if (medical.death) invariant(!person.alive && person.condition.health === 0 && person.profession === null && beforeNow(medical.death.elapsedDay), 'muerte incoherente');
  }
  for (const building of village.buildings) {
    if (building.zeroConditionDays !== undefined) invariant(Number.isSafeInteger(building.zeroConditionDays) && building.zeroConditionDays >= 0, 'abandono inválido');
    if (building.collapsedAt !== undefined) invariant(beforeNow(building.collapsedAt) && building.condition === 0
      && !village.constructionSlots.some((slot) => slot.buildingId === building.id), 'derrumbe incoherente');
  }
  const winters = village.survival?.winters ?? [];
  invariant(new Set(winters.map((winter) => winter.year)).size === winters.length, 'invierno duplicado');
  for (const winter of winters) {
    invariant(Number.isSafeInteger(winter.year) && winter.year > 0 && winter.year <= getCalendarDate(village.elapsedDays).year, 'año de invierno inválido');
    if (winter.outlookIssuedAt !== null) invariant(beforeNow(winter.outlookIssuedAt) && getCalendarDate(winter.outlookIssuedAt).year === winter.year
      && getCalendarDate(winter.outlookIssuedAt).season === 'autumn', 'indicio fuera de otoño');
    if (winter.revealedAt !== null) invariant(beforeNow(winter.revealedAt) && getCalendarDate(winter.revealedAt).year === winter.year
      && getCalendarDate(winter.revealedAt).season === 'winter', 'invierno revelado fuera de estación');
  }
  if (village.survival?.endedAt !== undefined) invariant(isGameOver(village) && village.survival.endedAt === village.elapsedDays, 'final de partida incoherente');
}
