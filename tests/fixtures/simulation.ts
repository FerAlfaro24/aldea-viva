import type { ResidentClock, SimulationState } from '../../src/game/models/simulation';
import { createRng } from '../../src/game/core/rng';

// Datos sintéticos de pruebas unitarias; no son el generador de aldeas de M2.
export function resident(overrides: Partial<ResidentClock> = {}): ResidentClock {
  return {
    id: 'r001',
    initialAge: 20,
    birthDayOfYear: 2,
    alive: true,
    profession: null,
    workplaceId: null,
    ...overrides,
  };
}

export function simulation(overrides: Partial<SimulationState> = {}): SimulationState {
  return {
    elapsedDays: 0,
    residents: [resident()],
    rng: createRng('aldea-viva-pruebas'),
    chronicle: [],
    pendingDecision: null,
    ...overrides,
  };
}

export function freezeDeep<T>(value: T): T {
  if (value !== null && typeof value === 'object') {
    for (const child of Object.values(value)) freezeDeep(child);
    Object.freeze(value);
  }
  return value;
}
