import { describe, expect, it } from 'vitest';
import { generateVillage } from '../../src/game/generation/village';
import { advanceDays } from '../../src/game/core/tick';
import { createSave, parseSave } from '../../src/storage/schema';

const timestamp = '2026-11-02T18:00:00.000Z';
const save = () => createSave(generateVillage('formato-guardado'), 1, 1, timestamp);

describe('Esquema y coherencia de partidas desconocidas', () => {
  it('SAVE-01/10: el esquema 1 conocido conserva todos los datos sin migración ficticia', () => {
    const original = save();
    expect(parseSave(JSON.parse(JSON.stringify(original)), 1)).toEqual(original);
    expect(parseSave(original, 1)).not.toBe(original);
  });

  it.each([null, [], {}, { format: 'otro', schemaVersion: 1 }, { ...save(), schemaVersion: 0 }, { ...save(), schemaVersion: 2 },
    { ...save(), slot: 4 }, { ...save(), revision: 0 }, { ...save(), savedAt: 'sin-fecha' },
    { ...save(), village: { ...save().village, residents: 'no-es-lista' } },
    { ...save(), village: { ...save().village, elapsedDays: NaN } },
    { ...save(), village: { ...save().village, rng: { algorithm: 'desconocido', seed: 'x', state: 1 } } },
  ])('SAVE-07: rechaza datos desconocidos o dañados sin coerción: %j', (raw) => {
    expect(() => parseSave(raw, 1)).toThrow();
  });

  it('no carga un espacio bajo la identidad de otro', () => {
    expect(() => parseSave(save(), 2)).toThrow(/espacio/);
  });

  it('rechaza referencias familiares rotas incluso cuando el JSON tiene forma válida', () => {
    const original = save();
    const raw = { ...original, village: { ...original.village, residents: original.village.residents.map((person, index) => {
      return index === 0 ? { ...person, familyId: 'ausente' } : person;
    }) } };
    expect(() => parseSave(raw)).toThrow(/incoherentes/);
  });

  it('rechaza atributos numéricos recibidos como texto en lugar de convertirlos', () => {
    const original = save();
    const raw = { ...original, village: { ...original.village, residents: original.village.residents.map((person, index) => {
      return index === 0 ? { ...person, initialAge: '20' } : person;
    }) } };
    expect(() => parseSave(raw)).toThrow();
  });

  it('conserva las partidas de años posteriores y no vuelve a validar población como creación', () => {
    let village = generateVillage('muchos-anos');
    for (let month = 0; month < 24; month++) village = advanceDays(village, 28).state;
    expect(parseSave(createSave(village, 1, 1, timestamp)).village.elapsedDays).toBe(672);
  });

  it('SAVE-08: cambiar la fecha real del guardado no cambia el mundo ni el RNG', () => {
    const village = generateVillage('metadatos-separados');
    const first = createSave(village, 1, 1, timestamp);
    const second = createSave(village, 1, 1, '2099-01-01T00:00:00.000Z');
    expect(first.village).toEqual(second.village);
  });

  it('rechaza decisiones futuras y sucesos duplicados con identificadores distintos', () => {
    const original = save();
    expect(() => parseSave({ ...original, village: { ...original.village, pendingDecision: { id: 'x', type: 'prueba', sinceElapsedDay: 1 } } })).toThrow();
    expect(() => parseSave({ ...original, village: { ...original.village, chronicle: [...original.village.chronicle, { ...original.village.chronicle[0], id: 'duplicado' }] } })).toThrow();
  });
});
