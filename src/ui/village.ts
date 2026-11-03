import { getCalendarDate } from '../game/core/calendar';
import { selectChronicle, selectMemorial, EMPTY_CHRONICLE_FILTERS, type ChronicleFilters } from '../game/selectors/chronicle';
import type { Session } from '../app/session';
import { SLOT_IDS } from '../app/session';
import type { VillageState } from '../game/models/village';
import { selectResidentDetails, selectVillageSummary } from '../game/selectors/village';
import { dateLabel, eventLabel, html, SEASON_NAMES, quantityLabel } from './format';
import type { SlotStatus } from '../storage/repository';
import type { SlotId } from '../game/models/save';
import { selectWorkOccupancy } from '../game/selectors/work';
import { isGameOver, isStanding } from '../game/selectors/survival';
import { renderFirstSteps } from './help';

export function renderSlots(session: Session, statuses?: Readonly<Record<SlotId, SlotStatus>>): string {
  return `<header class="page-heading"><div><p class="eyebrow">Tres comienzos posibles</p><h1 id="page-title" tabindex="-1">Tus aldeas</h1></div><p>Continúa una historia o comienza otra.</p></header>
    <p class="small-note">Guardado en este navegador y esta dirección. Borrar los datos del sitio elimina las partidas.</p>
    <div class="slots-grid">${SLOT_IDS.map((id) => {
      const village = session.slots[id];
      const status = statuses?.[id];
      if (status?.kind === 'invalid') return `<section class="slot-card"><p class="eyebrow">Espacio ${id}</p><h2>Partida protegida</h2><p>${html(status.error)}</p><p class="small-note">Puedes seguir usando los otros espacios.</p><button type="button" data-action="reload-saves">Volver a leer</button></section>`;
      return `<section class="slot-card"><p class="eyebrow">Espacio ${id}</p><h2>${village ? 'Una historia en marcha' : 'Una nueva aldea'}</h2>
        ${village ? `<p>${village.residents.filter((person) => person.alive).length} vivos · ${village.residents.filter((person) => !person.alive).length} fallecidos</p><p class="small-note">${html(dateLabel(village.elapsedDays))}</p><p class="seed-value">Semilla: ${html(village.rng.seed)}</p><button type="button" class="primary-button" data-action="continue" data-slot="${id}">${isGameOver(village) ? 'Consultar historia' : 'Continuar'}</button><button type="button" class="text-button" data-action="new" data-slot="${id}">Reemplazar esta aldea</button><button type="button" class="text-button delete-button" data-action="delete" data-slot="${id}">Borrar aldea</button>`
          : '<p class="muted">Elige una semilla para conocer a tus primeros habitantes.</p>' + `<button type="button" class="primary-button" data-action="new" data-slot="${id}">Crear aldea</button>`}</section>`;
    }).join('')}</div>`;
}

export function renderVillage(village: VillageState): string {
  const summary = selectVillageSummary(village);
  const freePlots = village.constructionSlots.filter((slot) => slot.buildingId === null && !(village.constructionProjects ?? []).some((project) => project.slotId === slot.id)).length;
  const people = village.residents.map((person) => selectResidentDetails(village, person.id));
  const residentLink = (id: string): string => {
    const person = people.find((candidate) => candidate?.id === id);
    return person ? `<button type="button" class="text-button" data-action="inspect" data-person="${html(person.id)}">${html(person.displayName)}</button>` : '';
  };
  return `<header class="page-heading"><div><p class="eyebrow">Grado ${summary.grade} · ${village.families.length} hogares</p><h1 id="page-title" tabindex="-1">La aldea</h1></div><p>${html(SEASON_NAMES[summary.date.season])} · Año ${summary.date.year}</p></header>
    ${renderFirstSteps(village)}
    <div class="stats-grid" aria-label="Estado de la aldea">
      <section class="stat"><span>Habitantes</span><strong>${summary.population}</strong><small>Personas que cuentan una historia</small></section>
      <section class="stat"><span>Viviendas</span><strong>${summary.housing.housed}<span> / ${summary.housing.capacity}</span></strong><small>Camas ocupadas / disponibles</small></section>
      <section class="stat"><span>Alimentos</span><strong>${quantityLabel(summary.inventory.food)}</strong><small>Reserva actual · Consumo diario activo</small></section>
      <section class="stat"><span>Madera</span><strong>${quantityLabel(summary.inventory.wood)}</strong><small>Existencias actuales en el almacén</small></section>
    </div>
    <div class="callout"><p>${isGameOver(village) ? 'La historia ha terminado: no queda ningún superviviente.' : 'La falta de alimento y refugio ya afecta a la salud. Revisa los avisos antes de avanzar muchos días.'}</p><button type="button" class="text-button" data-action="navigate" data-route="survival">Revisar Salud →</button></div>
    ${summary.housing.unhousedIds.length ? `<div class="callout housing-alert"><p><strong>${summary.housing.unhousedIds.length} ${summary.housing.unhousedIds.length === 1 ? 'persona sin refugio utilizable' : 'personas sin refugio utilizable'}.</strong> Hay ${summary.housing.capacity} camas utilizables para ${summary.population} habitantes. El frío del invierno es peligroso sin protección.</p><button type="button" class="text-button" data-action="navigate" data-route="survival">Ver riesgos</button></div>` : ''}
    <div class="overview-grid"><section class="panel"><div class="section-heading"><h2>Los primeros edificios</h2><span class="small-note">${freePlots} solares libres</span></div>
      <div class="buildings-grid">${village.buildings.filter(isStanding).map((building) => {
        const occupants = village.housingAssignments.filter((assignment) => assignment.houseId === building.id);
        const detail = building.type === 'house'
          ? `<p>${occupants.length} de ${building.housingCapacity} plazas ocupadas</p><details><summary>Ver residentes</summary><div class="occupants">${occupants.map((assignment) => residentLink(assignment.residentId)).join('')}</div></details>`
          : building.type === 'orchard' ? `<p>${selectWorkOccupancy(village, building.id)} / ${building.workerCapacity} puestos ocupados</p><button type="button" class="text-button" data-action="navigate" data-route="professions">Gestionar agricultores →</button>`
            : `<p>${quantityLabel(summary.inventory.food + summary.inventory.wood)} / ${summary.warehouseCapacity} unidades</p><p class="small-note">Capacidad compartida entre alimentos y madera.</p>`;
        const icon = building.type === 'house' ? 'favicon' : building.type === 'orchard' ? 'orchard' : 'warehouse';
        return `<article class="building-card"><img src="${import.meta.env.BASE_URL}${icon}.svg" alt="" width="32" height="32" /><h3>${html(building.displayName)}</h3>${detail}<small class="building-condition">Conservación ${building.condition} / 100</small></article>`;
      }).join('')}</div>
      <p class="small-note">Agricultores y leñadores producen; los habitantes consumen cada día. Consulta raciones, prioridades y balances en Economía. El equilibrio sigue siendo provisional.</p><button type="button" class="text-button" data-action="navigate" data-route="economy">Gestionar economía →</button>
    </section><section class="panel"><h2>Hogares de la aldea</h2><p class="small-note">Conoce a quienes han llegado juntos.</p><ul class="family-list">${village.families.map((family) => `<li><button type="button" data-action="family" data-family="${html(family.id)}"><span>${html(family.displayName)}</span><small>${family.memberIds.length} ${family.memberIds.length === 1 ? 'integrante' : 'integrantes'} <span aria-hidden="true">↗</span></small></button></li>`).join('')}</ul>
      <details class="seed-details"><summary>Semilla de esta aldea</summary><code class="seed-value">${html(village.rng.seed)}</code><p class="small-note">Reutilízala para obtener la misma aldea inicial.</p></details>
    </section></div>`;
}

export function renderChronicle(village: VillageState, filters: ChronicleFilters = EMPTY_CHRONICLE_FILTERS): string {
  const page = selectChronicle(village, filters);
  const memorial = selectMemorial(village);
  const option = (value: string, label: string, current: string) => `<option value="${html(value)}"${value === current ? ' selected' : ''}>${html(label)}</option>`;
  const years = [...new Set(village.chronicle.map((entry) => String(getCalendarDate(entry.elapsedDay).year)))].reverse();
  return `<header class="page-heading"><div><p class="eyebrow">Lo que el tiempo deja</p><h1 id="page-title" tabindex="-1">Registro de la aldea</h1></div><p>${page.total} acontecimientos · Página ${page.page + 1} de ${page.pages}</p></header>
    <p class="small-note">Decisiones, obras, cumpleaños, estaciones, balances diarios y las consecuencias de supervivencia y asaltos.</p>
    ${isGameOver(village) ? `<section class="panel talent-reveal"><h2>Memoria de la aldea</h2><p>${memorial.days} días de historia · ${memorial.built} obras terminadas · ${memorial.raids} asaltos resueltos · ${memorial.arrivals} llegadas aceptadas · ${memorial.talents} descubrimientos.</p><p>${memorial.deaths.map((person) => html(person.displayName)).join(', ')}. Sus destinos y causas de fallecimiento permanecen en esta crónica.</p></section>` : ''}
    <form id="chronicle-filter-form" class="chronicle-filters"><label>Persona<select name="residentId">${option('', 'Todas', filters.residentId)}${village.residents.map((person) => option(person.id, person.displayName + (person.alive ? '' : ' · Fallecido'), filters.residentId)).join('')}</select></label><label>Familia<select name="familyId">${option('', 'Todas', filters.familyId)}${village.families.map((family) => option(family.id, family.displayName, filters.familyId)).join('')}</select></label><label>Año<select name="year">${option('', 'Todos', filters.year)}${years.map((year) => option(year, year, filters.year)).join('')}</select></label><label>Estación<select name="season">${option('', 'Todas', filters.season)}${(['spring','summer','autumn','winter'] as const).map((season) => option(season, SEASON_NAMES[season], filters.season)).join('')}</select></label><label>Mostrar<select name="kind">${option('important', 'Historias y decisiones', filters.kind)}${option('all', 'Todo', filters.kind)}${option('economy', 'Balances económicos', filters.kind)}</select></label><button type="submit">Filtrar crónica</button></form>
    ${!page.entries.length ? '<p>No hay acontecimientos con estos filtros.</p>' : ''}
    <ol class="chronicle-list">${page.entries.map((entry) => `<li><span class="chronicle-date">${html(dateLabel(entry.elapsedDay))}</span><div><p>${html(eventLabel(entry, village))}</p>${'residentId' in entry && entry.residentId ? `<button type="button" class="text-button" data-action="inspect" data-person="${html(entry.residentId)}">Ver habitante →</button>` : ''}</div></li>`).join('')}</ol><div class="project-actions"><button type="button" data-action="chronicle-page" data-page="${page.page - 1}"${page.page === 0 ? ' disabled' : ''}>Más recientes</button><span>Página ${page.page + 1} de ${page.pages}</span><button type="button" data-action="chronicle-page" data-page="${page.page + 1}"${page.page + 1 >= page.pages ? ' disabled' : ''}>Más antiguos</button></div>`;
}
