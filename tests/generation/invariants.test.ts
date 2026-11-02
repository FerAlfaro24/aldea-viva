import { describe, expect, it } from 'vitest';
import { getBirthElapsedDay } from '../../src/game/core/calendar';
import { advanceDays } from '../../src/game/core/tick';
import { deriveInitialClues, getClueTexts } from '../../src/game/generation/clues';
import { generateVillage } from '../../src/game/generation/village';
import { allocateInitialHousing } from '../../src/game/generation/housing';
import type { Attributes, Resident, VillageState } from '../../src/game/models/village';
import { selectResidentDetails } from '../../src/game/selectors/village';
import { validateNewVillage, validateVillageState } from '../../src/game/validation/village';
import { freezeDeep } from '../fixtures/simulation';

function patchPerson(village: VillageState, change: (person: Resident) => Resident): VillageState {
  return { ...village, residents: village.residents.map((person, index) => index === 0 ? change(person) : person) };
}

const corruptions: readonly [string, (village: VillageState) => VillageState][] = [
  ['ID duplicado', (village) => ({ ...village, residents: [...village.residents, village.residents[0]!] })],
  ['nombre vacío', (village) => patchPerson(village, (person) => ({ ...person, displayName: '' }))],
  ['familia inexistente', (village) => patchPerson(village, (person) => ({ ...person, familyId: 'inexistente' }))],
  ['cumpleaños fuera del año', (village) => patchPerson(village, (person) => ({ ...person, birthDayOfYear: 337 }))],
  ['autoparentesco', (village) => patchPerson(village, (person) => ({ ...person, relations: { ...person.relations, siblingIds: [person.id] } }))],
  ['pareja inexistente', (village) => patchPerson(village, (person) => ({ ...person, relations: { ...person.relations, partnerId: 'inexistente' } }))],
  ['atributo inválido', (village) => patchPerson(village, (person) => ({ ...person, attributes: { ...person.attributes, strength: NaN } }))],
  ['potencial inválido', (village) => patchPerson(village, (person) => ({ ...person, skills: { ...person.skills, farmer: { ...person.skills.farmer, potentialSecret: 101 } } }))],
  ['experiencia negativa', (village) => patchPerson(village, (person) => ({ ...person, skills: { ...person.skills, farmer: { ...person.skills.farmer, experience: -1 } } }))],
  ['salud inválida', (village) => patchPerson(village, (person) => ({ ...person, condition: { ...person.condition, health: -1 } }))],
  ['vivienda duplicada', (village) => ({ ...village, housingAssignments: [...village.housingAssignments, village.housingAssignments[0]!] })],
  ['asignación ausente', (village) => ({ ...village, housingAssignments: village.housingAssignments.slice(1) })],
  ['vivienda inexistente', (village) => ({ ...village, housingAssignments: village.housingAssignments.map((assignment, index) => index === 0 ? { ...assignment, houseId: 'no-existe' } : assignment) })],
  ['orden manual desprotegida', (village) => ({ ...village, housingAssignments: village.housingAssignments.map((assignment, index) => index === 0 ? { ...assignment, source: 'player', locked: false } : assignment) })],
  ['capacidad de casa excedida', (village) => ({ ...village, buildings: village.buildings.map((building) => building.type === 'house' ? { ...building, housingCapacity: 1 } : building) })],
  ['inventario negativo', (village) => ({ ...village, inventory: { ...village.inventory, food: -1 } })],
  ['capacidad compartida excedida', (village) => ({ ...village, inventory: { food: 500, wood: 500 } })],
  ['solar incoherente', (village) => ({ ...village, constructionSlots: village.constructionSlots.map((slot, index) => index === 0 ? { ...slot, buildingId: null } : slot) })],
  ['registro duplicado', (village) => ({ ...village, chronicle: [...village.chronicle, ...village.chronicle] })],
  ['registro del futuro', (village) => ({ ...village, chronicle: village.chronicle.map((entry) => ({ ...entry, elapsedDay: 1 })) })],
];

describe('Invariantes de aldea y detección de datos dañados', () => {
  it.each(corruptions)('rechaza %s', (_name, corrupt) => {
    expect(() => validateVillageState(corrupt(generateVillage('detectar-corrupcion')))).toThrow();
  });

  it('rechaza desempleo inicial sustituido por una profesión automática', () => {
    const invalid = patchPerson(generateVillage('sin-autoempleo'), (person) => ({ ...person, profession: 'farmer', workplaceId: 'b-orchard-1' }));
    expect(() => validateNewVillage(invalid)).toThrow(/laboral/);
  });

  it('detecta parentescos sin reciprocidad', () => {
    const village = generateVillage('reciprocidad');
    const child = village.residents.find((person) => person.relations.parentIds.length > 0);
    if (!child) throw new Error('La prueba necesita una familia con descendientes.');
    const invalid = { ...village, residents: village.residents.map((person) => person.id === child.id ? { ...person, relations: { ...person.relations, parentIds: [] } } : person) };
    expect(() => validateVillageState(invalid)).toThrow(/recíproca/);
  });

  it('detecta un ciclo progenitor-descendiente sin recursión infinita', () => {
    const village = generateVillage('ciclo-parentesco');
    const parent = village.residents.find((person) => person.relations.childIds.length > 0);
    const child = village.residents.find((person) => person.id === parent?.relations.childIds[0]);
    if (!parent || !child) throw new Error('Faltan miembros para la prueba.');
    const invalid: VillageState = { ...village, residents: village.residents.map((person) => {
      if (person.id === parent.id) return { ...person, relations: { ...person.relations, parentIds: [child.id] } };
      if (person.id === child.id) return { ...person, relations: { ...person.relations, childIds: [parent.id] } };
      return person;
    }) };
    expect(() => validateVillageState(invalid)).toThrow(/joven/);
  });

  it('permite representar una futura vivienda fijada manualmente, protegida', () => {
    const village = generateVillage('vivienda-protegida');
    const withProtectedAssignment: VillageState = { ...village, housingAssignments: village.housingAssignments.map((assignment, index) => {
      return index === 0 ? { ...assignment, source: 'player', locked: true } : assignment;
    }) };
    expect(() => validateVillageState(withProtectedAssignment)).not.toThrow();
  });

  it('la fecha de nacimiento sintética es coherente con edad y cumpleaños', () => {
    expect(getBirthElapsedDay({ initialAge: 0, birthDayOfYear: 1 })).toBe(0);
    expect(getBirthElapsedDay({ initialAge: 20, birthDayOfYear: 1 })).toBe(-6720);
    expect(getBirthElapsedDay({ initialAge: 20, birthDayOfYear: 2 })).toBe(-7055);
    expect(getBirthElapsedDay({ initialAge: 20, birthDayOfYear: 336 })).toBe(-6721);
    expect(() => getBirthElapsedDay({ initialAge: Number.MAX_SAFE_INTEGER, birthDayOfYear: 1 })).toThrow(RangeError);
  });
});

describe('GEN-10: pistas apoyadas por datos, sin revelar números ocultos', () => {
  const ordinary: Attributes = { strength: 40, endurance: 40, agility: 40, dexterity: 40, vitality: 40 };

  it('no sugiere aprendizaje agrícola si falta la señal visible que lo acompaña', () => {
    const person = generateVillage('reglas-de-pistas').residents[0]!;
    const skills = { ...person.skills, farmer: { ...person.skills.farmer, potentialSecret: 95 } };
    expect(deriveInitialClues(ordinary, skills)).not.toContain('field-learning');
    expect(deriveInitialClues({ ...ordinary, dexterity: 50 }, skills)).toContain('field-learning');
  });

  it('no convierte la cifra de atributo alto en un potencial de oficio garantizado', () => {
    const person = generateVillage('atributo-no-es-talento').residents[0]!;
    const skills = { ...person.skills, farmer: { ...person.skills.farmer, potentialSecret: 10 } };
    const clues = deriveInitialClues({ ...ordinary, dexterity: 75 }, skills);
    expect(clues).toContain('steady-hands');
    expect(clues).not.toContain('field-learning');
    const texts = getClueTexts({ initialClueIds: clues });
    expect(texts.every((text) => !/\d|%/.test(text))).toBe(true);
  });

  it('la creación conserva indicios reproducibles y los mismos datos visibles', () => {
    const village = generateVillage('pistas-reales');
    for (const person of village.residents) {
      expect(person.initialClueIds).toEqual(deriveInitialClues(person.attributes, person.skills));
      const details = selectResidentDetails(village, person.id);
      expect(details?.attributes).toEqual(person.attributes);
      expect(details?.condition).toEqual(person.condition);
      expect(details?.clues).toEqual(getClueTexts(person));
    }
  });

  it('rechaza pistas que no corresponden a los datos de creación', () => {
    const invalid = patchPerson(generateVillage('pista-inventada'), (person) => ({ ...person, initialClueIds: ['strong-build', 'strong-build'] }));
    expect(() => validateNewVillage(invalid)).toThrow(/pistas/);
  });
});

describe('Proyecciones públicas independientes del mundo', () => {
  it('modificar una proyección no modifica datos, relaciones ni el registro de la aldea', () => {
    const village = generateVillage('vista-separada');
    const before = JSON.stringify(village);
    const first = village.residents[0]!;
    const details = selectResidentDetails(village, first.id);
    if (!details) throw new Error('Falta la ficha de prueba.');
    details.attributes.strength = 0;
    details.condition.health = 0;
    details.family.memberIds.reverse();
    details.skills.farmer = 0;
    details.history.reverse();
    expect(JSON.stringify(village)).toBe(before);
    expect(selectResidentDetails(village, 'inexistente')).toBeNull();
  });

  it('el historial y la edad se derivan de las entradas correspondientes a cada persona', () => {
    const village = generateVillage('cumpleanos-y-ficha');
    const person = village.residents[0]!;
    const patched = { ...village, residents: village.residents.map((candidate) => candidate.id === person.id ? { ...candidate, birthDayOfYear: 2 } : candidate) };
    // Cambio exclusivo de la prueba: no altera el generador ni la partida inicial.
    const after = advanceDays(patched, 1).state;
    const details = selectResidentDetails(after, person.id);
    expect(details?.age).toBe(person.initialAge + 1);
    expect(details?.history.some((entry) => entry.type === 'birthday' && entry.residentId === person.id)).toBe(true);
    expect(details?.history.every((entry) => !('residentId' in entry) || entry.residentId === person.id)).toBe(true);
  });
});

describe('Asignación inicial reproducible y edades plausibles', () => {
  it('ordenar las entradas no cambia la casa asignada a cada persona', () => {
    const village = freezeDeep(generateVillage('casas-estables'));
    const assignments = allocateInitialHousing(village.residents, [...village.families].reverse(), [...village.buildings].reverse());
    expect(assignments).toEqual(village.housingAssignments);
  });

  it('no inventa camas si se retiran las casas en una prueba de capacidad', () => {
    const village = freezeDeep(generateVillage('sin-camas'));
    const assignments = allocateInitialHousing(village.residents, village.families, village.buildings.filter((building) => building.type !== 'house'));
    expect(assignments).toHaveLength(village.residents.length);
    expect(assignments.every((assignment) => assignment.houseId === null)).toBe(true);
  });

  it('los menores tienen capacidades iniciales acordes con su edad provisional', () => {
    const observedAges = new Set<number>();
    for (let seed = 0; seed < 100; seed++) {
      const village = generateVillage(`edades-iniciales-${seed}`);
      for (const person of village.residents.filter((candidate) => candidate.initialAge < 18)) {
        observedAges.add(person.initialAge);
        const maximumAttribute = Math.floor(35 * (person.initialAge + 1) / 12);
        const maximumSkill = Math.floor(8 * (person.initialAge + 1) / 12);
        expect(Object.values(person.attributes).every((value) => value <= maximumAttribute)).toBe(true);
        expect(Object.values(person.skills).every((skill) => skill.effective <= maximumSkill)).toBe(true);
      }
    }
    expect(observedAges).toContain(0);
    expect(observedAges).toContain(11);
  });
});
