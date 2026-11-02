import type { RngSnapshot } from '../models/simulation';

const ALGORITHM = 'xorshift32-fnv1a-utf16le-v1';
const UINT32_MAX = 0xffff_ffff;
const UINT32_RANGE = 0x1_0000_0000;

export function createRng(seed: string): RngSnapshot {
  if (typeof seed !== 'string') {
    throw new TypeError('La semilla debe ser una cadena de texto.');
  }

  // FNV-1a sobre bytes UTF-16LE, sin depender del idioma ni de APIs del navegador.
  let hash = 0x811c_9dc5;
  for (let index = 0; index < seed.length; index++) {
    const code = seed.charCodeAt(index);
    hash = Math.imul(hash ^ (code & 0xff), 0x0100_0193) >>> 0;
    hash = Math.imul(hash ^ (code >>> 8), 0x0100_0193) >>> 0;
  }

  // Xorshift32 no admite el estado cero; el reemplazo forma parte de la versión.
  return { algorithm: ALGORITHM, seed, state: hash || 0x9e37_79b9 };
}

export function restoreRng(snapshot: unknown): RngSnapshot {
  if (typeof snapshot !== 'object' || snapshot === null || Array.isArray(snapshot)) {
    throw new TypeError('El estado aleatorio no es un objeto válido.');
  }
  if (!('algorithm' in snapshot) || snapshot.algorithm !== ALGORITHM) {
    throw new TypeError('La versión del generador aleatorio no es compatible.');
  }
  if (!('seed' in snapshot) || typeof snapshot.seed !== 'string') {
    throw new TypeError('Falta una semilla válida en el estado aleatorio.');
  }
  if (!('state' in snapshot) || typeof snapshot.state !== 'number'
    || !Number.isInteger(snapshot.state) || snapshot.state < 1 || snapshot.state > UINT32_MAX) {
    throw new RangeError('El estado aleatorio debe ser un entero de 32 bits distinto de cero.');
  }
  return { algorithm: ALGORITHM, seed: snapshot.seed, state: snapshot.state };
}

function nextUint32(snapshot: RngSnapshot): RngSnapshot {
  const current = restoreRng(snapshot);
  let state = current.state;
  state ^= state << 13;
  state ^= state >>> 17;
  state ^= state << 5;
  return { ...current, state: state >>> 0 };
}

export function nextRandom(snapshot: RngSnapshot): { readonly value: number; readonly rng: RngSnapshot } {
  const rng = nextUint32(snapshot);
  return { value: rng.state / UINT32_RANGE, rng };
}

export function randomInt(
  snapshot: RngSnapshot,
  min: number,
  max: number,
): { readonly value: number; readonly rng: RngSnapshot } {
  const span = max - min + 1;
  if (!Number.isSafeInteger(min) || !Number.isSafeInteger(max)
    || !Number.isSafeInteger(span) || span < 1 || span > UINT32_MAX) {
    throw new RangeError('El intervalo aleatorio debe contener entre 1 y 4294967295 enteros seguros.');
  }

  // Los estados posibles son 1..2^32-1. Restar uno y descartar la cola
  // evita favorecer resultados al reducir el intervalo mediante módulo.
  const limit = UINT32_MAX - (UINT32_MAX % span);
  let rng = snapshot;
  let draw: number;
  do {
    rng = nextUint32(rng);
    draw = rng.state - 1;
  } while (draw >= limit);

  return { value: min + (draw % span), rng };
}
