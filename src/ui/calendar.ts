import type { VillageState } from '../game/models/village';
import { selectCalendarMonth } from '../game/selectors/calendar';
import { dateLabel, eventLabel, html, SEASON_NAMES } from './format';

export function renderCalendar(village: VillageState, selectedDay: number | null): string {
  const calendar = selectCalendarMonth(village, selectedDay ?? village.elapsedDays);
  const selected = calendar.selected;
  const future = selected.elapsedDay > village.elapsedDays;
  return `<header class="page-heading calendar-heading"><div><p class="eyebrow">El tiempo de tu aldea</p><h1 id="page-title" tabindex="-1">Calendario</h1></div><p>Consultar fechas no hace pasar los días.</p></header>
    <div class="calendar-layout"><section class="panel calendar-panel" aria-labelledby="calendar-month-title">
      <div class="calendar-month-controls"><button type="button" data-action="calendar-month" data-delta="-1" aria-label="Mes anterior"${calendar.canGoBack ? '' : ' disabled'}>←</button>
      <div><h2 id="calendar-month-title" tabindex="-1">Mes ${calendar.month} <span>· Año ${calendar.year}</span></h2><p class="season-label season-${calendar.season}">${html(SEASON_NAMES[calendar.season])}</p></div>
      <button type="button" data-action="calendar-month" data-delta="1" aria-label="Mes siguiente">→</button><button type="button" data-action="calendar-today" aria-label="Ir a hoy">Hoy</button></div>
      <div class="calendar-legend"><span><i class="today-marker" aria-hidden="true"></i>Hoy</span><span><i class="birthday-marker" aria-hidden="true"></i>Cumpleaños</span></div>
      <div class="calendar-days" role="group" aria-label="Días del mes">${calendar.days.map((day) => `<button type="button" class="calendar-day${day.today ? ' is-today' : ''}" data-action="calendar-day" data-day="${day.elapsedDay}" aria-pressed="${day.selected}"${day.today ? ' aria-current="date"' : ''} aria-label="Día ${day.number}${day.today ? ', hoy' : ''}${day.birthdays.length ? `, ${day.birthdays.length} cumpleaños` : ''}${day.events.length ? `, ${day.events.length} acontecimientos registrados` : ''}"><strong>${day.number}</strong><span>${day.birthdays.length ? `<i class="birthday-marker" aria-hidden="true"></i><small>${day.birthdays.length}</small>` : ''}${day.events.length ? '<i class="event-marker" aria-hidden="true"></i>' : ''}</span></button>`).join('')}</div>
    </section><section class="panel calendar-detail" aria-labelledby="calendar-detail-title"><p class="eyebrow">${future ? 'Fechas conocidas' : selected.today ? 'Hoy en la aldea' : 'Un día en su historia'}</p><h2 id="calendar-detail-title">${html(dateLabel(selected.elapsedDay))}</h2>
      <h3>${future ? 'Cumpleaños previstos' : 'Cumpleaños'}</h3>${selected.birthdays.length ? `<ul class="calendar-birthdays">${selected.birthdays.map((person) => `<li><button type="button" class="text-button" data-action="inspect" data-person="${html(person.id)}">${html(person.displayName)}</button><span>${person.age} años</span></li>`).join('')}</ul>` : '<p class="small-note">No hay cumpleaños señalados para este día.</p>'}
      ${selected.events.length ? `<h3>Registro de este día</h3><ul class="calendar-events">${selected.events.map((entry) => `<li>${html(eventLabel(entry, village))}</li>`).join('')}</ul>` : `<p class="small-note">${future ? 'Los acontecimientos se conocerán cuando lleguemos a esta fecha.' : 'No hay acontecimientos registrados en esta fecha.'}</p>`}
    </section></div>`;
}
