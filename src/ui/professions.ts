import { getAge } from '../game/core/calendar';
import type { Profession } from '../game/models/simulation';
import type { VillageState } from '../game/models/village';
import { MINIMUM_WORK_AGES, PROFESSIONS } from '../game/rules/calendar';
import { selectWorkAssignment, selectWorkOccupancy, selectWorkplaceLabel, selectWorksites } from '../game/selectors/work';
import { html, PROFESSION_NAMES } from './format';

const DESCRIPTIONS: Readonly<Record<Profession, string>> = {
  farmer: 'Producen alimentos y aprenden en el huerto que elijas. La estación y la conservación del huerto influyen en la cosecha.',
  woodcutter: 'Aportan madera y aprenden en el bosque. El bosque no se agota; cada entrega necesita espacio en el almacén.',
  builder: 'Trabajan en obras y mantenimiento autorizados. Hasta tres por tarea. El reparto flexible respeta la reserva mínima de madera; una reparación exclusiva puede utilizarla.',
  warrior: 'Guardia y práctica en la aldea o el bosque. Dos plazas por destino. Los puestos protegen frente a los bandoleros; revisa amenazas y tácticas en Defensa.',
};

export function renderWorkChoices(village: VillageState, residentId: string): string {
  const person = village.residents.find((resident) => resident.id === residentId);
  if (!person?.alive) return '';
  const age = getAge(person, village.elapsedDays);
  const order = selectWorkAssignment(village, person.id);
  const options = PROFESSIONS.filter((profession) => age >= MINIMUM_WORK_AGES[profession]).flatMap((profession) =>
    selectWorksites(village, profession).map((site) => {
      const occupied = selectWorkOccupancy(village, site.id, person.id);
      const full = site.capacity !== null && occupied >= site.capacity;
      const selected = order?.profession === profession && order.workplaceId === site.id && order.status === 'active';
      const free = site.capacity === null ? null : site.capacity - occupied;
      return `<option value="${html(`${profession}|${site.id}`)}"${selected ? ' selected' : ''}${full ? ' disabled' : ''}>${html(PROFESSION_NAMES[profession])} · ${html(site.label)}${selected ? ' · Destino actual' : free === null ? '' : ` · ${full ? 'Completo' : free === 1 ? '1 plaza disponible' : `${free} plazas disponibles`}`}</option>`;
    }));
  if (!options.length && !person.profession) return '<p class="small-note">Todavía no tiene edad para trabajar.</p>';
  return `<form class="work-form" data-work-form><input type="hidden" name="residentId" value="${html(person.id)}" />
    <label>Oficio y destino<select name="work"><option value=""${!order || order.status === 'conflict' ? ' selected' : ''}>Sin oficio asignado</option>${options.join('')}</select></label>
    <button type="submit">Guardar oficio</button></form>`;
}

export function renderProfessions(village: VillageState): string {
  const living = village.residents.filter((person) => person.alive);
  const unemployed = living.filter((person) => person.profession === null).length;
  return `<header class="page-heading"><div><p class="eyebrow">Personas que sostienen la aldea</p><h1 id="page-title" tabindex="-1">Oficios</h1></div><p>${living.length - unemployed} con oficio · ${unemployed} sin asignar</p></header>
    <p class="small-note">Tú eliges cada nombramiento. Los cumpleaños habilitan opciones y nadie es contratado automáticamente.</p>
    <div class="profession-grid">${PROFESSIONS.map((profession) => {
      const assigned = living.filter((person) => person.profession === profession);
      const candidates = living.filter((person) => person.profession === null && getAge(person, village.elapsedDays) >= MINIMUM_WORK_AGES[profession]);
      const sites = selectWorksites(village, profession);
      const available = sites.filter((site) => site.capacity === null || selectWorkOccupancy(village, site.id) < site.capacity);
      return `<section class="panel profession-panel" aria-labelledby="profession-${profession}"><div class="section-heading"><h2 id="profession-${profession}">${html(PROFESSION_NAMES[profession])}</h2><span class="small-note">Desde ${MINIMUM_WORK_AGES[profession]} años</span></div><p>${html(DESCRIPTIONS[profession])}</p>
        <ul class="worksites">${sites.map((site) => {
          const count = selectWorkOccupancy(village, site.id);
          return `<li><span>${html(site.label)}</span><strong>${count}${site.capacity === null ? count === 1 ? ' persona' : ' personas' : ` / ${site.capacity}`}</strong></li>`;
        }).join('')}</ul>
        ${assigned.length ? `<ul class="workers-list">${assigned.map((person) => `<li><button type="button" class="text-button" data-action="inspect" data-person="${html(person.id)}">${html(person.displayName)}</button><span class="small-note">${html(selectWorkplaceLabel(village, person.id))} · Habilidad ${person.skills[profession].effective}</span>${renderWorkChoices(village, person.id)}</li>`).join('')}</ul>` : '<p class="small-note">Sin trabajadores asignados.</p>'}
        ${candidates.length && available.length ? `<form class="work-form" data-work-form><input type="hidden" name="profession" value="${profession}" /><label>Elegir habitante<select name="residentId" required>${candidates.map((person) => `<option value="${html(person.id)}">${html(person.displayName)} · ${getAge(person, village.elapsedDays)} años · Habilidad ${person.skills[profession].effective}</option>`).join('')}</select></label><label>Destino<select name="work" required>${available.map((site) => `<option value="${html(`${profession}|${site.id}`)}">${html(site.label)}</option>`).join('')}</select></label><button type="submit" class="primary-button">Asignar ${html(PROFESSION_NAMES[profession].toLocaleLowerCase('es'))}</button></form>` : `<p class="small-note">${!available.length ? 'No quedan puestos disponibles.' : 'No hay habitantes sin oficio que cumplan la edad mínima. Puedes cambiar un oficio desde su ficha.'}</p>`}
      </section>`;
    }).join('')}</div>`;
}
