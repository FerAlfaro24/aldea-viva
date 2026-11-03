import { z } from 'zod';
import type { SaveEnvelope, SlotId } from '../game/models/save';
import type { VillageState } from '../game/models/village';
import { validateVillageState } from '../game/validation/village';
import { validateDefense } from '../game/validation/defense';
import { getAge, getCalendarDate } from '../game/core/calendar';
import { MINIMUM_WORK_AGES } from '../game/rules/calendar';
import { isResourceAmount } from '../game/rules/resources';

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
const calendarEntries = [
  z.strictObject({ ...entryBase, type: z.literal('founded'), villageId: id, population: unsigned }),
  z.strictObject({ ...entryBase, type: z.literal('year_changed'), year: positive }),
  z.strictObject({ ...entryBase, type: z.literal('season_changed'), season }),
  z.strictObject({ ...entryBase, type: z.literal('birthday'), residentId: id, age: unsigned }),
  z.strictObject({ ...entryBase, type: z.literal('eligible_job'), residentId: id, profession }),
] as const;
const housingEntry = z.strictObject({ ...entryBase, type: z.literal('housing_changed'), residentId: id, fromHouseId: id.nullable(), toHouseId: id });
const constructionEntry = z.strictObject({ ...entryBase, type: z.literal('construction_changed'), projectId: id, slotId: id,
  buildingType: z.enum(['house', 'orchard', 'warehouse']), action: z.enum(['prepared', 'paused', 'resumed', 'cancelled']), reservedWood: positive });
const expansionEntry = z.strictObject({ ...entryBase, type: z.literal('village_expanded'), fromGrade: positive, toGrade: positive, addedSlots: positive, woodCost: positive });
const maintenanceEntry = z.strictObject({ ...entryBase, type: z.literal('maintenance_changed'), buildingId: id.nullable(), priority: z.enum(['normal', 'high']).nullable(), minimumWoodReserve: unsigned });
const jobEntry = z.strictObject({ ...entryBase, type: z.literal('job_changed'), residentId: id, profession: profession.nullable(), workplaceId: id.nullable(), manualLock: z.boolean() });
const workConstructionEntry = constructionEntry.extend({ action: z.enum(['prepared', 'paused', 'resumed', 'cancelled', 'started', 'completed']), materialsConsumed: z.boolean().optional() });
const repairEntry = z.strictObject({ ...entryBase, type: z.literal('building_repaired'), buildingId: id, woodCost: positive, condition: score });
const resource = z.number().nonnegative().refine(isResourceAmount);
const economyPolicy = z.strictObject({ ration: z.enum(['abundant', 'normal', 'reduced', 'emergency']),
  priority: z.enum(['balanced', 'children', 'workers', 'houses']), priorityHouseIds: z.array(id), deliveryPriority: z.enum(['food', 'wood']) });
const economySummary = { openingFood: resource, openingWood: resource, foodProduced: resource, woodProduced: resource,
  foodStored: resource, woodStored: resource, foodRejected: resource, woodRejected: resource,
  foodRequested: resource, foodConsumed: resource, foodMissing: resource, workWoodSpent: resource, closingFood: resource, closingWood: resource };
const economyEntry = z.strictObject({ ...entryBase, ...economySummary, type: z.literal('economy_day') });
const economyPolicyEntry = z.strictObject({ ...entryBase, type: z.literal('economy_policy_changed'), policy: economyPolicy });
const workEntries = [...calendarEntries, housingEntry, workConstructionEntry, expansionEntry, maintenanceEntry, jobEntry, repairEntry] as const;

const villageSchema = z.strictObject({
  id, generationVersion: z.literal('families-v1'), initialConfigId: z.enum(['provisional-v1', 'housing-20-v1']),
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
    ...calendarEntries,
    housingEntry,
  ])),
});

const envelopeBase = {
  saveId: z.uuid(),
  format: z.literal('aldea-viva-save'), gameVersion: id,
  savedAt: z.iso.datetime({ offset: true }), slot: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  revision: positive,
};
const projectVillageSchema = villageSchema.extend({
  constructionProjects: z.array(z.strictObject({ id, slotId: id, buildingType: z.enum(['house', 'orchard', 'warehouse']),
    reservedWood: positive, status: z.enum(['prepared', 'paused']), progress: z.literal(0) })).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...calendarEntries, housingEntry, constructionEntry])),
});
const maintenanceVillageSchema = projectVillageSchema.extend({
  maintenance: z.strictObject({ minimumWoodReserve: unsigned, orders: z.array(z.strictObject({ buildingId: id, priority: z.enum(['normal', 'high']) })) }).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...calendarEntries, housingEntry, constructionEntry, expansionEntry, maintenanceEntry])),
});
const workVillageSchema = maintenanceVillageSchema.extend({
  constructionProjects: z.array(z.strictObject({ id, slotId: id, buildingType: z.enum(['house', 'orchard', 'warehouse']),
    reservedWood: positive, status: z.enum(['prepared', 'working', 'paused']), progress: unsigned,
    requiredWork: positive.optional(), materialsConsumed: z.boolean().optional() })).optional(),
  workAssignments: z.array(z.strictObject({ residentId: id, profession, workplaceId: id, source: z.enum(['player', 'system']),
    manualLock: z.boolean(), authorized: z.boolean(), status: z.enum(['active', 'conflict']) })).optional(),
  chronicle: z.array(z.discriminatedUnion('type', workEntries)),
});
const economyVillageSchema = workVillageSchema.extend({
  inventory: z.strictObject({ food: resource, wood: resource }),
  economy: z.strictObject({ policy: economyPolicy, lastDay: z.strictObject({ ...economySummary, elapsedDay: unsigned, policy: economyPolicy,
    allocations: z.array(z.strictObject({ residentId: id, need: resource, requested: resource, served: resource, missing: resource })) }).optional() }).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...workEntries, economyEntry, economyPolicyEntry])),
});
const survivalCause = z.enum(['hunger', 'cold', 'combined']);
const winterSeverity = z.enum(['mild', 'normal', 'harsh']);
const healthWarning = z.enum(['well', 'hungry', 'weak', 'critical']);
const survivalEntries = [
  z.strictObject({ ...entryBase, type: z.literal('winter_outlook'), year: positive, forecast: z.enum(['mild', 'normal', 'harsh', 'uncertain']) }),
  z.strictObject({ ...entryBase, type: z.literal('winter_started'), year: positive, severity: winterSeverity }),
  z.strictObject({ ...entryBase, type: z.literal('building_warning'), buildingId: id, level: z.number().int().min(1).max(4), condition: score }),
  z.strictObject({ ...entryBase, type: z.literal('building_collapsed'), buildingId: id, lostFood: resource, lostWood: resource, displacedResidentIds: z.array(id), cancelledProjectIds: z.array(id) }),
  z.strictObject({ ...entryBase, type: z.literal('health_warning'), residentId: id, warning: healthWarning, health: score, hunger: score }),
  z.strictObject({ ...entryBase, type: z.literal('medical_episode'), residentId: id, action: z.enum(['illness', 'rescue', 'recovered']), cause: survivalCause, untilElapsedDay: unsigned }),
  z.strictObject({ ...entryBase, type: z.literal('resident_died'), residentId: id, cause: survivalCause }),
  z.strictObject({ ...entryBase, type: z.literal('village_ended'), populationLost: unsigned }),
] as const;
const survivalBuildingBase = { ...buildingBase, zeroConditionDays: unsigned.optional(), warningLevel: z.number().int().min(0).max(4).optional(), collapsedAt: unsigned.optional() };
const survivalVillageSchema = economyVillageSchema.extend({
  residents: z.array(resident.extend({ medical: z.strictObject({ warning: healthWarning.optional(), illnessActive: z.boolean().optional(),
    incapacityUntil: unsigned.optional(), permanentCapacity: z.number().min(0).max(1).optional(), stabilizedUntil: unsigned.optional(),
    episodes: z.array(z.strictObject({ type: z.enum(['illness', 'rescue']), elapsedDay: unsigned, untilElapsedDay: unsigned, cause: survivalCause })).optional(),
    death: z.strictObject({ elapsedDay: unsigned, cause: survivalCause, lastProfession: profession.nullable() }).optional() }).optional() })),
  buildings: z.array(z.discriminatedUnion('type', [
    z.strictObject({ ...survivalBuildingBase, type: z.literal('house'), housingCapacity: positive }),
    z.strictObject({ ...survivalBuildingBase, type: z.literal('orchard'), workerCapacity: positive }),
    z.strictObject({ ...survivalBuildingBase, type: z.literal('warehouse'), storageCapacity: positive }),
  ])),
  survival: z.strictObject({ endedAt: unsigned.optional(), winters: z.array(z.strictObject({ year: positive, severity: winterSeverity,
    forecast: z.enum(['mild', 'normal', 'harsh', 'uncertain']), outlookIssuedAt: unsigned.nullable(), revealedAt: unsigned.nullable() })) }).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...workEntries, economyEntry, economyPolicyEntry, ...survivalEntries])),
});
// Los esquemas v1–v7 permanecen estrictos. Solo v8 admite heridas y asaltos.
const combatCause = z.enum(['hunger', 'cold', 'combined', 'combat']);
const tactic = z.enum(['defend', 'protect-storage', 'negotiate', 'sortie']);
const defenseEntries = [
  z.strictObject({ ...entryBase, type: z.literal('bandit_warning'), threatId: id, arrivalDay: unsigned, attackers: positive }),
  z.strictObject({ ...entryBase, type: z.literal('bandit_attack'), threatId: id, attackers: positive, surprise: z.boolean() }),
  z.strictObject({ ...entryBase, type: z.literal('bandit_resolved'), threatId: id, tactic, success: z.boolean(), successPercent: score,
    paidFood: resource, paidWood: resource, stolenFood: resource, stolenWood: resource, injuredIds: z.array(id), deadIds: z.array(id),
    damagedBuildingId: id.nullable(), buildingDamage: score, cancelledProjectIds: z.array(id) }),
] as const;
const defenseVillageSchema = survivalVillageSchema.extend({
  residents: z.array(resident.extend({ medical: z.strictObject({ warning: healthWarning.optional(), illnessActive: z.boolean().optional(),
    incapacityUntil: unsigned.optional(), permanentCapacity: z.number().min(0).max(1).optional(), stabilizedUntil: unsigned.optional(),
    episodes: z.array(z.strictObject({ type: z.enum(['illness', 'rescue', 'injury']), elapsedDay: unsigned, untilElapsedDay: unsigned, cause: combatCause })).optional(),
    death: z.strictObject({ elapsedDay: unsigned, cause: combatCause, lastProfession: profession.nullable() }).optional() }).optional() })),
  defense: z.strictObject({ nextCheckDay: unsigned, threat: z.strictObject({ id, detectedAt: unsigned, arrivalDay: unsigned, warned: z.boolean(),
    attackers: positive, strength: z.number().positive(), demandFood: unsigned, demandWood: unsigned }).optional() }).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...workEntries, economyEntry, economyPolicyEntry,
    ...survivalEntries.slice(0, 5),
    survivalEntries[5].extend({ action: z.enum(['illness', 'rescue', 'injury', 'recovered']), cause: combatCause }),
    survivalEntries[6].extend({ cause: combatCause }), survivalEntries[7], ...defenseEntries])),
});
const storyCause = z.enum(['hunger', 'cold', 'combined', 'combat', 'accident']);
const medicalV8 = defenseVillageSchema.shape.residents.element.shape.medical.unwrap();
const storyResident = defenseVillageSchema.shape.residents.element.extend({
  arrivedAt: unsigned.optional(), talents: z.array(z.strictObject({ profession, level: z.enum(['promising', 'confirmed']), elapsedDay: unsigned })).optional(),
  medical: medicalV8.extend({ episodes: z.array(medicalV8.shape.episodes.unwrap().element.extend({ cause: storyCause })).optional(),
    death: medicalV8.shape.death.unwrap().extend({ cause: storyCause }).optional() }).optional(),
});
const storyKind = z.enum(['harvest-trial', 'forest-route', 'urgent-repair', 'visitors']);
const storyChoice = z.enum(['decline', 'careful', 'bold', 'patch', 'reinforce', 'accept', 'reject']);
const storyEntries = [
  z.strictObject({ ...entryBase, type: z.literal('story_offered'), eventId: id, kind: storyKind, residentId: id.optional() }),
  z.strictObject({ ...entryBase, type: z.literal('story_resolved'), eventId: id, kind: storyKind, choice: storyChoice, residentId: id, buildingId: id.nullable(),
    successPercent: score, success: z.boolean(), experience: unsigned, foodCost: resource, woodCost: resource, foodGained: resource, woodGained: resource,
    foodRejected: resource, woodRejected: resource, healthLost: score, buildingChange: score }),
  z.strictObject({ ...entryBase, type: z.literal('visitors_resolved'), eventId: id, accepted: z.boolean(), names: z.array(id), familyId: id.nullable(), residentIds: z.array(id) }),
  z.strictObject({ ...entryBase, type: z.literal('work_insight'), residentId: id, profession, experience: unsigned }),
  z.strictObject({ ...entryBase, type: z.literal('talent_discovered'), residentId: id, profession, level: z.enum(['promising', 'confirmed']), potential: score.optional() }),
] as const;
const storyVillageSchema = defenseVillageSchema.extend({
  residents: z.array(storyResident),
  story: z.strictObject({ nextCheckDay: unsigned, lastVisitorDay: unsigned.optional(), pending: z.discriminatedUnion('kind', [
    z.strictObject({ id, elapsedDay: unsigned, kind: z.enum(['harvest-trial', 'forest-route']), residentId: id }),
    z.strictObject({ id, elapsedDay: unsigned, kind: z.literal('urgent-repair'), residentId: id, buildingId: id }),
    z.strictObject({ id, elapsedDay: unsigned, kind: z.literal('visitors'), residents: z.array(storyResident), family: villageSchema.shape.families.element }),
  ]).optional() }).optional(),
  chronicle: z.array(z.discriminatedUnion('type', [...workEntries, economyEntry, economyPolicyEntry, ...survivalEntries.slice(0, 5),
    survivalEntries[5].extend({ action: z.enum(['illness', 'rescue', 'injury', 'recovered']), cause: storyCause }),
    survivalEntries[6].extend({ cause: storyCause }), survivalEntries[7], defenseEntries[0], defenseEntries[1],
    defenseEntries[2].extend({ participantIds: z.array(id).optional() }), ...storyEntries])),
});
const envelopeSchema: z.ZodType<SaveEnvelope> = z.discriminatedUnion('schemaVersion', [
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(1), village: villageSchema.extend({ initialConfigId: z.literal('provisional-v1'), chronicle: z.array(z.discriminatedUnion('type', calendarEntries)) }) }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(2), village: villageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(3), village: projectVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(4), village: maintenanceVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(5), village: workVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(6), village: economyVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(7), village: survivalVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(8), village: defenseVillageSchema }),
  z.strictObject({ ...envelopeBase, schemaVersion: z.literal(9), village: storyVillageSchema }),
]);

export class SaveDataError extends Error {
  constructor(message = 'La partida contiene datos incompletos o no válidos. Sus datos no se han modificado.') {
    super(message);
    this.name = 'SaveDataError';
  }
}

export function parseSave(data: unknown, expectedSlot?: SlotId): SaveEnvelope {
  if (typeof data === 'object' && data !== null && 'schemaVersion' in data && ![1, 2, 3, 4, 5, 6, 7, 8, 9].includes(data.schemaVersion as number)) {
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
    validateDefense(village);
    if (village.pendingDecision && village.pendingDecision.sinceElapsedDay > village.elapsedDays) throw new Error('Decisión futura.');
    const foundation = village.chronicle.filter((entry) => entry.type === 'founded');
    if (foundation.length !== 1 || foundation[0]?.elapsedDay !== 0 || foundation[0].villageId !== village.id) throw new Error('Fundación incoherente.');
    const events = new Set<string>();
    for (const entry of village.chronicle) {
      const date = getCalendarDate(entry.elapsedDay);
      const calendarEvent = ['founded', 'year_changed', 'season_changed', 'birthday', 'eligible_job'].includes(entry.type);
      const key = calendarEvent ? `${entry.type}:${entry.elapsedDay}:${'residentId' in entry ? entry.residentId : ''}:${entry.type === 'eligible_job' ? entry.profession : ''}` : entry.id;
      if (events.has(key)) throw new Error('Suceso duplicado.');
      events.add(key);
      if (entry.type === 'housing_changed' && entry.fromHouseId === entry.toHouseId) throw new Error('Traslado sin cambio de vivienda.');
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
  // Leer versiones anteriores no escribe ni regenera el mundo.
  return parseSave({ saveId: crypto.randomUUID(), format: 'aldea-viva-save', schemaVersion: 9, gameVersion: '1.0.0-rc.2', savedAt, slot, revision, village }, slot);
}
