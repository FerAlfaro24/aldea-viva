import type { VillageState } from '../game/models/village';
import { selectGuidance, type VillageAdvice } from '../game/selectors/guidance';
import { quantityLabel as q, html } from './format';
import { isGameOver } from '../game/selectors/survival';
import { renderWinterPlan } from './planning';

export function renderFirstSteps(village: VillageState): string {
  const guide = selectGuidance(village);
  if (isGameOver(village)) return `<section class="panel village-guide ending-panel"><p class="eyebrow">Memoria de la comunidad</p><h2 id="guide-title">${html(guide.advice.title)}</h2><p>${html(guide.advice.description)}</p>${renderAdviceButton(guide.advice)}<button type="button" class="text-button" data-action="navigate" data-route="slots">Fundar otra aldea →</button></section>`;
  const signed = (value: number) => `${value > 0 ? '+' : ''}${q(value)}`;
  const balance = guide.storage.free < guide.forecast.production.food ? 'El almacén limita la cosecha'
    : guide.minimumBalance >= 0 ? 'La comida puede crecer' : guide.maximumBalance < 0 ? 'Consumes más de lo que produces' : 'Comida muy ajustada';
  return `<section class="panel village-guide" aria-labelledby="guide-title"><p class="chapter-label">${html(guide.chapter)}</p><div class="section-heading"><p class="eyebrow">Tu siguiente paso</p><span class="guide-status">${html(balance)}</span></div>
    <h2 id="guide-title">${html(guide.advice.title)}</h2>${renderAdviceButton(guide.advice)}<p>${html(guide.advice.description)}</p>
    <div class="guide-figures"><span><strong>${signed(guide.minimumBalance)} a ${signed(guide.maximumBalance)}</strong> alimentos / día previstos</span><span><strong>${guide.forecast.daysWithoutHarvest.minimum ?? '—'} días</strong> de reserva sin cosechas</span></div>
    <p class="small-note">Producción prevista: ${q(guide.forecast.production.food)} · Consumo según tu ración: ${q(guide.forecast.minimum)}–${q(guide.forecast.maximum)}. Antes del límite del almacén.</p>
    ${village.elapsedDays === 0 ? `<details class="guide-progress"><summary>Después: preparar el primer invierno</summary>${renderWinterPlan(village)}</details>` : renderWinterPlan(village)}
    <details class="guide-progress"><summary>Tu progreso y cómo continuar</summary><ul>${guide.milestones.map((step) => `<li>${step.done ? '✓' : '○'} ${html(step.label)}</li>`).join('')}</ul><p>El invierno dura 84 días y apenas hay cosechas. Cubrir el consumo de hoy es el primer paso; después necesitas acumular reservas.</p><button type="button" class="text-button" data-action="navigate" data-route="help">Leer la guía completa →</button></details></section>`;
}

export function renderAdviceButton(advice: VillageAdvice): string {
  const attributes = advice.action === 'work' ? 'data-action="review-work"'
    : advice.action === 'delivery' ? 'data-action="guide-wood-delivery"'
    : advice.action === 'adjust' ? 'data-action="review-work-adjustments"'
    : advice.action === 'advance' ? `data-action="advance" data-days="${advice.days ?? 1}"`
      : advice.action === 'plot' ? `data-action="inspect-plot" data-plot="${html(advice.plotId ?? '')}"`
        : advice.action === 'build' ? `data-action="guide-build" data-plot="${html(advice.plotId ?? '')}" data-building="${advice.buildingType}"`
          : `data-action="navigate" data-route="${advice.route}"`;
  return `<button type="button" class="primary-button" ${attributes}>${html(advice.label)} →</button>`;
}

export function renderHelp(hasVillage: boolean): string {
  const link = (route: string, label: string) => `<button type="button" class="text-button" data-action="navigate" data-route="${hasVillage ? route : 'slots'}">${label} →</button>`;
  return `<header class="page-heading"><div><p class="eyebrow">Una guía para volver cuando haga falta</p><h1 id="page-title" tabindex="-1">Cómo cuidar tu aldea</h1></div><p>Candidata 1.0 · Guía opcional</p></header>
    <div class="help-grid"><section class="panel"><h2>1. Conoce a quienes han llegado</h2><p>Comienzas con familias, viviendas y reservas limitadas. Revisa edades, habilidades y parentescos. Todos empiezan sin oficio; cada nombramiento es una decisión tuya.</p><p>Edad mínima: agricultura 12, construcción 14, tala 15 y combate 16. Cumplir años habilita trabajos, sin asignarlos automáticamente. Los mayores pueden seguir trabajando si su condición lo permite.</p>${link('residents', 'Conocer habitantes')}</section>
    <section class="panel"><h2>2. Asegura comida antes de avanzar</h2><p>Ocupa los puestos de los huertos y consulta producción y consumo. La cosecha cambia con la estación; observa si tus reservas crecen lo suficiente para un invierno de 84 días. Ampliar los huertos pronto puede ser necesario.</p><p>La ración normal cubre la necesidad diaria cuando hay existencias. Reducida y emergencia ahorran comida a costa de acumular hambre; no son soluciones permanentes. Abundante favorece la recuperación, pero consume más.</p>${link('economy', 'Revisar alimentación')}</section>
    <section class="panel"><h2>3. Construye y conserva</h2><p>Los leñadores reúnen madera y los constructores realizan obras y reparaciones autorizadas. Preparar una obra reserva madera; se consume al comenzar el trabajo. Una pausa conserva el progreso. Cancelar después de iniciar no devuelve los materiales.</p><p>El almacén comparte espacio entre comida y madera: varios almacenes y una tala ajustada ayudan a guardar cosechas. Autoriza mantenimiento y deja madera disponible. Los destinos exclusivos se respetan; los flexibles solo atienden tareas autorizadas.</p>${link('buildings', 'Gestionar edificios')}</section>
    <section class="panel"><h2>4. Prepárate para los imprevistos</h2><p>Guerreros en la aldea ayudan a proteger el almacén; en el bosque ayudan a detectar amenazas y realizar salidas. Los indicios dan tiempo para prepararte. Durante un asalto, el tiempo y las órdenes quedan fijados hasta elegir.</p><p>Lee costes y riesgos: una probabilidad alta puede fallar. Las heridas requieren reposo y alimentación; las muertes son permanentes. Un aviso detiene un avance largo para que puedas intervenir.</p>${link('defense', 'Revisar defensa')}</section>
    <section class="panel"><h2>5. Deja que se forme su historia</h2><p>La práctica desarrolla habilidades y puede revelar talentos. Los sucesos importantes requieren una decisión; los aprendizajes pequeños se registran sin detenerte. Los visitantes son excepcionales: antes de aceptarlos verás cuántas camas faltan. Llegan sin oficio y necesitan comida.</p><p>No hay nacimientos ni reemplazos automáticos. La aldea continúa mientras viva alguien, incluso si solo quedan menores o ancianos. El registro conserva nombres, decisiones y consecuencias, con filtros y páginas.</p>${link('events', 'Consultar sucesos')}${link('chronicle', 'Leer la crónica')}</section>
    <section class="panel"><h2>6. Juega a tu ritmo</h2><p>Avanza 1, 7 o 28 días. El tiempo no corre mientras estás fuera. Cada decisión o avance se guarda en este navegador y esta dirección; hay tres espacios independientes.</p><p>Espera a que aparezca «Guardado». Ante un error, «Reintentar» guarda el mismo resultado. «Actualizar aplicación» instala la nueva versión sin borrar las partidas. Cuando veas «Disponible sin conexión», podrás volver a abrirla sin red.</p><p>Otro navegador, dispositivo o dirección tiene sus propios guardados. Evita borrar los datos del sitio si quieres conservar estas aldeas.</p>${link('slots', 'Volver a tus aldeas')}</section></div>`;
}
