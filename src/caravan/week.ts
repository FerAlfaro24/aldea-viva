import { html } from '../ui/format';
import { dayNumber, isRainy, MOUTHS, SHELTER_COST, SHELTER_WORK, type Caravan } from './model';

export function weatherLabel(state: Caravan): string {
  const day = dayNumber(state);
  if (isRainy(day)) return `Día ${day} · Lluvia${state.shelter === SHELTER_WORK ? ' · Refugio protegido' : ' · Si no terminas el refugio: +14 de cansancio esta noche'}`;
  if (day === 4) return 'Día 4 · Nubes · Se espera lluvia los días 5 y 6';
  if (day === 7) return 'Día 7 · Vuelve el sol';
  return `Día ${day} · Tiempo seco`;
}

export function renderImprovements(state: Caravan): string {
  const finished = state.shelter === SHELTER_WORK;
  const available = Math.max(0, SHELTER_COST - state.materials);
  return `<section class="cv-panel cv-improvement"><p class="cv-kicker">La primera mejora · Disponible desde el día 4</p><h1 id="cv-title" tabindex="-1">Un techo que nos cuide</h1>
    <p>La lona tiene goteras. Se espera lluvia los días 5 y 6: sin terminar el refugio, todos sumarán 14 de cansancio cada noche de lluvia.</p>
    <article class="cv-project"><div class="cv-section-heading"><h2>Reforzar el refugio</h2><strong>${finished ? 'Terminado' : state.shelter ? 'En marcha' : 'Por empezar'}</strong></div>
    <p>Al terminar, evita el cansancio adicional de la lluvia y reduce hasta 6 de cansancio de cada persona todas las noches. No sustituye la vigilancia.</p>
    <dl class="cv-project-facts"><div><dt>Materiales</dt><dd>${state.shelter ? '4 utilizados · No se cobran de nuevo' : `${state.materials} disponibles · Coste total: ${SHELTER_COST} materiales`}</dd></div><div><dt>Trabajo</dt><dd>${state.shelter}/${SHELTER_WORK} jornadas${finished ? '' : ' · Una por persona asignada al día'}</dd></div></dl>
    <progress value="${state.shelter}" max="${SHELTER_WORK}" aria-label="Trabajo del refugio">${state.shelter}/${SHELTER_WORK}</progress>
    ${finished ? '<p class="cv-achievement">La obra está terminada. Quienes la construyeron pueden volver a sus otras tareas.</p>' : `<p>${state.shelter ? 'Solo falta el trabajo restante.' : available ? `${available === 1 ? 'Falta 1 material' : `Faltan ${available} materiales`}. Cada persona que recoge aporta 2; pueden usarse ese mismo día.` : 'Ya tenemos los materiales para empezar.'} Dos personas pueden completar las dos jornadas en un solo día.</p>
    ${state.phase === 'planning' ? `<p>Elige quién trabajará y selecciona «Reforzar el refugio» en sus tareas. Elegir una tarea no gasta materiales ni avanza el día.</p><div class="cv-builder-buttons">${state.people.map(person => `<button type="button" data-command="tasks" data-person="${person.id}">Elegir tarea de ${person.name}</button>`).join('')}</div>` : '<p>Podrás cambiar las tareas en la próxima mañana; la jornada actual ya está resuelta.</p>'}`}</article>
    <button type="button" data-command="route" data-route="camp">Volver al campamento</button></section>`;
}

export function renderWeekSummary(state: Caravan): string {
  const fullMeals = state.reports.filter(report => report.eaten === MOUTHS).length;
  const lowestHealth = Math.min(...state.people.map(person => person.health));
  const protectedNights = state.reports.filter(report => report.lines.some(line => line.includes('mantuvo secos'))).length;
  return `<section class="cv-panel cv-complete"><p class="cv-kicker">Primera semana · 7 de 28 días</p><h1 id="cv-title" tabindex="-1">Una semana junto al camino.</h1>
    <p>La rueda sigue rota, pero estos siete días ya tienen una historia propia.</p><div class="cv-week-stats"><div><strong>${fullMeals}/7 noches</strong><span>Todos pudieron comer</span></div><div><strong>${state.food} raciones</strong><span>${Math.floor(state.food / MOUTHS)} días completos de reserva</span></div><div><strong>${state.shelter === SHELTER_WORK ? 'Refugio terminado' : `Refugio ${state.shelter}/${SHELTER_WORK}`}</strong><span>${state.shelter === SHELTER_WORK ? 'Dormimos bajo techo reforzado' : 'El techo sigue siendo una necesidad'}</span></div></div>
    <p>${lowestHealth < 65 || state.people.some(person => person.fatigue >= 60) ? 'Recuperar al grupo sigue siendo una prioridad.' : 'El grupo conserva fuerzas para pensar en lo que viene.'} Ingredientes: ${state.ingredients} · Materiales: ${state.materials}.</p><p>El refugio nos mantuvo secos en ${protectedNights} de las 2 noches de lluvia.</p>
    <h2>Lo que nos dejó la semana</h2><ul><li>En la segunda noche elegimos cómo responder a los lobos.</li><li>${state.reports[2]?.lines.some(line => line.startsWith('Revisasteis')) ? 'Revisamos el carro abandonado y aprovechamos sus materiales.' : 'Dejamos pasar el carro abandonado para conservar fuerzas.'}</li><li>${state.shelter === SHELTER_WORK ? 'Construimos nuestro primer refugio reforzado.' : 'La lluvia nos enseñó por qué necesitamos mejorar el refugio.'}</li></ul>
    <p>El prototipo termina aquí. La partida queda guardada; los días 8–28 siguen pendientes.</p><div class="cv-dialog-actions"><button type="button" data-command="route" data-route="diary">Recordar lo que vivimos</button><button type="button" data-command="restart">Probar otra primera semana</button></div>
    <details><summary>Cómo terminó cada persona</summary><ul>${state.people.map(person => `<li>${html(person.name)}: salud ${person.health}/100, cansancio ${person.fatigue}/100.</li>`).join('')}</ul></details></section>`;
}
