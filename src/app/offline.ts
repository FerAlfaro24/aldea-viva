export interface OfflineState {
  readonly ready: boolean;
  readonly update: boolean;
  readonly error: boolean;
}

export function registerOffline(onChange: (state: OfflineState) => void, canReload: () => boolean): { activate(): void; dispose(): void } {
  let registration: ServiceWorkerRegistration | null = null;
  let disposed = false;
  let ready = false;
  let activating = false;
  const notify = (error = false) => { if (!disposed) onChange({ ready, update: Boolean(registration?.waiting), error }); };
  const onController = () => { if (activating && canReload()) window.location.reload(); };
  if (import.meta.env.PROD && 'serviceWorker' in navigator && window.isSecureContext) {
    navigator.serviceWorker.addEventListener('controllerchange', onController);
    void navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`, { updateViaCache: 'none' }).then((result) => {
      registration = result;
      notify();
      result.addEventListener('updatefound', () => {
        result.installing?.addEventListener('statechange', () => { notify(); });
      });
      void navigator.serviceWorker.ready.then(() => { ready = true; notify(); });
    }).catch(() => { notify(true); });
  }
  return {
    activate() {
      if (!canReload() || !registration?.waiting) return;
      activating = true;
      registration.waiting.postMessage('ACTIVATE_UPDATE');
    },
    dispose() { disposed = true; navigator.serviceWorker?.removeEventListener('controllerchange', onController); },
  };
}
