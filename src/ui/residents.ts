import type { ResidentFilters } from '../app/session';
import { EMPTY_FILTERS } from '../app/session';
import type { VillageState } from '../game/models/village';
import { ATTRIBUTE_KEYS } from '../game/models/village';
import { PROFESSIONS } from '../game/rules/calendar';
import { selectResidentDetails } from '../game/selectors/village';
import { ATTRIBUTE_NAMES, dateLabel, eventLabel, html, PROFESSION_NAMES } from './format';

type ResidentDetails = NonNullable<ReturnType<typeof selectResidentDetails>>;
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');

export function filterResidents(village: VillageState, filters: ResidentFilters): ResidentDetails[] {
  const query = normalize(filters.search.trim());
  const people = village.residents.map((person) => selectResidentDetails(village, person.id))
    .filter((person): person is ResidentDetails => person !== null);
  return people.filter((person) => {
    return (!query || normalize(`${person.displayName} ${person.family.displayName}`).includes(query))
      && (!filters.family || person.family.id === filters.family)
      && (!filters.housing || (filters.housing === 'unhoused' ? person.housing === null : person.housing?.id === filters.housing))
      && (filters.employment !== 'unassigned' || person.profession === null)
      && (filters.age === 'all' || (filters.age === 'children' && person.age < 18)
        || (filters.age === 'adults' && person.age >= 18 && person.age < 60)
        || (filters.age === 'older' && person.age >= 60));
  }).sort((left, right) => {
    return (filters.sort === 'age' ? left.age - right.age : left.displayName.localeCompare(right.displayName, 'es'))
      || left.id.localeCompare(right.id);
  });
}

function option(value: string, label: string, selected: string): string {
  return `<option value="${html(value)}"${value === selected ? ' selected' : ''}>${html(label)}</option>`;
}

export function renderResidentResults(village: VillageState, filters: ResidentFilters): string {
  const people = filterResidents(village, filters);
  if (!people.length) return '<p class="result-count" role="status">No hay habitantes con estos filtros.</p><button type="button" class="text-button" data-action="clear-filters">Limpiar filtros</button>';
  return `<p class="result-count" role="status">${people.length} de ${village.residents.length} habitantes</p>
    <ul class="resident-list">${people.map((person) => `
      <li class="resident-row">
        <button type="button" class="person-link" data-action="inspect" data-person="${html(person.id)}">
          <span class="person-initial" aria-hidden="true">${html(person.displayName.charAt(0))}</span>
          <span><strong>${html(person.displayName)}</strong><small>Sin oficio asignado</small></span>
        </button>
        <span class="resident-cell"><small>Edad</small>${person.age} años</span>
        <span class="resident-cell"><small>Hogar</small>${html(person.family.displayName)}</span>
        <span class="resident-cell${person.housing ? '' : ' unhoused'}"><small>Vivienda</small>${html(person.housing?.displayName ?? 'Sin vivienda')}</span>
        <span class="resident-cell"><small>Estado</small>Salud ${person.condition.health} · Hambre ${person.condition.hunger}</span>
      </li>`).join('')}
    </ul>`;
}

export function renderResidents(village: VillageState, filters: ResidentFilters = EMPTY_FILTERS): string {
  return `<header class="page-heading"><div><p class="eyebrow">Conoce a tu comunidad</p><h1 id="page-title" tabindex="-1">Habitantes</h1></div><p>Las primeras historias de tu aldea.</p></header>
    <form class="resident-filters" aria-label="Filtrar habitantes">
      <label class="search-field">Buscar<input type="search" name="search" data-filter="search" value="${html(filters.search)}" placeholder="Nombre o familia" autocomplete="off" /></label>
      <label>Familia<select name="family" data-filter="family">${option('', 'Todas las familias', filters.family)}${village.families.map((family) => option(family.id, family.displayName, filters.family)).join('')}</select></label>
      <label>Vivienda<select name="housing" data-filter="housing">${option('', 'Todas las viviendas', filters.housing)}${option('unhoused', 'Sin vivienda', filters.housing)}${village.buildings.filter((building) => building.type === 'house').map((house) => option(house.id, house.displayName, filters.housing)).join('')}</select></label>
      <label>Edad<select name="age" data-filter="age">${option('all', 'Todas las edades', filters.age)}${option('children', 'Menores de 18', filters.age)}${option('adults', '18–59 años', filters.age)}${option('older', '60 años o más', filters.age)}</select></label>
      <label>Oficio<select name="employment" data-filter="employment">${option('all', 'Todos', filters.employment)}${option('unassigned', 'Sin asignar', filters.employment)}</select></label>
      <label>Orden<select name="sort" data-filter="sort">${option('name', 'Nombre', filters.sort)}${option('age', 'Edad', filters.sort)}</select></label>
    </form><div id="resident-results">${renderResidentResults(village, filters)}</div>`;
}

function relativeLinks(people: readonly { readonly id: string; readonly displayName: string }[]): string {
  return people.length ? people.map((person) => `<button type="button" class="text-button" data-action="inspect" data-person="${html(person.id)}">${html(person.displayName)}</button>`).join('') : '<span class="muted">Sin familiares registrados en este grupo</span>';
}

function scoreRow(label: string, value: number): string {
  return `<div class="score-row"><span>${html(label)}</span><meter min="0" max="100" value="${value}" aria-label="${html(label)}">${value} de 100</meter><strong>${value}</strong></div>`;
}

export function renderResident(village: VillageState, id: string): string {
  const person = selectResidentDetails(village, id);
  if (!person) return '<h1 id="page-title" tabindex="-1">Habitante no encontrado</h1>';
  return `<header class="page-heading profile-heading"><div><p class="eyebrow">${html(person.family.displayName)}</p><h1 id="page-title" tabindex="-1">${html(person.displayName)}</h1></div><div class="profile-heading-actions"><p>${person.age} años · Sin oficio asignado</p><button type="button" class="text-button back-link" data-action="navigate" data-route="residents">← Volver a habitantes</button></div></header>
    <div class="profile-grid">
      <section class="panel"><h2>Su lugar en la aldea</h2><dl class="facts">
        <div><dt>Cumpleaños</dt><dd>Día ${person.birthday.day} del mes ${person.birthday.month}</dd></div>
        <div><dt>Vivienda</dt><dd class="${person.housing ? '' : 'unhoused'}">${html(person.housing?.displayName ?? 'Sin vivienda')}</dd></div>
        <div><dt>Salud</dt><dd>${person.condition.health} / 100</dd></div><div><dt>Hambre</dt><dd>${person.condition.hunger} / 100</dd></div>
      </dl><p class="small-note">Salud y hambre iniciales. Sus efectos todavía no se simulan.</p>
        <p>${html(person.origin)}</p><h3>Oficios permitidos por edad</h3><p>${person.eligibleProfessions.length ? person.eligibleProfessions.map((profession) => html(PROFESSION_NAMES[profession])).join(' · ') : 'Todavía no tiene edad para trabajar.'}</p>
        <p class="small-note">La asignación de trabajos llegará más adelante.</p></section>
      <section class="panel"><h2>Atributos</h2>${ATTRIBUTE_KEYS.map((key) => scoreRow(ATTRIBUTE_NAMES[key], person.attributes[key])).join('')}
        <h2 class="section-gap">Habilidades</h2>${PROFESSIONS.map((key) => scoreRow(PROFESSION_NAMES[key], person.skills[key])).join('')}</section>
      <section class="panel"><h2>Familiares</h2><div class="relations"><h3>Progenitores</h3>${relativeLinks(person.relations.parents)}<h3>Pareja</h3>${relativeLinks(person.relations.partner ? [person.relations.partner] : [])}<h3>Hermanos</h3>${relativeLinks(person.relations.siblings)}<h3>Descendientes</h3>${relativeLinks(person.relations.children)}</div></section>
      <section class="panel"><h2>Primeras impresiones</h2><ul class="clue-list">${person.clues.map((clue) => `<li>${html(clue)}</li>`).join('')}</ul><p class="small-note">Son indicios. Sus aptitudes se conocerán mejor con la práctica.</p><h2 class="section-gap">Su historia</h2><ol class="mini-chronicle">${person.history.map((entry) => `<li><small>${html(dateLabel(entry.elapsedDay))}</small><p>${html(eventLabel(entry, village))}</p></li>`).join('')}</ol></section>
    </div>`;
}
