import type { VillageState } from '../game/models/village';
import { selectVillageSummary } from '../game/selectors/village';
import { html, quantityLabel as q } from './format';
import { CONSTRUCTION_CATALOG } from '../game/rules/construction';
import { selectStorage } from '../game/selectors/storage';
import { selectExpansion, EXPANSION_RULES } from '../game/commands/expansion';
import { selectMaintenance } from '../game/commands/maintenance';
import { selectWorkOccupancy } from '../game/selectors/work';
import { WORK_RULES } from '../game/rules/work';
import { isBuildingUsable, isStanding } from '../game/selectors/survival';

function renderExpansion(village: VillageState): string {
  const expansion = selectExpansion(village);
  if (expansion.completed) return '<section class="expansion-complete"><h2>Grado 2 alcanzado</h2><p>Ampliación guardada · Solares nuevos disponibles en el plano.</p></section>';
  return `<section class="panel expansion-panel" aria-label="Ampliación de la aldea"><h2>Ampliar al grado 2</h2><p>${EXPANSION_RULES.addedSlots} solares nuevos por ${EXPANSION_RULES.wood} de madera disponible. Los alimentos y las obras existentes se conservan.</p>
    <ul class="expansion-requirements">${expansion.requirements.map((entry) => `<li>${entry.met ? '✓' : '—'} ${html(entry.label)}: <strong>${entry.met ? 'cumplido' : 'pendiente'}</strong></li>`).join('')}</ul>
    <button type="button" class="primary-button" data-action="expand-village"${expansion.allowed ? '' : ' disabled'}>Ampliar por ${EXPANSION_RULES.wood} de madera</button></section>`;
}

function renderMaintenance(village: VillageState, buildingId: string): string {
  const order = selectMaintenance(village).orders.find((candidate) => candidate.buildingId === buildingId);
  const condition = village.buildings.find((building) => building.id === buildingId)!.condition;
  return `<h3>Mantenimiento</h3>${condition < 100 ? `<p class="small-note">Conservación reducida: ${condition} / 100. Necesita una orden y constructores para repararse.</p>` : '<p class="small-note">Conservación completa: no necesita reparación.</p>'}<form class="housing-form" id="maintenance-form"><input type="hidden" name="buildingId" value="${html(buildingId)}" />
    <label>Autorización y prioridad<select name="priority"><option value=""${!order ? ' selected' : ''}>Sin autorizar</option><option value="normal"${order?.priority === 'normal' ? ' selected' : ''}>Autorizado · Normal</option><option value="high"${order?.priority === 'high' ? ' selected' : ''}>Autorizado · Alta</option></select></label>
    <p class="small-note">Solo trabajan constructores que hayas nombrado. Prioridad alta, obras y prioridad normal, en ese orden para el reparto flexible. Un constructor exclusivo permanece en su tarea.</p><button type="submit">Guardar mantenimiento</button></form>`;
}

export function renderBuildings(village: VillageState, selectedPlotId: string | null): string {
  const selectedPlot = village.constructionSlots.find((plot) => plot.id === selectedPlotId) ?? village.constructionSlots[0];
  const selected = village.buildings.find((building) => building.id === selectedPlot?.buildingId);
  const projects = village.constructionProjects ?? [];
  const project = projects.find((candidate) => candidate.slotId === selectedPlot?.id);
  const storage = selectStorage(village);
  const freePlots = village.constructionSlots.filter((plot) => plot.buildingId === null && !projects.some((candidate) => candidate.slotId === plot.id)).length;
  const occupied = selected ? village.housingAssignments.filter((entry) => entry.houseId === selected.id) : [];
  const personName = (id: string) => village.residents.find((person) => person.id === id)?.displayName ?? 'Habitante';
  let detail = '<p class="small-note">No hay solares disponibles en esta aldea.</p>';
  if (project) {
    const required = project.requiredWork ?? WORK_RULES.constructionWork[project.buildingType];
    detail = `<p class="eyebrow">Solar reservado · ${project.status === 'paused' ? 'Obra pausada' : project.status === 'working' ? 'Obra en marcha' : 'Obra preparada'}</p><h2>${html(CONSTRUCTION_CATALOG[project.buildingType].label)} en proyecto</h2>
      <label>Trabajo realizado: ${project.progress} / ${required}<meter min="0" max="${required}" value="${project.progress}">${project.progress} de ${required}</meter></label>
      <p><strong>${project.reservedWood}</strong> unidades de madera ${project.materialsConsumed ? 'ya consumidas al iniciar; no se cobran otra vez' : 'reservadas en el almacén; se consumen al comenzar'}.</p>
      <p class="small-note">${project.status === 'paused' ? 'La pausa conserva el progreso y detiene el trabajo.' : 'Avanza al pasar los días si tiene constructores autorizados. Hasta tres por obra; su habilidad influye en el ritmo.'} Cancelar tras comenzar libera el solar y pierde el progreso, sin devolver la madera gastada.</p>
      <button type="button" class="text-button" data-action="navigate" data-route="professions">Gestionar constructores →</button>
      <div class="project-actions"><button type="button" data-action="project-order" data-project="${html(project.id)}" data-order="${project.status === 'paused' ? 'resume' : 'pause'}">${project.status === 'paused' ? 'Reanudar obra' : 'Pausar obra'}</button><button type="button" data-action="project-order" data-project="${html(project.id)}" data-order="cancel">${project.materialsConsumed ? 'Cancelar sin recuperar madera' : `Cancelar y liberar ${project.reservedWood} de madera`}</button></div>`;
  } else if (selectedPlot && !selected) {
    detail = `<h2>Solar libre</h2><p>Espacio ${village.constructionSlots.indexOf(selectedPlot) + 1}</p><form class="housing-form" id="prepare-construction-form"><input type="hidden" name="slotId" value="${html(selectedPlot.id)}" />
      <label>Edificio<select name="buildingType" required>${Object.entries(CONSTRUCTION_CATALOG).map(([type, item]) => `<option value="${type}"${storage.availableWood < item.wood ? ' disabled' : ''}>${item.label} · ${item.wood} de madera · ${item.capacityLabel}</option>`).join('')}</select></label>
      <p class="small-note">Madera disponible: <strong>${q(storage.availableWood)}</strong> · Reservada: ${storage.reservedWood}. Costes provisionales.</p><p class="small-note">Preparar autoriza la obra y reserva sus materiales. Al avanzar los días, los constructores flexibles podrán atenderla; también puedes asignar un constructor exclusivo.</p>
      <button type="submit" class="primary-button"${storage.availableWood < 20 ? ' disabled' : ''}>Preparar y reservar materiales</button></form>`;
  } else if (selected) {
    const common = `<p class="eyebrow">${selected.type === 'house' ? 'Vivienda' : selected.type === 'orchard' ? 'Agricultura' : 'Reservas'}</p><h2>${html(selected.displayName)}</h2><p class="building-state">Conservación <strong>${selected.condition} / 100</strong></p>`;
    if (selected.type === 'house') {
      const full = occupied.length >= selected.housingCapacity || !isBuildingUsable(selected);
      const candidates = village.residents.filter((person) => person.alive && !occupied.some((entry) => entry.residentId === person.id));
      detail = `${common}<p><strong>${occupied.length} / ${selected.housingCapacity}</strong> plazas ocupadas</p><h3>Quienes viven aquí</h3>
        ${occupied.length ? `<ul class="house-residents">${occupied.map((entry) => `<li><button type="button" class="text-button" data-action="inspect" data-person="${html(entry.residentId)}">${html(personName(entry.residentId))}</button>${entry.locked ? '<span class="small-note">Vivienda elegida por ti</span>' : ''}</li>`).join('')}</ul>` : '<p class="small-note">Esta casa está vacía.</p>'}
        <h3>Alojar a alguien aquí</h3>${full ? '<p class="small-note">No hay plazas utilizables disponibles. Repara la casa si es inhabitable o libera una plaza trasladando a un morador a otra vivienda.</p>' : candidates.length ? `<form class="housing-form" id="move-resident-form"><input type="hidden" name="houseId" value="${html(selected.id)}" /><label>Habitante<select name="residentId" required>${candidates.map((person) => {
          const homeId = village.housingAssignments.find((entry) => entry.residentId === person.id)?.houseId;
          const home = village.buildings.find((building) => building.id === homeId)?.displayName ?? 'Sin vivienda';
          const family = village.families.find((candidate) => candidate.id === person.familyId)?.displayName ?? '';
          return `<option value="${html(person.id)}">${html(person.displayName)} · ${html(family)} · ${html(home)}</option>`;
        }).join('')}</select></label><p class="small-note">El traslado es individual. Su familia se conserva y tu elección de vivienda quedará protegida.</p><button type="submit" class="primary-button">Trasladar a esta casa</button></form>` : '<p class="small-note">Todos los habitantes ya viven en esta casa.</p>'}`;
    } else if (selected.type === 'orchard') {
      detail = `${common}<p><strong>${selectWorkOccupancy(village, selected.id)} / ${selected.workerCapacity}</strong> puestos de trabajo ocupados</p><button type="button" class="text-button" data-action="navigate" data-route="professions">Gestionar agricultores →</button><p class="small-note">Produce al avanzar los días si tiene agricultores. La estación, habilidades y conservación influyen en la cosecha.</p><button type="button" class="text-button" data-action="navigate" data-route="economy">Ver producción y consumo →</button>`;
    } else {
      const summary = selectVillageSummary(village);
      const total = storage.occupied;
      detail = `${common}<p>Capacidad de este almacén: <strong>${selected.storageCapacity}</strong> unidades.</p><h3>Reservas de la aldea</h3><dl class="storage-figures"><div><dt>Alimentos</dt><dd>${q(summary.inventory.food)}</dd></div><div><dt>Madera almacenada</dt><dd>${q(summary.inventory.wood)}</dd></div><div><dt>Madera reservada</dt><dd>${q(storage.reservedWood)}</dd></div><div><dt>Madera disponible</dt><dd>${q(storage.availableWood)}</dd></div><div><dt>Espacio libre</dt><dd>${q(storage.free)}</dd></div></dl><label>Ocupación compartida: ${q(total)} / ${summary.warehouseCapacity}<meter min="0" max="${summary.warehouseCapacity}" value="${total}">${q(total)} de ${summary.warehouseCapacity}</meter></label><p class="small-note">La madera reservada sigue ocupando espacio. Alimentos y madera comparten la capacidad. De cada entrega se almacenará lo que quepa y se avisará del sobrante rechazado.</p>`;
    }
  }
  if (selected) {
    detail += renderMaintenance(village, selected.id);
    if (selected.type === 'warehouse') detail += `<h3>Reserva para mantenimiento automático</h3><form class="housing-form" id="maintenance-reserve-form"><label>Madera mínima que el mantenimiento automático deberá conservar<input name="wood" type="number" min="0" step="1" required value="${selectMaintenance(village).minimumWoodReserve}" /></label><p class="small-note">El reparto flexible respeta este mínimo. Una reparación exclusiva que tú asignes puede utilizarlo. Las reservas de otras obras siempre se protegen.</p><button type="submit">Guardar reserva mínima</button></form>`;
  }
  return `<header class="page-heading"><div><p class="eyebrow">Grado ${village.grade} · ${village.constructionSlots.length} solares</p><h1 id="page-title" tabindex="-1">Edificios y viviendas</h1></div><p>${freePlots} libres · ${village.buildings.filter(isStanding).length} ocupados · ${projects.length} reservados</p></header>${selected && !isBuildingUsable(selected) ? '<aside class="callout"><p>Edificio inutilizable. Sus plazas no protegen ni permiten producir o admitir nuevas entregas. Autoriza mantenimiento y asigna constructores para recuperarlo.</p></aside>' : ''}${renderExpansion(village)}
    <div class="plots-layout"><section class="panel" aria-label="Plano de solares"><p class="small-note">Elige un solar para consultar su edificio o su espacio disponible.</p><div class="plots-grid">${village.constructionSlots.map((plot, index) => {
      const building = village.buildings.find((candidate) => candidate.id === plot.buildingId);
      const planned = projects.find((candidate) => candidate.slotId === plot.id);
      const icon = building?.type === 'house' ? 'favicon' : building?.type === 'orchard' ? 'orchard' : 'warehouse';
      return `<button type="button" class="plot-card" data-action="inspect-plot" data-plot="${html(plot.id)}" aria-pressed="${plot.id === selectedPlot?.id}"><small>Solar ${index + 1}</small>${building ? `<img src="${import.meta.env.BASE_URL}${icon}.svg" width="32" height="32" alt="" /><strong>${html(building.displayName)}</strong><span>Ocupado</span>` : planned ? `<strong>${html(CONSTRUCTION_CATALOG[planned.buildingType].label)} en proyecto</strong><span>${planned.status === 'paused' ? 'Pausado' : planned.status === 'working' ? `${Math.round(planned.progress / planned.requiredWork! * 100)} %` : 'Reservado'}</span>` : '<span class="empty-plot" aria-hidden="true">+</span><strong>Libre</strong>'}</button>`;
    }).join('')}</div></section><section class="panel plot-detail" aria-label="Detalle del solar" tabindex="-1">${detail}</section></div>`;
}
