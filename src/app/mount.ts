import { activeVillage, EMPTY_FILTERS } from './session';
import { PersistentSession } from './persistence';
import { IndexedDbSaveRepository } from '../storage/indexedDb';
import { registerOffline } from './offline';
import type { OfflineState } from './offline';
import type { ResidentFilters, Route, SessionAction, SlotId } from './session';
import { getCalendarDate } from '../game/core/calendar';
import { dateLabel, html, SEASON_NAMES } from '../ui/format';
import { renderResident, renderResidentResults, renderResidents } from '../ui/residents';
import { renderChronicle, renderSlots, renderVillage } from '../ui/village';
import { renderWelcome } from '../ui/welcome';

function slotId(value: string | undefined): SlotId {
  if (value === '1' || value === '2' || value === '3') return Number(value) as SlotId;
  throw new Error('Elige uno de los tres espacios de aldea.');
}

function newSeed(): string {
  const values = crypto.getRandomValues(new Uint32Array(2));
  return `aldea-${values[0]?.toString(36)}-${values[1]?.toString(36)}`;
}

const ROUTES: readonly Route[] = ['home', 'slots', 'village', 'residents', 'resident', 'chronicle'];

export function mountApp(root: HTMLElement): () => void {
  const storage = new PersistentSession(new IndexedDbSaveRepository());
  let session = storage.snapshot.session;
  let errorMessage = '';
  let notice = '';
  let targetSlot: SlotId = 1;
  let dialogTrigger: HTMLElement | null = null;
  let offlineState: OfflineState = { ready: false, update: false, error: false };
  const offlineMessage = () => offlineState.ready || offlineState.error || offlineState.update ? `<aside class="offline-notice">${offlineState.error ? 'No se pudo preparar el modo sin conexión. El guardado local sigue disponible.' : offlineState.ready ? 'Disponible sin conexión en este dispositivo.' : ''}${offlineState.update ? ' <button type="button" data-action="update-app">Actualizar aplicación</button>' : ''}</aside>` : '';

  const showError = (error: unknown) => {
    errorMessage = error instanceof Error ? error.message : 'No se pudo completar la acción.';
    const output = root.querySelector<HTMLElement>('#app-error');
    if (output) { output.hidden = false; output.textContent = errorMessage; }
  };

  const render = () => {
    session = storage.snapshot.session;
    const { phase, error } = storage.snapshot;
    const ready = phase === 'ready';
    const saveLabel = phase === 'saving' ? 'Guardando…' : phase === 'loading' ? 'Leyendo partidas…' : phase === 'save-error' ? 'Sin guardar' : phase === 'load-error' ? 'Lectura pendiente' : storage.hasSavedVillages ? 'Guardado' : 'Sin partidas';
    const recovery = error ? `<aside class="storage-notice" role="alert"><p>${html(error)}</p>${phase === 'save-error' ? '<p>El cambio pendiente todavía no está aplicado. Reintentar guarda exactamente ese cambio.</p><button type="button" data-action="retry-save">Reintentar guardado</button><button type="button" data-action="discard-pending">Descartar cambio pendiente y releer</button>' : '<button type="button" data-action="reload-saves">Reintentar lectura</button>'}</aside>` : '';
    const village = activeVillage(session);
    const inGame = session.route !== 'home' && session.route !== 'slots' && village !== null;
    const header = `<div class="shell-top"><header class="game-header"><button type="button" class="brand-button" data-action="navigate" data-route="home" aria-label="Aldea Viva, ir al inicio"><span class="wordmark">AV<span aria-hidden="true">.</span></span><span>Aldea Viva</span></button>
      ${inGame ? `<div class="game-date"><strong>${html(SEASON_NAMES[getCalendarDate(village.elapsedDays).season])}</strong><span data-current-date>${html(dateLabel(village.elapsedDays))}</span></div>` : '<span class="muted header-subtitle">Primeros habitantes</span>'}
      <span class="memory-badge" role="status">${saveLabel}</span></header>
      <p class="session-notice">Guardado automático en este navegador · El tiempo no avanza al cerrar.</p>
      <nav class="game-nav" aria-label="Secciones del juego">${(village ? [['village', 'Aldea'], ['residents', 'Habitantes'], ['chronicle', 'Registro'], ['slots', 'Tus aldeas']] : [['slots', 'Tus aldeas'], ['home', 'Inicio']]).map(([route, label]) => `<button type="button" data-action="navigate" data-route="${route}"${session.route === route || (route === 'residents' && session.route === 'resident') ? ' aria-current="page"' : ''}>${label}</button>`).join('')}</nav></div>`;
    let content: string;
    switch (session.route) {
      case 'home': content = renderWelcome(village !== null); break;
      case 'slots': content = renderSlots(session, storage.snapshot.slots); break;
      case 'village': content = village ? renderVillage(village) : renderSlots(session); break;
      case 'residents': content = village ? renderResidents(village, session.filters) : renderSlots(session); break;
      case 'resident': content = village && session.selectedResidentId ? renderResident(village, session.selectedResidentId) : renderSlots(session); break;
      case 'chronicle': content = village ? renderChronicle(village) : renderSlots(session); break;
    }
    const advanceNotice = phase === 'save-error' ? 'Cambio pendiente de guardar.' : phase === 'saving' ? 'Guardando el cambio…' : notice || 'Cada día cuenta.';
    const timeControls = inGame ? `<footer class="time-controls"><div><strong>Avanzar tiempo</strong><span id="advance-notice" role="status">${html(advanceNotice)}</span></div><div class="advance-buttons">${([1, 7, 28] as const).map((days) => `<button type="button" data-action="advance" data-days="${days}"${village.pendingDecision ? ' disabled' : ''}>+${days} ${days === 1 ? 'día' : 'días'}</button>`).join('')}</div></footer>` : '';
    root.innerHTML = `${session.route === 'home' ? '' : '<a class="skip-link" href="#game-content">Saltar al contenido</a>'}<div id="app-error" class="app-error" role="alert"${errorMessage ? '' : ' hidden'}>${html(errorMessage)}</div>
      ${recovery}<p class="storage-status" role="status">${html(phase === 'loading' || phase === 'saving' ? saveLabel : '')}</p>
      <div id="offline-message">${offlineMessage()}</div>
      ${session.route === 'home' ? content : `<div class="game-shell">${header}<p class="orientation-hint">En móvil, gira la pantalla para explorar la aldea con más espacio.</p><main class="game-content" id="game-content" tabindex="-1">${content}</main>${timeControls}</div>`}
      <dialog id="create-dialog" class="create-dialog" aria-labelledby="create-title" aria-describedby="create-description"><form id="create-village-form"><p class="eyebrow" id="create-slot-label"></p><h2 id="create-title">Fundar una aldea</h2><p id="create-description"></p><label for="seed-input">Semilla opcional</label><input id="seed-input" name="seed" maxlength="128" placeholder="Ej. el-primer-arroyo" autocomplete="off" /><p class="small-note">La misma semilla crea los mismos habitantes y familias iniciales. Déjala vacía para elegir una nueva.</p><p class="small-note">La aldea aparecerá cuando se confirme su guardado.</p><p id="create-error" class="app-error" role="alert" hidden></p><div class="dialog-actions"><button type="button" data-action="cancel-create">Cancelar</button><button type="submit" class="primary-button" id="create-submit">Fundar aldea</button></div></form></dialog>`;
    if (!ready) root.querySelectorAll<HTMLButtonElement | HTMLInputElement | HTMLSelectElement>('button,input,select').forEach((element) => {
      if (!['retry-save', 'discard-pending', 'reload-saves'].includes(element.dataset.action ?? '')) element.disabled = true;
    });
    root.querySelector<HTMLDialogElement>('#create-dialog')?.addEventListener('close', () => dialogTrigger?.focus());
  };

  const dispatch = async (action: SessionAction, focusHeading = true) => {
    const previousDay = activeVillage(session)?.elapsedDays ?? 0;
    if (action.type === 'create' || action.type === 'advance' || action.type === 'delete') await storage.perform(action);
    else storage.read(action);
    const next = storage.snapshot.session;
    if (action.type === 'advance') {
      const processed = (activeVillage(next)?.elapsedDays ?? previousDay) - previousDay;
      notice = processed > 0
        ? `${processed} ${processed === 1 ? 'día transcurrido' : 'días transcurridos'} · Guardado.`
        : 'Avance detenido: hay una decisión pendiente.';
    }
    session = next;
    errorMessage = '';
    render();
    if (focusHeading) {
      window.scrollTo(0, 0);
      root.querySelector<HTMLElement>('#page-title, #game-title')?.focus({ preventScroll: true });
    }
  };

  const openCreate = (slot: SlotId, trigger: HTMLElement) => {
    targetSlot = slot;
    dialogTrigger = trigger;
    const occupied = session.slots[slot] !== null;
    const dialog = root.querySelector<HTMLDialogElement>('#create-dialog');
    if (!dialog) throw new Error('No se pudo abrir la creación de aldea.');
    const setText = (selector: string, text: string) => {
      const element = dialog.querySelector<HTMLElement>(selector);
      if (element) element.textContent = text;
    };
    setText('#create-slot-label', `Espacio ${slot}`);
    setText('#create-title', occupied ? 'Reemplazar esta aldea' : 'Fundar una aldea');
    setText('#create-description', occupied ? 'Este espacio ya tiene una aldea. Al reemplazarla perderás sus habitantes y su progreso. Cancelar conserva todo.' : 'Una comunidad comenzará su historia el primer día de primavera.');
    setText('#create-submit', occupied ? 'Reemplazar aldea' : 'Fundar aldea');
    const input = dialog.querySelector<HTMLInputElement>('#seed-input');
    if (input) input.value = '';
    const error = dialog.querySelector<HTMLElement>('#create-error');
    if (error) error.hidden = true;
    dialog.showModal();
    input?.focus();
  };

  const onClick = async (event: MouseEvent) => {
    const element = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-action]') : null;
    if (!element || !root.contains(element)) return;
    try {
      switch (element.dataset.action) {
        case 'update-app': offline.activate(); break;
        case 'navigate': {
          const route = element.dataset.route;
          if (!ROUTES.includes(route as Route)) throw new Error('Sección desconocida.');
          await dispatch({ type: 'navigate', route: route as Route });
          break;
        }
        case 'new': openCreate(slotId(element.dataset.slot), element); break;
        case 'cancel-create': root.querySelector<HTMLDialogElement>('#create-dialog')?.close(); break;
        case 'continue': notice = ''; await dispatch({ type: 'continue', slot: slotId(element.dataset.slot) }); break;
        case 'inspect': await dispatch({ type: 'inspect', id: element.dataset.person ?? '' }); break;
        case 'retry-save': await storage.retry(); notice = 'Cambio pendiente guardado.'; render(); break;
        case 'discard-pending': if (window.confirm('¿Descartar el cambio que no pudo guardarse y recuperar las últimas partidas confirmadas?')) { notice = ''; await storage.discardPending(); } break;
        case 'reload-saves': await storage.load(true); break;
        case 'delete': {
          const slot = slotId(element.dataset.slot);
          if (window.confirm(`¿Borrar la aldea del espacio ${slot}? Se perderá su progreso. Los otros espacios se conservan.`)) await dispatch({ type: 'delete', slot, confirmed: true });
          break;
        }
        case 'family':
          storage.read({ type: 'filter', filters: { ...EMPTY_FILTERS, family: element.dataset.family ?? '' } }, false);
          await dispatch({ type: 'navigate', route: 'residents' }); break;
        case 'unhoused':
          storage.read({ type: 'filter', filters: { ...EMPTY_FILTERS, housing: 'unhoused' } }, false);
          await dispatch({ type: 'navigate', route: 'residents' }); break;
        case 'clear-filters': await dispatch({ type: 'filter', filters: { ...EMPTY_FILTERS } }, false); root.querySelector<HTMLInputElement>('[data-filter="search"]')?.focus(); break;
        case 'advance': {
          const days = Number(element.dataset.days);
          if (days !== 1 && days !== 7 && days !== 28) throw new Error('Avance no permitido.');
          await dispatch({ type: 'advance', days }, false);
          root.querySelector<HTMLButtonElement>(`[data-days="${days}"]`)?.focus({ preventScroll: true });
          break;
        }
      }
    } catch (error) {
      if (storage.snapshot.phase === 'save-error') root.querySelector<HTMLButtonElement>('[data-action="retry-save"]')?.focus();
      else showError(error);
    }
  };

  const onFilter = (event: Event) => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement || input instanceof HTMLSelectElement)) return;
    const key = input.dataset.filter;
    if (!key || !(key in EMPTY_FILTERS)) return;
    // Las opciones enumeradas proceden de los selectores locales del formulario.
    const filters = { [key]: input.value } as Partial<ResidentFilters>;
    if (storage.snapshot.phase !== 'ready') return;
    storage.read({ type: 'filter', filters }, false);
    session = storage.snapshot.session;
    const village = activeVillage(session);
    const results = root.querySelector<HTMLElement>('#resident-results');
    if (village && results) results.innerHTML = renderResidentResults(village, session.filters);
  };

  const onSubmit = async (event: SubmitEvent) => {
    event.preventDefault();
    if (!(event.target instanceof HTMLFormElement) || event.target.id !== 'create-village-form') return;
    const input = root.querySelector<HTMLInputElement>('#seed-input');
    const raw = input?.value ?? '';
    try {
      notice = '';
      await dispatch({ type: 'create', slot: targetSlot, seed: raw.trim().length ? raw : newSeed(), confirmReplacement: session.slots[targetSlot] !== null });
    } catch (error) {
      if (storage.snapshot.phase === 'save-error') {
        root.querySelector<HTMLButtonElement>('[data-action="retry-save"]')?.focus();
        return;
      }
      const output = root.querySelector<HTMLElement>('#create-error');
      if (output) { output.hidden = false; output.textContent = error instanceof Error ? error.message : 'No se pudo crear la aldea.'; }
    }
  };

  const beforeUnload = (event: BeforeUnloadEvent) => {
    if (storage.hasUnsavedChanges) {
      event.preventDefault();
      event.returnValue = '';
    }
  };
  root.addEventListener('click', onClick);
  root.addEventListener('input', onFilter);
  root.addEventListener('submit', onSubmit);
  window.addEventListener('beforeunload', beforeUnload);
  const unsubscribe = storage.subscribe(render);
  const offline = registerOffline((state) => {
    offlineState = state;
    const output = root.querySelector('#offline-message');
    if (output) output.innerHTML = offlineMessage();
    const button = output?.querySelector<HTMLButtonElement>('button');
    if (button) button.disabled = storage.snapshot.phase !== 'ready';
  }, () => storage.snapshot.phase === 'ready' && !storage.hasUnsavedChanges);
  render();
  void storage.load();
  return () => {
    root.removeEventListener('click', onClick);
    root.removeEventListener('input', onFilter);
    root.removeEventListener('submit', onSubmit);
    window.removeEventListener('beforeunload', beforeUnload);
    unsubscribe();
    storage.dispose();
    offline.dispose();
  };
}
