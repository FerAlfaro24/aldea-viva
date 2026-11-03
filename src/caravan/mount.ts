import { registerOffline, type OfflineState } from '../app/offline';
import { html } from '../ui/format';
import { act, createCaravan, improvementsUnlocked, TASKS, type Caravan, type Choice, type Task } from './model';
import { CaravanRepository } from './storage';
import { renderCaravan, renderTasks, suggestedTasks } from './view';

export function mountCaravan(root: HTMLElement): () => void {
  const repository = new CaravanRepository();
  let state: Caravan | null = null;
  let pending: Caravan | null = null;
  let loaded = false;
  let busy = false;
  let disposed = false;
  let error = '';
  let route = 'camp';
  let dialogPerson: string | null = null;
  let offlineState: OfflineState = { ready: false, update: false, error: false };

  const render = () => {
    if (disposed) return;
    const navigation = [['camp', 'Campamento'], ...(state && improvementsUnlocked(state) ? [['improvements', 'Mejoras']] : []), ['diary', 'Diario'], ['options', 'Opciones']];
    root.innerHTML = `<div class="cv-shell"><a class="skip-link" href="#cv-main">Saltar al campamento</a><header class="cv-header"><a class="cv-brand" href="?">AV<span>.</span> <span>Aldea Viva</span></a><span class="cv-prototype">Caravana · Primera semana</span><span class="cv-save" role="status">${busy ? 'Guardando…' : !loaded ? 'Lectura pendiente' : pending ? 'Sin guardar' : state ? 'Guardado' : 'Nueva historia'}</span></header>
      ${state ? `<nav class="cv-nav" aria-label="Secciones de la caravana">${navigation.map(([value, name]) => `<button type="button" data-command="route" data-route="${value}"${value === route ? ' aria-current="page"' : ''}>${name}</button>`).join('')}</nav>` : ''}
      ${error ? `<aside class="cv-error" role="alert"><p>${html(error)}</p>${pending ? '<p>El cambio aún no se aplicó. Reintentar guarda el mismo resultado, sin repetir la jornada.</p><button type="button" data-command="retry">Reintentar guardado</button>' : ''}<button type="button" data-command="reload">${pending ? 'Descartar cambio pendiente y releer' : 'Reintentar lectura'}</button></aside>` : ''}
      <main id="cv-main" class="cv-main" tabindex="-1">${loaded ? renderCaravan(state, route) : '<section class="cv-panel"><h1>Preparando el camino</h1><p>Estamos leyendo tu partida. Las aldeas anteriores se conservan aparte.</p></section>'}</main>
      <div class="cv-offline" role="status">${offlineState.error ? 'No se pudo preparar el acceso sin conexión.' : offlineState.ready ? 'Disponible sin conexión en este dispositivo.' : ''}${offlineState.update ? '<button type="button" data-command="update">Actualizar aplicación</button>' : ''}</div>
      <dialog id="cv-dialog" class="cv-dialog" aria-labelledby="cv-dialog-title"></dialog></div>`;
    root.querySelectorAll<HTMLButtonElement>('button').forEach(button => {
      if (busy || (!loaded && button.dataset.command !== 'reload') || (pending && !['retry', 'reload'].includes(button.dataset.command ?? ''))) button.disabled = true;
    });
  };

  const load = async () => {
    loaded = false; error = ''; render();
    try { state = await repository.read(); pending = null; loaded = true; }
    catch (reason) { error = reason instanceof Error ? reason.message : 'No se pudo leer tu partida.'; }
    render();
  };

  const save = async (candidate: Caravan) => {
    busy = true; pending = candidate; error = ''; render();
    try { await repository.write(candidate, state); state = candidate; pending = null; }
    catch (reason) { error = reason instanceof Error ? reason.message : 'No se pudo guardar. Tu partida anterior se conserva.'; }
    finally { busy = false; render(); }
    root.querySelector<HTMLElement>('#decision-title, #cv-title, #cv-main')?.focus({ preventScroll: true });
  };

  const openDialog = (content: string) => {
    const dialog = root.querySelector<HTMLDialogElement>('#cv-dialog')!;
    dialog.innerHTML = content;
    dialog.showModal();
  };

  const click = async (event: MouseEvent) => {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-command]') : null;
    if (!button || !root.contains(button) || button.disabled || busy) return;
    try {
      const command = button.dataset.command;
      if (command === 'reload') { await load(); return; }
      if (command === 'retry' && pending) { await save(pending); return; }
      if (pending || !loaded) return;
      if (command === 'create' && !state) {
        const id = crypto.randomUUID();
        await save(createCaravan(`caravana-${id}`, id)); return;
      }
      if (command === 'update') { offline.activate(); return; }
      if (!state) return;
      if (command === 'restart') {
        openDialog('<h2 id="cv-dialog-title">¿Empezar otra caravana?</h2><p>Reemplazará únicamente la partida actual de la caravana, incluido su diario. Tus aldeas anteriores se conservarán. Podrás probar otras decisiones desde el día 1.</p><div class="cv-dialog-actions"><button type="button" data-command="close-dialog">Conservar mi partida</button><button class="primary-button" type="button" data-command="confirm-restart">Reemplazar y empezar</button></div>'); return;
      }
      if (command === 'confirm-restart') {
        const id = crypto.randomUUID();
        const candidate = createCaravan(`caravana-${id}`, id);
        candidate.revision = state.revision + 1;
        route = 'camp'; await save(candidate); window.scrollTo(0, 0); return;
      }
      if (command === 'route') {
        route = button.dataset.route ?? 'camp'; render(); window.scrollTo(0, 0);
        root.querySelector<HTMLElement>('#cv-title, #cv-main')?.focus({ preventScroll: true }); return;
      }
      if (command === 'tasks' && state.phase === 'planning') {
        dialogPerson = button.dataset.person!; openDialog(renderTasks(state, dialogPerson)); return;
      }
      if (command === 'suggest' && state.phase === 'planning') {
        openDialog(`<h2 id="cv-dialog-title">Una propuesta para hoy</h2><p>Busca comida, protección, recuperación y, desde el día 4, preparar el refugio. Revisa el reparto; puedes cambiar cualquier tarea después.</p><ul>${suggestedTasks(state).map(({ person, task }) => `<li><strong>${person.name}:</strong> ${TASKS[task].name}<p>${TASKS[task].description}</p></li>`).join('')}</ul><div class="cv-dialog-actions"><button type="button" data-command="close-dialog">Volver sin cambiar</button><button class="primary-button" type="button" data-command="apply-suggestion">Aplicar este reparto</button></div>`); return;
      }
      if (command === 'close-dialog') { root.querySelector<HTMLDialogElement>('#cv-dialog')?.close(); return; }
      if (command === 'assign') {
        dialogPerson = button.dataset.person!;
        route = 'camp';
        await save(act(state, { type: 'assign', personId: dialogPerson, task: button.dataset.task as Task }));
        root.querySelector<HTMLButtonElement>(`[data-command="tasks"][data-person="${dialogPerson}"]`)?.focus(); return;
      }
      if (command === 'apply-suggestion' && state.phase === 'planning') {
        const candidate = structuredClone(state);
        for (const { person, task } of suggestedTasks(state)) candidate.people.find(item => item.id === person.id)!.task = task;
        candidate.revision++; await save(candidate); return;
      }
      if (command === 'start' || command === 'next') { await save(act(state, { type: command })); window.scrollTo(0, 0); }
      if (command === 'choice') { await save(act(state, { type: 'choose', choice: button.dataset.choice as Choice })); window.scrollTo(0, 0); }
    } catch (reason) { error = reason instanceof Error ? reason.message : 'No se pudo completar la acción.'; render(); }
  };
  const beforeUnload = (event: BeforeUnloadEvent) => { if (busy || pending) { event.preventDefault(); event.returnValue = ''; } };
  const offline = registerOffline((next) => { offlineState = next; if (!busy && !root.querySelector<HTMLDialogElement>('#cv-dialog')?.open) render(); }, () => !busy && !pending && loaded);
  root.addEventListener('click', click);
  window.addEventListener('beforeunload', beforeUnload);
  void load();
  return () => { disposed = true; root.removeEventListener('click', click); window.removeEventListener('beforeunload', beforeUnload); offline.dispose(); void repository.close(); };
}
