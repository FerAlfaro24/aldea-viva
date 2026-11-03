import type { VillageState } from '../game/models/village';
import { selectWinterPlan } from '../game/selectors/planning';
import { isGameOver } from '../game/selectors/survival';
import { quantityLabel as q } from './format';

export function renderWinterPlan(village: VillageState): string {
  if (isGameOver(village)) return '';
  const plan = selectWinterPlan(village);
  if (plan.inWinter && plan.remainingDays === 0) return '<section class="winter-plan"><h3>La primavera llega con el próximo día</h3><p>Has atravesado los días de frío. Revisa salud y refugios antes de dar la bienvenida al nuevo año.</p></section>';
  return `<section class="winter-plan" aria-labelledby="winter-plan-title"><div class="section-heading"><h3 id="winter-plan-title">${plan.inWinter ? `${plan.remainingDays === 1 ? 'Queda' : 'Quedan'} ${plan.remainingDays} ${plan.remainingDays === 1 ? 'día' : 'días'} de invierno` : `Invierno dentro de ${plan.daysToWinter} días`}</h3><strong>${plan.ready ? 'Reserva objetivo cubierta' : `${plan.progress} % preparado`}</strong></div>
    <label>Comida guardada: ${q(village.inventory.food)} / ${q(plan.foodTarget)} de objetivo aproximado<meter min="0" max="${Math.max(1, plan.foodTarget)}" value="${Math.min(village.inventory.food, plan.foodTarget)}">${plan.progress} %</meter></label>
    <p class="small-note">${plan.foodMissing ? `Faltan unos ${q(plan.foodMissing)} alimentos. ` : 'Conserva la reserva y revisa posibles pérdidas. '}${plan.capacityMissing ? `Faltan ${q(plan.capacityMissing)} plazas de almacén para comida y madera.` : 'Hay capacidad para ese objetivo; puedes conservar los solares restantes.'}</p>
    <details><summary>Cómo estimamos este objetivo</summary><p class="small-note">Necesidad de la comunidad actual con ración normal o superior, cosecha invernal actual y un margen del 20 % sobre la demanda alta. ${plan.inWinter ? 'Solo cuenta los días que quedan.' : 'Cuenta los 84 días de invierno.'} Heridas, llegadas, frío, daños y asaltos pueden cambiar el resultado. La madera de reserva prevista es ${q(plan.woodTarget)}.</p></details></section>`;
}
