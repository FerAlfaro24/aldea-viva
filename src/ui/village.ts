import type { Session } from '../app/session';
import { SLOT_IDS } from '../app/session';
import type { VillageState } from '../game/models/village';
import { selectResidentDetails, selectVillageSummary } from '../game/selectors/village';
import { dateLabel, eventLabel, html, SEASON_NAMES } from './format';
import type { SlotStatus } from '../storage/repository';
import type { SlotId } from '../game/models/save';

export function renderSlots(session: Session, statuses?: Readonly<Record<SlotId, SlotStatus>>): string {
  return `<header class="page-heading"><div><p class="eyebrow">Tres comienzos posibles</p><h1 id="page-title" tabindex="-1">Tus aldeas</h1></div><p>Continúa una historia o comienza otra.</p></header>
    <p class="small-note">Guardado en este navegador y esta dirección. Borrar los datos del sitio elimina las partidas.</p>
    <div class="slots-grid">${SLOT_IDS.map((id) => {
      const village = session.slots[id];
      const status = statuses?.[id];
      if (status?.kind === 'invalid') return `<section class="slot-card"><p class="eyebrow">Espacio ${id}</p><h2>Partida protegida</h2><p>${html(status.error)}</p><p class="small-note">Puedes seguir usando los otros espacios.</p><button type="button" data-action="reload-saves">Volver a leer</button></section>`;
      return `<section class="slot-card"><p class="eyebrow">Espacio ${id}</p><h2>${village ? 'Una historia en marcha' : 'Una nueva aldea'}</h2>
        ${village ? `<p>${village.residents.length} habitantes · ${village.families.length} hogares</p><p class="small-note">${html(dateLabel(village.elapsedDays))}</p><p class="seed-value">Semilla: ${html(village.rng.seed)}</p><button type="button" class="primary-button" data-action="continue" data-slot="${id}">Continuar</button><button type="button" class="text-button" data-action="new" data-slot="${id}">Reemplazar esta aldea</button><button type="button" class="text-button delete-button" data-action="delete" data-slot="${id}">Borrar aldea</button>`
          : '<p class="muted">Elige una semilla para conocer a tus primeros habitantes.</p>' + `<button type="button" class="primary-button" data-action="new" data-slot="${id}">Crear aldea</button>`}</section>`;
    }).join('')}</div>`;
}

export function renderVillage(village: VillageState): string {
  const summary = selectVillageSummary(village);
  const people = village.residents.map((person) => selectResidentDetails(village, person.id));
  const residentLink = (id: string): string => {
    const person = people.find((candidate) => candidate?.id === id);
    return person ? `<button type="button" class="text-button" data-action="inspect" data-person="${html(person.id)}">${html(person.displayName)}</button>` : '';
  };
  return `<header class="page-heading"><div><p class="eyebrow">Grado ${summary.grade} · ${village.families.length} hogares</p><h1 id="page-title" tabindex="-1">La aldea</h1></div><p>${html(SEASON_NAMES[summary.date.season])} · Año ${summary.date.year}</p></header>
    <div class="stats-grid" aria-label="Estado de la aldea">
      <section class="stat"><span>Habitantes</span><strong>${summary.population}</strong><small>Personas que cuentan una historia</small></section>
      <section class="stat"><span>Viviendas</span><strong>${summary.housing.housed}<span> / ${summary.housing.capacity}</span></strong><small>Camas ocupadas / disponibles</small></section>
      <section class="stat"><span>Alimentos</span><strong>${summary.inventory.food}</strong><small>Reserva inicial</small></section>
      <section class="stat"><span>Madera</span><strong>${summary.inventory.wood}</strong><small>Reserva inicial</small></section>
    </div>
    ${summary.housing.unhousedIds.length ? `<div class="callout housing-alert"><p><strong>${summary.housing.unhousedIds.length} ${summary.housing.unhousedIds.length === 1 ? 'persona sin vivienda' : 'personas sin vivienda'}.</strong> Hay 15 camas para ${summary.population} habitantes. Todavía no se aplican consecuencias por frío.</p><button type="button" class="text-button" data-action="unhoused">Ver quiénes</button></div>` : ''}
    <div class="overview-grid"><section class="panel"><div class="section-heading"><h2>Los primeros edificios</h2><span class="small-note">${village.constructionSlots.filter((slot) => slot.buildingId === null).length} solares libres</span></div>
      <div class="buildings-grid">${village.buildings.map((building) => {
        const occupants = village.housingAssignments.filter((assignment) => assignment.houseId === building.id);
        const detail = building.type === 'house'
          ? `<p>${occupants.length} de ${building.housingCapacity} plazas ocupadas</p><details><summary>Ver residentes</summary><div class="occupants">${occupants.map((assignment) => residentLink(assignment.residentId)).join('')}</div></details>`
          : building.type === 'orchard' ? `<p>${building.workerCapacity} puestos previstos</p><p class="small-note">Las labores del campo llegarán más adelante.</p>`
            : `<p>${summary.inventory.food + summary.inventory.wood} / ${summary.warehouseCapacity} unidades</p><p class="small-note">Capacidad compartida entre alimentos y madera.</p>`;
        const icon = building.type === 'house' ? 'favicon' : building.type === 'orchard' ? 'orchard' : 'warehouse';
        return `<article class="building-card"><img src="${import.meta.env.BASE_URL}${icon}.svg" alt="" width="32" height="32" /><h3>${html(building.displayName)}</h3>${detail}<small class="building-condition">Conservación ${building.condition} / 100</small></article>`;
      }).join('')}</div>
      <p class="small-note">Edificios y reservas iniciales. Aún no hay producción, consumo, construcción ni deterioro. Las capacidades y cantidades siguen pendientes de equilibrio.</p>
    </section><section class="panel"><h2>Hogares de la aldea</h2><p class="small-note">Conoce a quienes han llegado juntos.</p><ul class="family-list">${village.families.map((family) => `<li><button type="button" data-action="family" data-family="${html(family.id)}"><span>${html(family.displayName)}</span><small>${family.memberIds.length} ${family.memberIds.length === 1 ? 'integrante' : 'integrantes'} <span aria-hidden="true">↗</span></small></button></li>`).join('')}</ul>
      <details class="seed-details"><summary>Semilla de esta aldea</summary><code class="seed-value">${html(village.rng.seed)}</code><p class="small-note">Reutilízala para obtener la misma aldea inicial.</p></details>
    </section></div>`;
}

export function renderChronicle(village: VillageState): string {
  return `<header class="page-heading"><div><p class="eyebrow">Lo que el tiempo deja</p><h1 id="page-title" tabindex="-1">Registro de la aldea</h1></div><p>${village.chronicle.length} ${village.chronicle.length === 1 ? 'acontecimiento' : 'acontecimientos'}</p></header>
    <p class="small-note">Fundación, cumpleaños, estaciones y nuevas edades laborales. Los grandes acontecimientos llegarán más adelante.</p>
    <ol class="chronicle-list">${[...village.chronicle].reverse().map((entry) => `<li><span class="chronicle-date">${html(dateLabel(entry.elapsedDay))}</span><div><p>${html(eventLabel(entry, village))}</p>${'residentId' in entry ? `<button type="button" class="text-button" data-action="inspect" data-person="${html(entry.residentId)}">Ver habitante →</button>` : ''}</div></li>`).join('')}</ol>`;
}
