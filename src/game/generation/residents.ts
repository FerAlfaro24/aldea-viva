import type { Attributes, Family, Resident, Skill } from '../models/village';
import type { Profession } from '../models/simulation';
import { DAYS_PER_YEAR } from '../rules/calendar';
import { INITIAL_CONFIG } from '../rules/initialConfig';
import { deriveInitialClues } from './clues';
import { planHouseholds } from './families';
import { FAMILY_NAMES, GIVEN_NAMES } from './names';
import type { GenerationRandom } from './random';

function generateAttributes(random: GenerationRandom, initialAge: number): Attributes {
  const config = INITIAL_CONFIG;
  const childMaximum = Math.floor(config.childAttributes[1] * (initialAge + 1) / (config.childAges[1] + 1));
  const draw = () => initialAge <= config.childAges[1]
    ? random.int(config.childAttributes[0], childMaximum) : random.int(...config.attributes);
  return { strength: draw(), endurance: draw(), agility: draw(), dexterity: draw(), vitality: draw() };
}

function generateSkills(random: GenerationRandom, initialAge: number): Readonly<Record<Profession, Skill>> {
  const config = INITIAL_CONFIG;
  const draw = (): Skill => {
    const effective = initialAge <= config.childAges[1]
      ? random.int(config.childSkills[0], Math.floor(config.childSkills[1] * (initialAge + 1) / (config.childAges[1] + 1)))
      : random.int(...config.skills);
    return { effective, historicalBest: effective, experience: 0, potentialSecret: random.int(...INITIAL_CONFIG.potentials) };
  };
  return { farmer: draw(), builder: draw(), woodcutter: draw(), warrior: draw() };
}

export function generatePopulation(random: GenerationRandom): { readonly residents: readonly Resident[]; readonly families: readonly Family[] } {
  const plans = planHouseholds(random);
  const names = random.shuffle(GIVEN_NAMES);
  const surnames = random.shuffle(FAMILY_NAMES);
  const residents: Resident[] = [];
  const families: Family[] = [];

  for (const [familyIndex, plan] of plans.entries()) {
    const familyId = `f${String(familyIndex + 1).padStart(4, '0')}`;
    const surname = surnames[familyIndex];
    if (surname === undefined) throw new Error('El catálogo de apellidos no alcanza para la población.');
    const memberIds = plan.ages.map((_, index) => `r${String(residents.length + index + 1).padStart(4, '0')}`);
    families.push({ id: familyId, displayName: `Hogar ${surname}`, kind: plan.kind, memberIds });

    for (const [memberIndex, initialAge] of plan.ages.entries()) {
      const id = memberIds[memberIndex];
      const name = names[residents.length];
      if (id === undefined || name === undefined) throw new Error('No hay identidad disponible para un habitante.');
      const isParent = plan.kind === 'parents-and-children' && memberIndex < 2;
      const isChild = plan.kind === 'parents-and-children' && memberIndex >= 2;
      const isPartner = plan.kind === 'partners' || isParent;
      const partnerId = isPartner ? memberIds[memberIndex === 0 ? 1 : 0] : null;
      if (isPartner && !partnerId) throw new Error('La pareja debe tener dos integrantes.');
      const attributes = generateAttributes(random, initialAge);
      const skills = generateSkills(random, initialAge);
      residents.push({
        id, displayName: `${name} ${surname}`, familyId, initialAge,
        birthDayOfYear: random.int(1, DAYS_PER_YEAR), alive: true,
        profession: null, workplaceId: null,
        relations: {
          parentIds: isChild ? memberIds.slice(0, 2) : [],
          childIds: isParent ? memberIds.slice(2) : [],
          siblingIds: plan.kind === 'siblings'
            ? memberIds.filter((member) => member !== id)
            : isChild ? memberIds.slice(2).filter((member) => member !== id) : [],
          partnerId: partnerId ?? null,
        },
        attributes, skills,
        condition: { health: INITIAL_CONFIG.initialHealth, hunger: INITIAL_CONFIG.initialHunger },
        initialClueIds: deriveInitialClues(attributes, skills),
        origin: plan.kind === 'single'
          ? 'Llegó por su cuenta para formar parte de la nueva aldea.'
          : plan.kind === 'siblings'
            ? 'Llegó con sus hermanos al fundarse la aldea.'
            : plan.kind === 'partners'
              ? 'Llegó con su pareja para comenzar una vida en la aldea.'
              : 'Su familia forma parte de los primeros habitantes de la aldea.',
      });
    }
  }
  return { residents, families };
}
