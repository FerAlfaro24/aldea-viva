import { SLOT_IDS } from '../game/models/save';
import type { SaveEnvelope, SlotId } from '../game/models/save';
import type { SaveExpectation, SaveRepository, SlotStatus } from '../storage/repository';
import { SaveConflictError } from '../storage/repository';
import { createSave, parseSave, SaveDataError } from '../storage/schema';
import { activeVillage, createSession, reduceSession } from './session';
import type { Session, SessionAction } from './session';

export type PersistentAction = Extract<SessionAction, { type: 'create' | 'advance' | 'delete' }>;
export type ReadAction = Exclude<SessionAction, PersistentAction>;
export type PersistencePhase = 'loading' | 'ready' | 'saving' | 'save-error' | 'load-error';

export interface PersistenceSnapshot {
  readonly session: Session;
  readonly phase: PersistencePhase;
  readonly slots: Readonly<Record<SlotId, SlotStatus>>;
  readonly error: string;
}

interface PendingWrite {
  readonly next: Session;
  readonly slot: SlotId;
  readonly expectedRevision: SaveExpectation | null;
  readonly save: SaveEnvelope | null;
}

function friendlyError(error: unknown): string {
  if (error instanceof SaveConflictError || error instanceof SaveDataError) return error.message;
  if (error instanceof Error) {
    if (error.name === 'QuotaExceededError') return 'No hay espacio suficiente para guardar. La última partida confirmada se conserva.';
    if (error.name === 'VersionError') return 'El almacenamiento pertenece a otra versión. No se han modificado sus datos.';
    if (error.name === 'SecurityError') return 'El navegador bloqueó el acceso al almacenamiento. Revisa los permisos del sitio y reintenta.';
  }
  return 'No se pudo completar la operación de almacenamiento. La última partida confirmada se conserva.';
}

const emptyStatuses = (): Record<SlotId, SlotStatus> => ({ 1: { kind: 'empty' }, 2: { kind: 'empty' }, 3: { kind: 'empty' } });

export class PersistentSession {
  private current: PersistenceSnapshot = { session: createSession(), phase: 'loading', slots: emptyStatuses(), error: '' };
  private pending: PendingWrite | null = null;
  private listeners = new Set<() => void>();
  private disposed = false;

  constructor(private readonly repository: SaveRepository, private readonly clock = () => new Date().toISOString()) {}

  get snapshot(): PersistenceSnapshot { return this.current; }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private update(changes: Partial<PersistenceSnapshot>): void {
    this.current = { ...this.current, ...changes };
    if (!this.disposed) for (const listener of this.listeners) listener();
  }

  async load(showSlots = false): Promise<void> {
    if (this.pending) throw new Error('Primero resuelve los cambios pendientes de guardar.');
    this.update({ phase: 'loading', error: '' });
    try {
      const raw = await this.repository.readAll();
      const statuses = emptyStatuses();
      const worlds: Session['slots'] = { 1: null, 2: null, 3: null };
      const loaded = { ...worlds };
      for (const slot of SLOT_IDS) {
        if (raw[slot] === null) continue;
        try {
          const save = parseSave(raw[slot], slot);
          statuses[slot] = { kind: 'ready', save };
          loaded[slot] = save.village;
        } catch (error) { statuses[slot] = { kind: 'invalid', error: friendlyError(error) }; }
      }
      this.update({ session: { ...createSession(), slots: loaded, route: showSlots ? 'slots' : 'home' }, slots: statuses, phase: 'ready' });
    } catch (error) { this.update({ phase: 'load-error', error: friendlyError(error) }); }
  }

  read(action: ReadAction, notify = true): void {
    if (this.current.phase !== 'ready') throw new Error('Primero completa la lectura o el guardado pendiente.');
    const session = reduceSession(this.current.session, action);
    if (notify) this.update({ session });
    else this.current = { ...this.current, session };
  }

  async perform(action: PersistentAction): Promise<void> {
    if (this.current.phase !== 'ready' || this.pending) throw new Error('Ya hay una operación de almacenamiento pendiente.');
    const slot = action.type === 'advance' ? this.current.session.activeSlot : action.slot;
    if (slot === null || !SLOT_IDS.includes(slot)) throw new Error('No hay un espacio válido para guardar.');
    const status = this.current.slots[slot];
    if (status.kind === 'invalid') throw new SaveDataError('Este espacio contiene datos incompatibles. No se pueden sobrescribir.');
    const next = reduceSession(this.current.session, action);
    const expectedRevision = status.kind === 'ready' ? status.save : null;
    const world = next.slots[slot];
    const save = world ? createSave(world, slot, (expectedRevision?.revision ?? 0) + 1, this.clock()) : null;
    if (save === null && expectedRevision === null) throw new Error('Este espacio ya está vacío.');
    this.pending = { next, slot, expectedRevision, save };
    await this.flush();
  }

  private async flush(): Promise<void> {
    const pending = this.pending;
    if (!pending || this.current.phase === 'saving') throw new Error('No hay un cambio pendiente que se pueda guardar ahora.');
    this.update({ phase: 'saving', error: '' });
    try {
      if (pending.save) await this.repository.write(pending.save, pending.expectedRevision);
      else if (pending.expectedRevision !== null) await this.repository.delete(pending.slot, pending.expectedRevision);
      const statuses = { ...this.current.slots, [pending.slot]: pending.save ? { kind: 'ready' as const, save: pending.save } : { kind: 'empty' as const } };
      this.pending = null;
      this.update({ session: pending.next, slots: statuses, phase: 'ready', error: '' });
    } catch (error) {
      this.update({ phase: 'save-error', error: friendlyError(error) });
      throw error;
    }
  }

  retry(): Promise<void> { return this.flush(); }

  async discardPending(): Promise<void> {
    if (this.current.phase === 'saving') throw new Error('Espera a que termine la escritura en curso.');
    this.pending = null;
    await this.load(true);
  }

  get savedAt(): string | null {
    const active = this.current.session.activeSlot;
    if (active === null) return null;
    const status = this.current.slots[active];
    return status.kind === 'ready' ? status.save.savedAt : null;
  }

  get hasSavedVillages(): boolean { return SLOT_IDS.some((slot) => this.current.slots[slot].kind === 'ready'); }
  get hasUnsavedChanges(): boolean { return this.pending !== null; }
  get village() { return activeVillage(this.current.session); }

  dispose(): void {
    this.disposed = true;
    this.listeners.clear();
    this.repository.close();
  }
}
