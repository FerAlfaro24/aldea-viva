import type { VillageState } from '../game/models/village';
import { selectEconomyForecast, selectEconomyPolicy } from '../game/selectors/economy';
import { selectStorage } from '../game/selectors/storage';
import { dateLabel, html, quantityLabel, RATION_NAMES, FOOD_PRIORITY_NAMES } from './format';

const q = quantityLabel;
const option = (value: string, label: string, selected: string) => `<option value="${value}"${value === selected ? ' selected' : ''}>${html(label)}</option>`;

export function renderEconomy(village: VillageState): string {
  const policy = selectEconomyPolicy(village);
  const forecast = selectEconomyForecast(village);
  const storage = selectStorage(village);
  const report = village.economy?.lastDay;
  const reserve = forecast.daysWithoutHarvest;
  const days = reserve.minimum === null ? 'Sin demanda actual' : `${reserve.minimum}–${reserve.maximum} días`;
  const recent = village.chronicle.filter((entry) => entry.type === 'economy_day' && entry.elapsedDay > village.elapsedDays - 7);
  const missing = recent.reduce((sum, entry) => sum + (entry.type === 'economy_day' ? entry.foodMissing : 0), 0);
  return `<header class="page-heading"><div><p class="eyebrow">Cada reserva tiene una causa</p><h1 id="page-title" tabindex="-1">Economía y alimentos</h1></div><p>${html(dateLabel(village.elapsedDays))}</p></header>
    ${!forecast.production.farmers ? '<aside class="callout"><p><strong>No hay agricultores trabajando.</strong> La aldea depende de sus reservas.</p><button type="button" class="text-button" data-action="navigate" data-route="professions">Asignar oficios →</button></aside>' : ''}
    ${storage.free === 0 ? '<aside class="callout"><p><strong>Almacén lleno.</strong> Las entregas que no quepan se rechazan; consulta qué recurso entra primero o prepara espacio.</p></aside>' : ''}
    ${reserve.minimum !== null && reserve.minimum < 7 ? `<aside class="callout"><p><strong>Reserva alimentaria corta:</strong> ${days} sin nuevas cosechas con la ración actual. Prepara la próxima estación y revisa los huertos.</p></aside>` : ''}
    ${report && report.foodMissing > 0 ? `<aside class="callout" role="status"><p><strong>Reparto incompleto:</strong> faltaron ${q(report.foodMissing)} alimentos para la ración elegida en el último balance. Revisa las reservas, agricultores y prioridades.</p></aside>` : ''}
    <div class="stats-grid"><section class="stat"><span>Alimentos disponibles</span><strong>${q(village.inventory.food)}</strong><small>Reserva sin nuevas cosechas: ${days}. Estimación con la ración actual.</small></section>
      <section class="stat"><span>Madera disponible</span><strong>${q(storage.availableWood)}</strong><small>${q(storage.reservedWood)} reservada para obras; ${q(village.inventory.wood)} almacenada.</small></section>
      <section class="stat"><span>Demanda prevista mañana</span><strong class="range-value">${q(forecast.minimum)}–${q(forecast.maximum)}</strong><small>Variación individual acotada a ±5 %, antes de posibles faltantes.</small></section>
      <section class="stat"><span>Espacio compartido</span><strong>${q(storage.free)}</strong><small>Libre de ${storage.capacity}. Alimentos y madera ocupan el mismo almacén.</small></section></div>
    <div class="economy-layout"><section class="panel"><h2>Raciones y prioridades</h2><p class="small-note">Al comenzar: ración normal, reparto equilibrado y alimentos primero. Tus órdenes se conservan hasta que las cambies.</p>
      <form id="economy-policy-form" class="economy-policy-form"><div class="policy-fields">
        <div><label for="ration-select">Ración</label><select id="ration-select" name="ration">${Object.entries(RATION_NAMES).map(([value, label]) => option(value, label, policy.ration)).join('')}</select></div>
        <div><label for="food-priority-select">Preferencia de reparto</label><select id="food-priority-select" name="priority">${Object.entries(FOOD_PRIORITY_NAMES).map(([value, label]) => option(value, label, policy.priority)).join('')}</select></div>
        <div><label for="delivery-select">Primera entrega al almacén</label><select id="delivery-select" name="deliveryPriority">${option('food', 'Alimentos primero', policy.deliveryPriority)}${option('wood', 'Madera primero', policy.deliveryPriority)}</select></div></div>
        <fieldset class="priority-houses"><legend>Viviendas preferentes · Se aplica al elegir «Viviendas señaladas»</legend>${village.buildings.filter((building) => building.type === 'house').map((house) => `<label><input type="checkbox" name="houseId" value="${html(house.id)}"${policy.priorityHouseIds.includes(house.id) ? ' checked' : ''} />${html(house.displayName)}</label>`).join('')}</fieldset>
        <p class="small-note">En escasez, los grupos preferentes tienen doble peso; el resto sigue participando proporcionalmente. Elegir viviendas sin señalar ninguna equivale al reparto equilibrado.</p>
        <button type="submit" class="primary-button">Guardar política alimentaria</button></form>
      <p class="small-note">Abundante: 125 % · Normal: 100 % · Reducida: 80 % · Emergencia: 60 % de la necesidad normal. Comer menos de lo necesario acumula hambre y acaba dañando la salud; comer suficiente permite recuperarse.</p></section>
    <section class="panel"><h2>Producción prevista</h2><dl class="storage-figures"><div><dt>Agricultura · ${forecast.production.farmers} personas</dt><dd>${q(forecast.production.food)} alimentos</dd></div><div><dt>Tala · ${forecast.production.woodcutters} personas</dt><dd>${q(forecast.production.wood)} madera</dd></div></dl>
      <ul class="worksites">${forecast.production.orchards.map((orchard) => `<li><span>${html(village.buildings.find((building) => building.id === orchard.id)!.displayName)} · ${orchard.workers} trabajando</span><strong>${q(orchard.produced)}</strong></li>`).join('')}</ul>
      <p class="small-note">Estimación para mañana con los trabajadores actuales, antes del límite del almacén. Habilidades, condición, edad y estación influyen; los cambios de oficio y aprendizaje pueden alterar el resultado.</p>
      <p class="small-note">Primavera creciente, verano abundante, otoño decreciente e invierno casi sin cosechas. El bosque no se agota; la madera del almacén sí se gasta.</p>
      <p class="small-note">Orden diario: clima y conservación → obras y reparaciones → entregas → consumo → salud. El balance de alimentos empieza después de posibles pérdidas por derrumbes, registradas por separado. Solo se guarda lo que cabe.</p>
      ${recent.length ? `<p>Últimos ${recent.length} balances: <strong>${q(missing)} alimentos faltantes</strong> respecto a las raciones solicitadas.</p>` : '<p class="small-note">Avanza un día para obtener el primer balance real.</p>'}</section></div>
    ${report ? `<section class="panel economy-report"><div class="section-heading"><h2>Último balance diario</h2><span class="small-note">${html(dateLabel(report.elapsedDay))} · Ración ${html(RATION_NAMES[report.policy.ration].toLocaleLowerCase('es'))}</span></div>
      <div class="economy-balance"><div><h3>Alimentos</h3><p>${q(report.openingFood)} iniciales + ${q(report.foodStored)} almacenados − ${q(report.foodConsumed)} consumidos = <strong>${q(report.closingFood)} finales</strong></p><p class="small-note">Producidos: ${q(report.foodProduced)} · Rechazados: ${q(report.foodRejected)}</p></div>
      <div><h3>Madera</h3><p>${q(report.openingWood)} iniciales − ${q(report.workWoodSpent)} de obras/reparaciones + ${q(report.woodStored)} almacenados = <strong>${q(report.closingWood)} finales</strong></p><p class="small-note">Producida: ${q(report.woodProduced)} · Rechazada: ${q(report.woodRejected)}</p></div></div>
      ${report.foodRejected + report.woodRejected > 0 ? `<p class="callout">Sin espacio para ${q(report.foodRejected)} alimentos y ${q(report.woodRejected)} de madera. Se almacenó únicamente lo que cabía.</p>` : ''}
      <p>Solicitados: <strong>${q(report.foodRequested)}</strong> · Servidos y consumidos: <strong>${q(report.foodConsumed)}</strong> · Faltantes: <strong>${q(report.foodMissing)}</strong></p>
      <div class="economy-table-wrap" tabindex="0" role="region" aria-label="Reparto individual del último día"><table class="economy-table"><caption>Reparto por persona. La necesidad normal permite comparar las raciones reducidas.</caption><thead><tr><th scope="col">Habitante</th><th scope="col">Necesidad normal</th><th scope="col">Solicitado</th><th scope="col">Consumido</th><th scope="col">Faltante</th></tr></thead><tbody>${report.allocations.map((allocation) => `<tr><th scope="row"><button type="button" class="text-button" data-action="inspect" data-person="${html(allocation.residentId)}">${html(village.residents.find((person) => person.id === allocation.residentId)?.displayName ?? 'Habitante')}</button></th><td>${q(allocation.need)}</td><td>${q(allocation.requested)}</td><td>${q(allocation.served)}</td><td>${q(allocation.missing)}</td></tr>`).join('')}</tbody></table></div>
    </section>` : ''}`;
}
