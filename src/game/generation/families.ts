import type { FamilyKind } from '../models/village';
import { INITIAL_CONFIG } from '../rules/initialConfig';
import type { GenerationRandom } from './random';

export interface HouseholdPlan {
  readonly kind: FamilyKind;
  // En hogares con hijos, las dos primeras personas son sus progenitores.
  readonly ages: readonly number[];
}

function partners(random: GenerationRandom): HouseholdPlan {
  const config = INITIAL_CONFIG;
  const first = random.int(...config.adultAges);
  const second = random.int(
    Math.max(config.adultAges[0], first - config.partnerAgeDifference),
    Math.min(config.adultAges[1], first + config.partnerAgeDifference),
  );
  return { kind: 'partners', ages: [first, second] };
}

function siblings(random: GenerationRandom, count: number): HouseholdPlan {
  const config = INITIAL_CONFIG;
  let age = random.int(config.adultAges[0], config.adultAges[1] - (count - 1) * config.siblingAgeGaps[1]);
  const ages = [age];
  for (let index = 1; index < count; index++) {
    age += random.int(...config.siblingAgeGaps);
    ages.push(age);
  }
  return { kind: 'siblings', ages };
}

export function planHouseholds(random: GenerationRandom): readonly HouseholdPlan[] {
  const config = INITIAL_CONFIG;
  const population = random.int(...config.population);
  const childrenCount = random.int(...config.children);
  const childrenAges = [random.int(config.childAges[0], config.childAges[1] - (childrenCount - 1) * config.childAgeGaps[1])];
  for (let child = 1; child < childrenCount; child++) {
    const previous = childrenAges[child - 1];
    if (previous === undefined) throw new Error('Falta una edad en el plan familiar.');
    childrenAges.push(previous + random.int(...config.childAgeGaps));
  }
  const youngest = Math.min(...childrenAges);
  const oldest = Math.max(...childrenAges);
  // Un año de margen cubre la diferencia entre cumpleaños individuales.
  const parentMin = Math.max(config.adultAges[0], oldest + config.minimumParentGap + 1);
  const parentMax = Math.min(config.adultAges[1], youngest + config.maximumParentGap - 1);
  const plans: HouseholdPlan[] = [
    { kind: 'parents-and-children', ages: [random.int(parentMin, parentMax), random.int(parentMin, parentMax), ...childrenAges] },
    siblings(random, random.int(2, 3)),
    partners(random),
    { kind: 'single', ages: [random.int(...config.adultAges)] },
  ];

  let remaining = population - plans.reduce((total, plan) => total + plan.ages.length, 0);
  while (remaining > 0) {
    const choice = random.int(0, 2);
    const plan: HouseholdPlan = remaining === 1 || choice === 0
      ? { kind: 'single', ages: [random.int(...config.adultAges)] }
      : choice === 1 ? partners(random) : siblings(random, Math.min(remaining, random.int(2, 3)));
    plans.push(plan);
    remaining -= plan.ages.length;
  }
  return plans;
}
