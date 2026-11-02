import { z } from 'zod';
import type { SaveEnvelope, SlotId } from '../game/models/save';
import type { VillageState } from '../game/models/village';
import { validateVillageState } from '../game/validation/village';
import { getAge, getCalendarDate } from '../game/core/calendar';
import { MINIMUM_WORK_AGES } from '../game/rules/calendar';

const id = z.string().min(1).refine((value) => value.trim().length > 0);
const unsigned = z.number().int().nonnegative();
const positive = z.number().int().positive();
const score = z.number().min(0).max(100);
const profession = z.enum(['farmer', 'builder', 'woodcutter', 'warrior']);
const season = z.enum(['spring', 'summer', 'autumn', 'winter']);
const skill = z.strictObject({ effective: score, historicalBest: score, experience: unsigned, potentialSecret: score });
const resident = z.strictObject({
  id, displayName: id, familyId: id, initialAge: unsigned,
  birthDayOfYear: z.number().int().min(1).max(336), alive: z.boolean(),
  profession: profession.nullable(), workplaceId: id.nullable(),
  relations: z.strictObject({ parentIds: z.array(id), childIds: z.array(id), siblingIds: z.array(id), partnerId: id.nullable() }),
  attributes: z.strictObject({ strength: score, endurance: score, agility: score, dexterity: score, vitality: score }),
  skills: z.strictObject({ farmer: skill, builder: skill, woodcutter: skill, warrior: skill }),
  condition: z.strictObject({ health: score, hunger: score }),
  initialClueIds: z.array(z.enum(['strong-build', 'steady-hands', 'field-learning', 'wood-learning', 'craft-learning', 'defense-learning', 'unknown-aptitudes'])).min(1),
  origin: id,
});
const buildingBase = { id, displayName: id, slotId: id, condition: score };
const entryBase = { id, elapsedDay: unsigned };

const villageSchema: z.ZodType<VillageState> = z.strictObject({
  id, generationVersion: z.literal('families-v1'), initialConfigId: z.literal('provisional-v1'),
  grade: positive, elapsedDays: unsigned,
  residents: z.array(resident),
  families: z.array(z.strictObject({ id, displayName: id, kind: z.enum(['parents-and-children', 'partners', 'siblings', 'single']), memberIds: z.array(id).min(1) })),
  buildings: z.array(z.discriminatedUnion('type', [
    z.strictObject({ ...buildingBase, type: z.literal('house'), housingCapacity: positive }),
    z.strictObject({ ...buildingBase, type: z.literal('orchard'), workerCapacity: positive }),
    z.strictObject({ ...buildingBase, type: z.literal('warehouse'), storageCapacity: positive }),
  ])),
  constructionSlots: z.array(z.strictObject({ id, buildingId: id.nullable() })),
  housingAssignments: z.array(z.strictObject({ residentId: id, houseId: id.nullable(), source: z.enum(['system', 'player']), locked: z.boolean() })),
  inventory: z.strictObject({ food: unsigned, wood: unsigned }),
  rng: z.strictObject({ algorithm: z.literal('xorshift32-fnv1a-utf16le-v1'), seed: z.string(), state: z.number().int().min(1).max(0xffff_ffff) }),
  pendingDecision: z.strictObject({ id, type: id, sinceElapsedDay: unsigned }).nullable(),
  chronicle: z.array(z.discriminatedUnion('type', [
    z.strictObject({ ...entryBase, type: z.literal('founded'), villageId: id, population: unsigned }),
    z.strictObject({ ...entryBase, type: z.literal('year_changed'), year: positive }),
    z.strictObject({ ...entryBase, type: z.literal('season_changed'), season }),
    z.strictObject({ ...entryBase, type: z.literal('birthday'), residentId: id, age: unsigned }),
    z.strictObject({ ...entryBase, type: z.literal('eligible_job'), residentId: id, profession }),
  ])),
});

const envelopeSchema: z.ZodType<SaveEnvelope> = z.strictObject({
  saveId: z.uuid(),
  format: z.literal('aldea-viva-save'), schemaVersion: z.literal(1), gameVersion: id,
  savedAt: z.iso.datetime({ offset: true }), slot: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  revision: positive, village: villageSchema,
});

export class SaveDataError extends Error {
  constructor(message = 'La partida contiene datos incompletos o no válidos. Sus datos no se han modificado.') {
    super(message);
    this.name = 'SaveDataError';
  }
}

export function parseSave(data: unknown, expectedSlot?: SlotId): SaveEnvelope {
  if (typeof data === 'object' && data !== null && 'schemaVersion' in data && data.schemaVersion !== 1) {
    throw new SaveDataError('Esta partida usa una versión de guardado que la aplicación no reconoce. Sus datos se conservan.');
  }
  const result = envelopeSchema.safeParse(data);
  if (!result.success) throw new SaveDataError();
  if (expectedSlot !== undefined && result.data.slot !== expectedSlot) {
    throw new SaveDataError('La partida no corresponde a este espacio. Sus datos se conservan.');
  }
  const village = result.data.village;
  try {
    validateVillageState(village);
    if (village.pendingDecision && village.pendingDecision.sinceElapsedDay > village.elapsedDays) throw new Error('Decisión futura.');
    const foundation = village.chronicle.filter((entry) => entry.type === 'founded');
    if (foundation.length !== 1 || foundation[0]?.elapsedDay !== 0 || foundation[0].villageId !== village.id) throw new Error('Fundación incoherente.');
    const events = new Set<string>();
    for (const entry of village.chronicle) {
      const date = getCalendarDate(entry.elapsedDay);
      const key = `${entry.type}:${entry.elapsedDay}:${'residentId' in entry ? entry.residentId : ''}:${entry.type === 'eligible_job' ? entry.profession : ''}`;
      if (events.has(key)) throw new Error('Suceso duplicado.');
      events.add(key);
      if (entry.type === 'year_changed' && (date.dayOfYear !== 1 || entry.year !== date.year)) throw new Error('Año incoherente.');
      if (entry.type === 'season_changed' && (date.season !== entry.season || ![1, 85, 169, 253].includes(date.dayOfYear))) throw new Error('Estación incoherente.');
      if (entry.type === 'birthday' || entry.type === 'eligible_job') {
        const person = village.residents.find((candidate) => candidate.id === entry.residentId);
        if (!person || person.birthDayOfYear !== date.dayOfYear || entry.elapsedDay === 0) throw new Error('Cumpleaños incoherente.');
        const age = getAge(person, entry.elapsedDay);
        if (entry.type === 'birthday' && entry.age !== age) throw new Error('Edad incoherente.');
        if (entry.type === 'eligible_job' && age !== MINIMUM_WORK_AGES[entry.profession]) throw new Error('Habilitación incoherente.');
      }
    }
  } catch {
    throw new SaveDataError('La partida contiene referencias o valores incoherentes. Sus datos se conservan.');
  }
  return result.data;
}

export function createSave(village: VillageState, slot: SlotId, revision: number, savedAt: string): SaveEnvelope {
  return parseSave({ saveId: crypto.randomUUID(), format: 'aldea-viva-save', schemaVersion: 1, gameVersion: '0.1.0-dev', savedAt, slot, revision, village }, slot);
}
