import type { SaveEnvelope, SlotId } from '../game/models/save';

export type SaveExpectation = Pick<SaveEnvelope, 'revision' | 'saveId'>;
export interface SaveRepository {
  readAll(): Promise<Record<SlotId, unknown | null>>;
  write(save: SaveEnvelope, expectedRevision: SaveExpectation | null): Promise<void>;
  delete(slot: SlotId, expectedRevision: SaveExpectation): Promise<void>;
  close(): void;
}

export type SlotStatus =
  | { readonly kind: 'empty' }
  | { readonly kind: 'ready'; readonly save: SaveEnvelope }
  | { readonly kind: 'invalid'; readonly error: string };

export class SaveConflictError extends Error {
  constructor() {
    super('Esta aldea cambió en otra pestaña. No se sobrescribió. Descarta el cambio pendiente y vuelve a leer las partidas.');
    this.name = 'SaveConflictError';
  }
}
