import type { VillageState } from '../game/models/village';
import { selectMemorial } from '../game/selectors/chronicle';
import { dateLabel, eventLabel, html, PROFESSION_NAMES, quantityLabel as q } from './format';

export function renderYearStory(village: VillageState): string {
  const highlights = village.chronicle.filter((entry) =>
    ['season_changed', 'bandit_resolved', 'visitors_resolved', 'talent_discovered', 'resident_died'].includes(entry.type)
    || entry.type === 'construction_changed' && entry.action === 'completed').slice(-3).reverse();
  const memory = selectMemorial(village);
  const living = village.residents.filter((person) => person.alive);
  return `<section class="panel year-story"><div class="section-heading"><h2>${village.elapsedDays >= 336 && living.length ? 'Habéis superado el primer año' : 'La historia que estáis construyendo'}</h2><button type="button" class="text-button" data-action="navigate" data-route="chronicle">Ver la crónica →</button></div>
    <p>${living.length} personas siguen adelante · ${memory.built} obras terminadas · ${memory.raids} asaltos resueltos · ${memory.talents} descubrimientos.</p>
    ${highlights.length ? `<ol class="mini-chronicle">${highlights.map((entry) => `<li><small>${html(dateLabel(entry.elapsedDay))}</small><p>${html(eventLabel(entry, village))}</p></li>`).join('')}</ol>` : '<p class="small-note">La primera cosecha y la primera obra serán el comienzo de vuestra historia. Cada persona tiene algo que aportar.</p>'}</section>`;
}

export function renderAdvanceRecap(before: VillageState, after: VillageState): string {
  const elapsed = after.elapsedDays - before.elapsedDays;
  if (elapsed <= 0 || before.id !== after.id) return '';
  const events = after.chronicle.slice(before.chronicle.length).filter((entry) =>
    ['season_changed', 'bandit_warning', 'bandit_resolved', 'talent_discovered', 'resident_died', 'visitors_resolved', 'medical_episode'].includes(entry.type)
    || entry.type === 'construction_changed' && entry.action === 'completed').slice(-4);
  const achievements: string[] = [];
  if (!before.chronicle.some((entry) => entry.type === 'economy_day') && after.chronicle.some((entry) => entry.type === 'economy_day')) achievements.push('Primera jornada de la comunidad: ya puedes ver producción y consumo reales.');
  if (!before.chronicle.some((entry) => entry.type === 'construction_changed' && entry.action === 'completed') && after.chronicle.some((entry) => entry.type === 'construction_changed' && entry.action === 'completed')) achievements.push('Primera obra terminada. Has cambiado el futuro de la aldea.');
  if (before.elapsedDays < 28 && after.elapsedDays >= 28) achievements.push('Primer mes completado: ya puedes preparar la ampliación al grado 2.');
  if (before.elapsedDays < 336 && after.elapsedDays >= 336 && after.residents.some((person) => person.alive)) achievements.push('Primer año superado. Tu comunidad ha atravesado las cuatro estaciones.');
  const gains = after.residents.filter((person) => person.alive && person.profession).map((person) => {
    const old = before.residents.find((candidate) => candidate.id === person.id);
    return { person, gain: person.skills[person.profession!].effective - (old?.skills[person.profession!].effective ?? person.skills[person.profession!].effective) };
  }).sort((a, b) => b.gain - a.gain);
  const best = gains[0];
  const signed = (value: number) => `${value > 0 ? '+' : ''}${q(value)}`;
  return `<section class="panel advance-recap" aria-labelledby="advance-recap-title"><h2 id="advance-recap-title">${elapsed === 1 ? 'Así ha pasado el día' : `Así han pasado estos ${elapsed} días`}</h2><p>Comida ${signed(after.inventory.food - before.inventory.food)} · Madera ${signed(after.inventory.wood - before.inventory.wood)}</p>
    ${achievements.map((text) => `<p class="achievement">${html(text)}</p>`).join('')}
    ${best && best.gain >= 0.01 ? `<p><strong>${html(best.person.displayName)}</strong> ha mejorado ${q(best.gain)} en ${html(PROFESSION_NAMES[best.person.profession!].toLocaleLowerCase('es'))}.</p>` : ''}
    ${events.length ? `<ul>${events.map((entry) => `<li>${html(eventLabel(entry, after))}</li>`).join('')}</ul>` : '<p class="small-note">La jornada ha continuado sin nuevos acontecimientos importantes.</p>'}</section>`;
}
