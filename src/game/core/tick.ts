import type {
  AdvanceDays,
  AdvanceResult,
  ChronicleEntry,
  PendingDecision,
  SimulationState,
  TickOptions,
} from '../models/simulation';
import { getAge, getCalendarDate, getEligibleProfessions } from './calendar';
import { restoreRng } from './rng';

function validateDecision(decision: PendingDecision, elapsedDays: number): void {
  if (typeof decision.id !== 'string' || !decision.id.trim()
    || typeof decision.type !== 'string' || !decision.type.trim()
    || !Number.isSafeInteger(decision.sinceElapsedDay)
    || decision.sinceElapsedDay < 0 || decision.sinceElapsedDay > elapsedDays) {
    throw new TypeError('La decisión pendiente no tiene identidad o fecha válida.');
  }
}

function validateState(state: SimulationState): void {
  getCalendarDate(state.elapsedDays);
  restoreRng(state.rng);
  const ids = new Set<string>();

  for (const resident of state.residents) {
    if (typeof resident.id !== 'string' || !resident.id.trim() || ids.has(resident.id)) {
      throw new TypeError('Cada habitante debe tener un identificador único y no vacío.');
    }
    ids.add(resident.id);
    getAge(resident, state.elapsedDays);
  }
  if (state.pendingDecision) {
    validateDecision(state.pendingDecision, state.elapsedDays);
  }
}

export function tickOneDay<TState extends SimulationState>(
  state: TState,
  options: TickOptions<TState> = {},
): AdvanceResult<TState> {
  validateState(state);
  if (state.pendingDecision) {
    return { state, processedDays: 0, remainingDays: 1, events: [], interrupted: true };
  }

  const previousDate = getCalendarDate(state.elapsedDays);
  const elapsedDays = state.elapsedDays + 1;
  const date = getCalendarDate(elapsedDays);
  const events: ChronicleEntry[] = [];

  // Orden estable de registro: año, estación, cumpleaños y habilitaciones por ID.
  if (date.year !== previousDate.year) {
    events.push({ id: `year:${elapsedDays}`, elapsedDay: elapsedDays, type: 'year_changed', year: date.year });
  }
  if (date.season !== previousDate.season) {
    events.push({ id: `season:${elapsedDays}`, elapsedDay: elapsedDays, type: 'season_changed', season: date.season });
  }

  const residents = [...state.residents].sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  for (const resident of residents) {
    if (!resident.alive || resident.birthDayOfYear !== date.dayOfYear) continue;

    const age = getAge(resident, elapsedDays);
    events.push({
      id: `birthday:${elapsedDays}:${resident.id}`,
      elapsedDay: elapsedDays,
      type: 'birthday',
      residentId: resident.id,
      age,
    });

    const previouslyEligible = getEligibleProfessions(getAge(resident, state.elapsedDays));
    for (const profession of getEligibleProfessions(age)) {
      if (previouslyEligible.includes(profession)) continue;
      events.push({
        id: `eligible_job:${elapsedDays}:${resident.id}:${profession}`,
        elapsedDay: elapsedDays,
        type: 'eligible_job',
        residentId: resident.id,
        profession,
      });
    }
  }

  let nextState: TState = {
    ...state,
    elapsedDays,
    chronicle: [...state.chronicle, ...events],
  };
  const decision = options.decisionAfterDay?.(nextState) ?? null;
  if (decision) {
    validateDecision(decision, elapsedDays);
    if (decision.sinceElapsedDay !== elapsedDays) {
      throw new RangeError('Una nueva decisión debe originarse en el día que se acaba de procesar.');
    }
    nextState = { ...nextState, pendingDecision: { ...decision } };
  }

  return {
    state: nextState,
    processedDays: 1,
    remainingDays: 0,
    events,
    interrupted: nextState.pendingDecision !== null,
  };
}

export function advanceDays<TState extends SimulationState>(
  state: TState,
  count: AdvanceDays,
  options: TickOptions<TState> = {},
): AdvanceResult<TState> {
  if (count !== 1 && count !== 7 && count !== 28) {
    throw new RangeError('Solo se permiten avances de 1, 7 o 28 días.');
  }
  validateState(state);
  let current = state;
  let processedDays = 0;
  const events: ChronicleEntry[] = [];

  while (processedDays < count && current.pendingDecision === null) {
    const result = tickOneDay(current, options);
    current = result.state;
    processedDays += result.processedDays;
    events.push(...result.events);
  }

  return {
    state: current,
    processedDays,
    remainingDays: count - processedDays,
    events,
    interrupted: current.pendingDecision !== null,
  };
}
