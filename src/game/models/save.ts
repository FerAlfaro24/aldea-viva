import type { VillageState } from './village';

export const SLOT_IDS = [1, 2, 3] as const;
export type SlotId = (typeof SLOT_IDS)[number];

export interface SaveEnvelope {
  readonly saveId: string;
  readonly format: 'aldea-viva-save';
  readonly schemaVersion: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  readonly gameVersion: string;
  readonly savedAt: string;
  readonly slot: SlotId;
  readonly revision: number;
  readonly village: VillageState;
}
