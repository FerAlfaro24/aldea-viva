import { expect, it } from 'vitest';
import { createSession, reduceSession } from '../../src/app/session';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { renderFirstSteps, renderHelp } from '../../src/ui/help';
import { freezeDeep } from '../fixtures/simulation';

it('la ayuda se puede abrir antes de fundar y su consulta no altera una partida', () => {
  expect(reduceSession(createSession(), { type: 'navigate', route: 'help' }).route).toBe('help');
  const initial = reduceSession(createSession(), { type: 'create', slot: 1, seed: 'guia-10', confirmReplacement: false });
  const before = JSON.stringify(initial.slots);
  const next = reduceSession(initial, { type: 'navigate', route: 'help' });
  const markup = renderHelp(true) + renderFirstSteps(freezeDeep(next.slots[1]!));
  expect(JSON.stringify(next.slots)).toBe(before); expect(markup).not.toContain('potentialSecret');
  expect(markup).toContain('84 días'); expect(markup).toContain('Tu siguiente paso');
});

it('los primeros pasos reflejan trabajos reales y no contratan trabajadores al mostrar consejos', () => {
  const village = generateVillage('consejo-contextual'); const person = village.residents.find((resident) => resident.initialAge >= 18)!;
  const orchard = village.buildings.find((building) => building.type === 'orchard')!;
  const working = assignWork(village, person.id, 'farmer', orchard.id);
  expect(renderFirstSteps(village)).toContain('Primero, pon los huertos a trabajar');
  expect(renderFirstSteps(freezeDeep(working))).toContain('Tu huerto tiene puestos sin cubrir');
  expect(working.residents.filter((resident) => resident.profession !== null)).toHaveLength(1);
});
