import { describe, expect, it, vi } from 'vitest';
import { getAge, getBirthElapsedDay } from '../../src/game/core/calendar';
import { createRng, nextRandom, restoreRng } from '../../src/game/core/rng';
import { advanceDays } from '../../src/game/core/tick';
import { generateVillage } from '../../src/game/generation/village';
import { ATTRIBUTE_KEYS } from '../../src/game/models/village';
import { PROFESSIONS } from '../../src/game/rules/calendar';
import { INITIAL_CONFIG } from '../../src/game/rules/initialConfig';
import { selectHousingSummary, selectResidentDetails, selectVillageSummary } from '../../src/game/selectors/village';
import { validateNewVillage, validateVillageState } from '../../src/game/validation/village';
import { freezeDeep } from '../fixtures/simulation';

describe('Generación reproducible — GEN-01..15', () => {
  it('GEN-01: cien ejecuciones de una semilla producen exactamente el mismo mundo', () => {
    const expected = generateVillage('el-primer-arroyo');
    for (let run = 0; run < 100; run++) expect(generateVillage('el-primer-arroyo')).toEqual(expected);
  });

  it('GEN-02: distintas semillas del conjunto producen variaciones reales', () => {
    const villages = Array.from({ length: 30 }, (_, index) => generateVillage(`diversidad-${index}`));
    const identities = new Set(villages.map((village) => JSON.stringify(village.residents)));
    expect(identities.size).toBeGreaterThan(25);
    expect(new Set(villages.map((village) => village.residents.length)).size).toBeGreaterThan(1);
    expect(new Set(villages.map((village) => village.inventory.food)).size).toBeGreaterThan(1);
  });

  it('GEN-03..08/11..13: 1000 semillas conservan población, parentescos, camas y reservas', () => {
    const populationCounts = new Set<number>();
    const childCounts = new Set<number>();
    const familyKinds = new Set<string>();
    const familySizes = new Set<number>();
    const ages = new Set<number>();
    const food = new Set<number>();
    const wood = new Set<number>();
    let peopleChecked = 0;
    let familiesChecked = 0;

    for (let index = 0; index < 1000; index++) {
      const village = generateVillage(`censo-1000-${index}`);
      validateNewVillage(village);
      const people = new Map(village.residents.map((person) => [person.id, person]));
      expect(village.residents.length).toBeGreaterThanOrEqual(15);
      expect(village.residents.length).toBeLessThanOrEqual(20);
      expect(people.size).toBe(village.residents.length);
      expect(new Set(village.residents.map((person) => person.displayName)).size).toBe(village.residents.length);
      const children = village.residents.filter((person) => person.initialAge < 18);
      expect([2, 3]).toContain(children.length);
      expect(village.residents.length - children.length).toBeGreaterThanOrEqual(12);
      populationCounts.add(village.residents.length);
      childCounts.add(children.length);

      for (const person of village.residents) {
        expect(person.profession).toBeNull();
        expect(person.workplaceId).toBeNull();
        expect(person.alive).toBe(true);
        expect(Number.isInteger(person.birthDayOfYear)).toBe(true);
        expect(person.birthDayOfYear).toBeGreaterThanOrEqual(1);
        expect(person.birthDayOfYear).toBeLessThanOrEqual(336);
        expect(person.initialAge).toBeGreaterThanOrEqual(0);
        expect(person.initialAge).toBeLessThanOrEqual(INITIAL_CONFIG.adultAges[1]);
        ages.add(person.initialAge);
        for (const parentId of person.relations.parentIds) {
          const parent = people.get(parentId);
          expect(parent?.relations.childIds).toContain(person.id);
          if (!parent) throw new Error('Falta un progenitor en la prueba.');
          const difference = (getBirthElapsedDay(person) - getBirthElapsedDay(parent)) / 336;
          expect(difference).toBeGreaterThanOrEqual(18);
          expect(difference).toBeLessThanOrEqual(45);
        }
        for (const siblingId of person.relations.siblingIds) {
          expect(people.get(siblingId)?.relations.siblingIds).toContain(person.id);
          expect(siblingId).not.toBe(person.id);
        }
        if (person.relations.partnerId !== null) {
          expect(people.get(person.relations.partnerId)?.relations.partnerId).toBe(person.id);
          expect(person.initialAge).toBeGreaterThanOrEqual(18);
        }
        for (const attribute of ATTRIBUTE_KEYS) {
          expect(person.attributes[attribute]).toBeGreaterThanOrEqual(person.initialAge < 18 ? INITIAL_CONFIG.childAttributes[0] : INITIAL_CONFIG.attributes[0]);
          expect(person.attributes[attribute]).toBeLessThanOrEqual(person.initialAge < 18 ? INITIAL_CONFIG.childAttributes[1] : INITIAL_CONFIG.attributes[1]);
        }
        for (const profession of PROFESSIONS) {
          const skill = person.skills[profession];
          expect(skill.effective).toBeGreaterThanOrEqual(person.initialAge < 18 ? INITIAL_CONFIG.childSkills[0] : INITIAL_CONFIG.skills[0]);
          expect(skill.effective).toBeLessThanOrEqual(person.initialAge < 18 ? INITIAL_CONFIG.childSkills[1] : INITIAL_CONFIG.skills[1]);
          expect(skill.historicalBest).toBe(skill.effective);
          expect(skill.experience).toBe(0);
          expect(skill.potentialSecret).toBeGreaterThanOrEqual(INITIAL_CONFIG.potentials[0]);
          expect(skill.potentialSecret).toBeLessThanOrEqual(INITIAL_CONFIG.potentials[1]);
        }
      }

      const housing = selectHousingSummary(village);
      expect(housing.capacity).toBe(15);
      expect(housing.housed).toBe(15);
      expect(housing.unhousedIds.length).toBe(village.residents.length - 15);
      expect(village.housingAssignments).toHaveLength(village.residents.length);
      expect(village.housingAssignments.every((assignment) => assignment.source === 'system' && !assignment.locked)).toBe(true);
      for (const house of village.buildings.filter((building) => building.type === 'house')) {
        expect(village.housingAssignments.filter((assignment) => assignment.houseId === house.id).length).toBeLessThanOrEqual(house.housingCapacity);
      }
      for (const child of children) {
        const childHome = village.housingAssignments.find((assignment) => assignment.residentId === child.id)?.houseId;
        expect(childHome).toBeTruthy();
        for (const parentId of child.relations.parentIds) {
          expect(village.housingAssignments.find((assignment) => assignment.residentId === parentId)?.houseId).toBe(childHome);
        }
      }
      for (const family of village.families) {
        familyKinds.add(family.kind);
        familySizes.add(family.memberIds.length);
        expect(family.memberIds.every((id) => people.get(id)?.familyId === family.id)).toBe(true);
      }
      expect(village.buildings.filter((building) => building.type === 'house')).toHaveLength(3);
      expect(village.buildings.filter((building) => building.type === 'orchard')).toHaveLength(2);
      expect(village.buildings.filter((building) => building.type === 'warehouse')).toHaveLength(1);
      expect(village.buildings.every((building) => building.condition === 100)).toBe(true);
      expect(village.constructionSlots).toHaveLength(10);
      expect(village.constructionSlots.filter((slot) => slot.buildingId === null)).toHaveLength(4);
      expect(village.inventory.food).toBeGreaterThanOrEqual(INITIAL_CONFIG.food[0]);
      expect(village.inventory.food).toBeLessThanOrEqual(INITIAL_CONFIG.food[1]);
      expect(village.inventory.wood).toBeGreaterThanOrEqual(INITIAL_CONFIG.wood[0]);
      expect(village.inventory.wood).toBeLessThanOrEqual(INITIAL_CONFIG.wood[1]);
      expect(village.inventory.food + village.inventory.wood).toBeLessThanOrEqual(INITIAL_CONFIG.storageCapacity);
      food.add(village.inventory.food);
      wood.add(village.inventory.wood);
      peopleChecked += village.residents.length;
      familiesChecked += village.families.length;
    }
    expect([...populationCounts].sort((a, b) => a - b)).toEqual([15, 16, 17, 18, 19, 20]);
    expect([...childCounts].sort()).toEqual([2, 3]);
    expect([...familyKinds].sort()).toEqual(['parents-and-children', 'partners', 'siblings', 'single']);
    expect(familySizes).toContain(5);
    expect(familySizes).toContain(4);
    expect(familySizes).toContain(1);
    expect(ages.size).toBeGreaterThan(50);
    expect(food.size).toBeGreaterThan(30);
    expect(wood.size).toBeGreaterThan(15);
    console.info(`Censo de 1000 semillas: ${peopleChecked} habitantes y ${familiesChecked} hogares validados; población 15–20 y 2–3 menores.`);
  }, 20000);

  it('GEN-09: cada oficio dispone de un potencial propio y la vista pública lo omite', () => {
    const village = generateVillage('potenciales-individuales');
    const vectors = PROFESSIONS.map((profession) => village.residents.map((person) => person.skills[profession].potentialSecret));
    expect(new Set(vectors.map((vector) => JSON.stringify(vector))).size).toBe(4);
    for (const person of village.residents) {
      const details = selectResidentDetails(village, person.id);
      expect(details).not.toBeNull();
      expect(JSON.stringify(details)).not.toMatch(/potential|Secret|historicalBest|experience/);
      for (const profession of PROFESSIONS) expect(details?.skills[profession]).toBe(person.skills[profession].effective);
    }
  });

  it('GEN-14: reloj real y Math.random no participan en la creación', () => {
    let early;
    let late;
    vi.useFakeTimers();
    const random = vi.spyOn(Math, 'random').mockImplementation(() => { throw new Error('RNG sin semilla no permitido.'); });
    try {
      vi.setSystemTime(new Date('2001-01-01T00:00:00Z'));
      early = generateVillage('independiente-del-reloj');
      vi.setSystemTime(new Date('2099-12-31T23:59:59Z'));
      late = generateVillage('independiente-del-reloj');
    } finally {
      random.mockRestore();
      vi.useRealTimers();
    }
    expect(early).toEqual(late);
  });

  it('GEN-15: una creación fallida no modifica catálogos ni una aldea ya creada', () => {
    const previous = freezeDeep(generateVillage('intacta'));
    const before = JSON.stringify(previous);
    const configBefore = JSON.stringify(INITIAL_CONFIG);
    expect(() => generateVillage(null as unknown as string)).toThrow(TypeError);
    expect(JSON.stringify(previous)).toBe(before);
    expect(JSON.stringify(INITIAL_CONFIG)).toBe(configBefore);
    expect(generateVillage('intacta')).toEqual(previous);
  });
});

describe('Integración del mundo inicial con el motor temporal', () => {
  it('conserva la aldea completa al avanzar y no activa sistemas futuros', () => {
    const initial = freezeDeep(generateVillage('un-ano-en-la-aldea'));
    let current = initial;
    for (let month = 0; month < 12; month++) current = advanceDays(current, 28).state;
    validateVillageState(current);
    expect(current.elapsedDays).toBe(336);
    expect(current.families).toEqual(initial.families);
    expect(current.residents).toEqual(initial.residents);
    expect(current.buildings).toEqual(initial.buildings);
    expect(current.housingAssignments).toEqual(initial.housingAssignments);
    expect(current.inventory).toEqual(initial.inventory);
    expect(current.rng).toEqual(initial.rng);
    expect(current.chronicle.filter((entry) => entry.type === 'birthday')).toHaveLength(initial.residents.length);
    for (const person of current.residents) expect(getAge(person, current.elapsedDays)).toBe(person.initialAge + 1);
    expect(selectVillageSummary(current).economicSimulationActive).toBe(false);
  });

  it('mantiene el RNG posterior a la generación al serializar y continuar', () => {
    const village = generateVillage('continuacion-mundo');
    expect(village.rng).not.toEqual(createRng('continuacion-mundo'));
    const rng = restoreRng(JSON.parse(JSON.stringify(village.rng)));
    expect(nextRandom(rng)).toEqual(nextRandom(village.rng));
  });

  it('comparar estados congelados demuestra que inspeccionar no consume azar', () => {
    const initial = freezeDeep(generateVillage('inspeccion-sin-azar'));
    const before = JSON.stringify(initial);
    selectVillageSummary(initial);
    for (const person of [...initial.residents].reverse()) selectResidentDetails(initial, person.id);
    expect(JSON.stringify(initial)).toBe(before);
    expect(advanceDays(initial, 28).state).toEqual(advanceDays(generateVillage('inspeccion-sin-azar'), 28).state);
  });
});
