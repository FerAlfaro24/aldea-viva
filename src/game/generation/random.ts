import { createRng, randomInt, restoreRng } from '../core/rng';
import type { RngSnapshot } from '../models/simulation';

// El estado mutable pertenece solo a una ejecución local del generador.
export class GenerationRandom {
  private rng: RngSnapshot;

  constructor(seed: string | RngSnapshot) {
    this.rng = typeof seed === 'string' ? createRng(seed) : restoreRng(seed);
  }

  int(min: number, max: number): number {
    const result = randomInt(this.rng, min, max);
    this.rng = result.rng;
    return result.value;
  }

  shuffle<T>(values: readonly T[]): T[] {
    const shuffled = [...values];
    for (let index = shuffled.length - 1; index > 0; index--) {
      const other = this.int(0, index);
      const current = shuffled[index];
      const replacement = shuffled[other];
      if (current === undefined || replacement === undefined) {
        throw new RangeError('No se puede mezclar un catálogo con huecos.');
      }
      shuffled[index] = replacement;
      shuffled[other] = current;
    }
    return shuffled;
  }

  snapshot(): RngSnapshot {
    return { ...this.rng };
  }
}
