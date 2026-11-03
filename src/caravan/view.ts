import { html } from '../ui/format';
import { constructionProblem, dayNumber, defenseChance, improvementsUnlocked, MOUTHS, SHELTER_COST, SHELTER_WORK, TASKS, taskUnavailable, WEEK_DAYS, type Caravan, type Person, type Task } from './model';
import { renderImprovements, renderWeekSummary, weatherLabel } from './week';

const specialty = { hunt: 'Buena cazadora', guard: 'Buen vigilante', cook: 'Buena cocinera' };
export const status = (person: Person) => `${person.health < 85 ? person.id === 'bruno' ? 'Herido' : 'Herida' : 'Salud estable'} · ${person.fatigue >= 60 ? 'Necesita descanso' : person.fatigue >= 30 ? 'Algo de cansancio' : 'Con fuerzas'}`;

export function suggestedTasks(state: Caravan): { person: Person; task: Task }[] {
  const result = state.people.map(person => ({ person, task: (person.health < 80 || person.fatigue >= 60 ? 'rest' : person.specialty) as Task }));
  if (improvementsUnlocked(state) && state.shelter < SHELTER_WORK && dayNumber(state) !== 6) {
    const worker = result.find(item => item.person.id === 'bruno' && item.task !== 'rest');
    if (worker) worker.task = state.shelter || state.materials >= SHELTER_COST ? 'build' : 'materials';
  }
  if (!state.ingredients && !result.some(item => item.task === 'hunt')) {
    const cook = result.find(item => item.task === 'cook');
    if (cook) cook.task = 'gather';
  }
  return result;
}

const scene = `<svg class="cv-scene" viewBox="0 0 320 130" aria-hidden="true"><path d="M8 113 Q80 100 145 113 T312 112" fill="none" stroke="var(--border)" stroke-width="2"/><path d="M38 107 55 55 72 107M258 107 280 39 304 107" fill="var(--surface-raised)"/><path d="M99 88V48q49-54 98 0v40" fill="var(--surface-raised)" stroke="var(--border-strong)" stroke-width="2"/><path d="M119 85V42m30 43V26m29 59V40" fill="none" stroke="var(--border)" stroke-width="2"/><path d="m91 86 112 6-5 11-103-5z" fill="var(--accent-fill)" stroke="var(--accent)"/><circle cx="113" cy="105" r="13" fill="var(--bg)" stroke="var(--gold)" stroke-width="3"/><path d="m113 92v26m-13-13h26m56-5 10 12m-8-5 11-10m-10 14 12 4" stroke="var(--gold)" stroke-width="2"/><path d="m199 98 36 7" stroke="var(--gold-border)" stroke-width="4"/><path d="m237 109 6-12 5 12-6 7z" fill="var(--gold)"/><path d="m230 117 24-1m-20-4 16 9" stroke="var(--gold-border)" stroke-width="3"/></svg>`;

function stocks(state: Caravan): string {
  return `<section class="cv-stocks" aria-label="Reservas del campamento">
    <div><span>Comida lista</span><strong data-food>${state.food} raciones</strong><small>${Math.floor(state.food / MOUTHS)} días completos · 4 bocas</small></div>
    <div><span>Por cocinar</span><strong>${state.ingredients} ingredientes</strong><small>Necesitan una persona cocinando</small></div>
    <div><span>Materiales</span><strong>${state.materials}</strong><small>Para los arreglos del campamento</small></div>
    <div><span>Protección prevista</span><strong>${state.people.some(person => person.task === 'guard') ? 'Con vigilancia' : 'Sin vigilancia'}</strong><small>Solo protege el campamento</small></div>
  </section>`;
}

function priority(state: Caravan): { title: string; text: string } {
  const recovering = state.people.find(person => person.health < 80 || person.fatigue >= 60);
  if (recovering) return { title: `${recovering.name} necesita recuperarse`, text: 'Descansar devuelve salud y fuerzas. Puedes cambiar las tareas antes de empezar.' };
  if (state.people.some(person => !person.task)) return { title: 'Reparte las tres tareas de hoy', text: 'Necesitamos conseguir comida, prepararla y proteger la caravana. Pulsa «Elegir tarea» en cada persona o revisa una sugerencia.' };
  if (state.food < 4) return { title: 'La comida de hoy depende de la búsqueda', text: 'Recolectar consigue raciones directamente. La carne necesita cocina. Los cuatro necesitamos 4 raciones al terminar el día.' };
  const finishedBuilders = state.people.filter(person => person.task === 'build' && state.shelter === SHELTER_WORK);
  if (finishedBuilders.length) return { title: 'El refugio ya está terminado', text: `${finishedBuilders.map(person => person.name).join(' y ')} puede cambiar de tarea. Ya no hace falta dedicar más jornadas a la obra.` };
  if (state.elapsedDays === 1 || state.elapsedDays === 5) return { title: 'Hay huellas cerca del campamento', text: 'Esta noche podría acercarse una amenaza. Vigilar ayuda a proteger al grupo; también puedes reservar comida para evitar un enfrentamiento.' };
  if (state.elapsedDays === 2) return { title: 'Ya puedes darte un pequeño respiro', text: 'Revisa las heridas y las reservas. Puedes dedicar una jornada a descansar o recoger materiales, si la comida lo permite.' };
  if (improvementsUnlocked(state) && state.shelter < SHELTER_WORK) return { title: 'Preparemos un techo para la lluvia', text: `En Mejoras puedes ver el refugio: necesita 4 materiales y 2 jornadas de trabajo. Llevamos ${state.shelter}/2. La lluvia llega los días 5 y 6.` };
  if (improvementsUnlocked(state)) return { title: state.elapsedDays === 6 ? 'Hoy toca cuidar lo conseguido' : 'Nuestro refugio ya nos protege', text: 'El techo ayuda a recuperar fuerzas. Revisa reservas y cansancio: hoy puedes repartir el trabajo pensando en lo que más necesita el grupo.' };
  return { title: 'Primero, asegurar la cena', text: 'Tienes comida para empezar. Cazar y cocinar crea reservas; recolectar permite comer sin cocina. La primera noche será tranquila.' };
}

function cards(state: Caravan): string {
  return `<section class="cv-people" aria-label="Tus tres acompañantes">${state.people.map(person => `<article class="cv-person">
    <div class="cv-person-heading"><span class="cv-avatar" aria-hidden="true">${person.name[0]}</span><div><h2>${person.name}</h2><span>${person.age} años · ${specialty[person.specialty]}</span></div></div>
    <p class="cv-condition${person.health < 85 ? ' cv-warning' : ''}">${status(person)}</p>
    <div class="cv-vitals"><span>Salud <strong>${person.health}/100</strong></span><span>Cansancio <strong>${person.fatigue}/100</strong></span></div>
    <p class="cv-assignment">Hoy: <strong>${person.task ? TASKS[person.task].name : 'Sin tarea'}</strong></p>
    <button type="button" data-command="tasks" data-person="${person.id}" aria-label="${person.task ? 'Cambiar' : 'Elegir'} tarea de ${person.name}">${person.task ? 'Cambiar tarea' : 'Elegir tarea'}</button>
  </article>`).join('')}</section>`;
}

function plan(state: Caravan): string {
  const missing = state.people.filter(person => !person.task);
  const invalid = state.people.filter(person => person.task && taskUnavailable(person, person.task, state));
  const problem = constructionProblem(state);
  const hasHunter = state.people.some(person => person.task === 'hunt');
  const cooks = state.people.filter(person => person.task === 'cook');
  const builders = state.people.filter(person => person.task === 'build').length;
  const workNote = !problem && !invalid.length && builders ? ` Refugio: ${state.shelter}/2 → ${Math.min(2, state.shelter + builders)}/2 hoy.${state.shelter === 0 ? ' Se utilizarán 4 materiales.' : ' Sin gastar más materiales.'}${builders > SHELTER_WORK - state.shelter ? ' Hay más trabajadores que jornadas pendientes.' : ''}` : '';
  const note = invalid.length ? `${invalid.map(person => person.name).join(', ')} necesita cambiar de tarea o descansar.`
    : missing.length ? `Falta elegir la tarea de ${missing.map(person => person.name).join(', ')}.`
      : problem ? problem
      : cooks.length && !hasHunter && !state.ingredients ? 'Tu cocina no tendrá ingredientes. Recolectar permite conseguir comida lista.'
        : hasHunter && !cooks.length ? 'La carne quedará sin preparar. Necesitas cocinarla otro día para poder comerla.'
          : state.food < 4 ? 'Hoy dependemos de lo que consigamos para comer. Revisa el reparto.'
            : `La cena de hoy está cubierta. ${hasHunter && cooks.length ? 'La cocina podrá aprovechar la carne de hoy.' : 'Puedes planificar pensando en mañana.'}`;
  return `<footer class="cv-daybar"><div><strong>El plan del día ${dayNumber(state)}</strong><span>${html(note + workNote)}</span></div><button class="primary-button" type="button" data-command="start"${missing.length || invalid.length || problem ? ' disabled' : ''}>Comenzar el día ${dayNumber(state)}</button></footer>`;
}

function decision(state: Caravan): string {
  const day = state.reports.at(-1)!.day;
  if (state.pending === 'wolves') return `<section class="cv-panel cv-decision" aria-labelledby="decision-title"><p class="cv-kicker">Día ${day} · Antes de cenar</p><h1 id="decision-title" tabindex="-1">Ojos junto al camino</h1>
    <p>Unos lobos se acercan a las provisiones. Las tareas de hoy ya terminaron; ahora decides cómo pasar la noche.</p>
    <div class="cv-choices"><button type="button" data-command="choice" data-choice="stand"><strong>Ahuyentarlos</strong><span>${Math.round(defenseChance(state) * 100)} % de éxito con tu reparto. Puede haber heridas incluso al proteger las reservas. Si falla: hasta 4 raciones perdidas y una herida.</span></button>
    <button type="button" data-command="choice" data-choice="distract"${state.food < 2 ? ' disabled' : ''}><strong>Alejarlos con comida · 2 raciones</strong><span>Sin enfrentamiento ni heridas. Quedarán ${Math.max(0, state.food - 2)} raciones antes de la cena de cuatro personas.${state.food < 6 ? ' No alcanzará para que todos coman hoy.' : ''}</span></button></div></section>`;
  return `<section class="cv-panel cv-decision" aria-labelledby="decision-title"><p class="cv-kicker">Día ${day} · De regreso al campamento</p><h1 id="decision-title" tabindex="-1">Un carro entre la maleza</h1><p>Descubrís restos de otro carro junto al camino. Parece abandonado. La cocina de hoy ya terminó.</p><div class="cv-choices">
    <button type="button" data-command="choice" data-choice="salvage"><strong>Revisarlo juntos</strong><span>+3 materiales y +2 ingredientes para otro día. Todos suman 10 de cansancio. Los materiales servirán para arreglar el refugio desde el día 4.</span></button>
    <button type="button" data-command="choice" data-choice="leave"><strong>Conservar las fuerzas</strong><span>Sin recursos nuevos. Todos reducen 10 de cansancio.</span></button></div></section>`;
}

function report(state: Caravan, index: number): string {
  const entry = state.reports[index]!;
  return `<article class="cv-report"><h2>Día ${entry.day} · ${entry.eaten === 4 ? 'Todos pudimos comer' : 'Una cena incompleta'}</h2><ul>${entry.lines.map(line => `<li>${html(line)}</li>`).join('')}</ul>${entry.reactions.length ? `<aside class="cv-reactions" aria-label="Lo que dice el grupo">${entry.reactions.map(reaction => `<p>${html(reaction)}</p>`).join('')}</aside>` : ''}${index === state.reports.length - 1 ? `<p class="cv-balance">Comida lista: <strong>${entry.foodBefore} → ${state.food} raciones</strong> · Ingredientes: ${entry.ingredientsBefore} → ${state.ingredients}</p>` : ''}</article>`;
}

export function renderCaravan(state: Caravan | null, route: string): string {
  if (!state) return `<section class="cv-intro">${scene}<p class="cv-kicker">Aldea Viva · Un comienzo más pequeño</p><h1>La rueda se rompió.<br>La historia empieza aquí.</h1><p>La caravana no puede continuar. Lucía, Bruno e Inés cuentan contigo para organizar el campamento.</p><p>Cuatro personas comerán de las reservas. Tú eliges las tareas de tus tres acompañantes; cada jornada avanza cuando tú decidas.</p><button class="primary-button" type="button" data-command="create">Empezar nuestra historia</button><small>Primera semana: 7 días jugables · Guardado automático separado de tus aldeas</small></section>`;
  if (route === 'improvements' && improvementsUnlocked(state)) return renderImprovements(state);
  if (route === 'diary') return `<section class="cv-panel"><p class="cv-kicker">Nuestra historia</p><h1 id="cv-title" tabindex="-1">Diario del camino</h1>${state.reports.filter(entry => entry.day <= state.elapsedDays).map((_, index) => report(state, index)).join('') || '<p>La rueda rota nos obligó a detenernos. Todavía no hemos completado la primera jornada.</p>'}</section>`;
  if (route === 'options') return `<section class="cv-panel"><h1 id="cv-title" tabindex="-1">Tu partida</h1><p>El progreso se guarda al confirmar cada acción en este navegador. Cerrar el juego no hace pasar el tiempo.</p><p>Los guardados de la caravana y de las aldeas son independientes. No hemos convertido tus partidas anteriores.</p><p><a href="?modo=aldea">Abrir el juego anterior y mis aldeas</a></p><h2>Qué incluye este comienzo</h2><p>Siete días, seis tareas iniciales y la construcción del refugio desde el día 4. Comida, cocina, heridas, descanso, lluvia y decisiones. Los días 8–28 siguen pendientes.</p><p>Recuperar fuerzas: descansar devuelve hasta 18 de salud y reduce hasta 45 de cansancio. Con menos de 65 de salud no puedes cazar; con 85 de cansancio o salud inferior a 25 necesitas descansar. No hay fallecimientos en este prototipo.</p><button type="button" data-command="restart">Empezar otra caravana</button></section>`;
  if (state.phase === 'decision') return `${stocks(state)}${decision(state)}<details class="cv-panel"><summary>Qué hicimos hoy</summary><ul>${state.reports.at(-1)!.lines.map(line => `<li>${html(line)}</li>`).join('')}</ul></details>`;
  if (state.phase === 'summary') return `<section class="cv-panel"><p class="cv-kicker">La jornada ha terminado</p><h1 id="cv-title" tabindex="-1">Así pasamos el día ${state.elapsedDays}</h1>${report(state, state.reports.length - 1)}<p>${html(state.elapsedDays === WEEK_DAYS ? 'La primera semana queda guardada. Es momento de mirar lo que conseguimos y lo que falta.' : priority(state).title)}</p><button class="primary-button" type="button" data-command="next">${state.elapsedDays === WEEK_DAYS ? 'Ver nuestra primera semana' : `Ir a la mañana del día ${state.elapsedDays + 1}`}</button></section>`;
  if (state.phase === 'complete') return renderWeekSummary(state);
  const guide = priority(state);
  return `<div class="cv-overview">${stocks(state)}<p class="cv-weather">${weatherLabel(state)}</p><section class="cv-situation"><div><h1 id="cv-title" tabindex="-1">${html(guide.title)}</h1><p>${html(guide.text)}</p>${improvementsUnlocked(state) && state.shelter < SHELTER_WORK ? '<button type="button" data-command="route" data-route="improvements">Ver mejora del refugio</button>' : ''}</div>${scene}</section></div><div class="cv-section-heading"><h2>Tres personas. Tú eliges el plan.</h2><button type="button" data-command="suggest">Sugerir reparto</button></div>${cards(state)}${plan(state)}`;
}

export function renderTasks(state: Caravan, personId: string): string {
  const person = state.people.find(person => person.id === personId)!;
  return `<p class="cv-kicker">Día ${dayNumber(state)} · ${person.name}</p><h2 id="cv-dialog-title">¿Qué hará hoy?</h2><p>${status(person)} · Salud ${person.health}/100 · Cansancio ${person.fatigue}/100</p><div class="cv-task-grid">${(Object.entries(TASKS) as [Task, typeof TASKS[Task]][]).filter(([task]) => task !== 'build' || improvementsUnlocked(state)).map(([task, info]) => {
    const unavailable = taskUnavailable(person, task, state);
    return `<button type="button" data-command="assign" data-person="${person.id}" data-task="${task}"${unavailable ? ' disabled' : ''}${person.task === task ? ' aria-pressed="true"' : ''}><strong>${info.name}${person.specialty === task ? ' · Su especialidad' : ''}</strong><span>${html(unavailable ?? info.description)}</span></button>`;
  }).join('')}</div><button type="button" data-command="close-dialog">Volver sin cambiar</button>`;
}
