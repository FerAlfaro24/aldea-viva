import type { VillageState } from '../models/village';
import { selectStorage } from '../selectors/storage';
import { validateVillageState } from '../validation/village';
import { roundResource } from '../rules/resources';
import { isStanding } from '../selectors/survival';

// Valores provisionales aprobados para el paso de grado 1 a 2.
export const EXPANSION_RULES = { population: 15, food: 150, condition: 80, wood: 50, addedSlots: 4, firstMonth: 28 } as const;

export function selectExpansion(village: VillageState) {
  const r = EXPANSION_RULES;
  const requirements = [
    { label: `Al menos ${r.population} habitantes`, met: village.residents.filter((person) => person.alive).length >= r.population },
    { label: `Al menos ${r.food} alimentos almacenados`, met: village.inventory.food >= r.food },
    { label: `Todos los edificios al ${r.condition} % o más`, met: village.buildings.some(isStanding) && village.buildings.filter(isStanding).every((building) => building.condition >= r.condition) },
    { label: `${r.wood} de madera disponible (coste)`, met: selectStorage(village).availableWood >= r.wood },
    { label: 'Primer mes completado (28 días)', met: village.elapsedDays >= r.firstMonth },
  ];
  return { requirements, completed: village.grade >= 2, allowed: village.grade === 1 && requirements.every((entry) => entry.met) };
}

export function expandVillage(village: VillageState): VillageState {
  validateVillageState(village);
  if (!selectExpansion(village).allowed) throw new Error('No se cumplen los requisitos de esta ampliación, o ya se realizó.');
  const used = new Set([village.id, ...village.residents.map((value) => value.id), ...village.families.map((value) => value.id),
    ...village.buildings.map((value) => value.id), ...village.constructionSlots.map((value) => value.id), ...(village.constructionProjects ?? []).map((value) => value.id)]);
  const newSlots: VillageState['constructionSlots'][number][] = [];
  let suffix = village.constructionSlots.length + 1;
  while (newSlots.length < EXPANSION_RULES.addedSlots) {
    const id = `s${String(suffix++).padStart(4, '0')}`;
    if (!used.has(id)) { used.add(id); newSlots.push({ id, buildingId: null }); }
  }
  const next: VillageState = { ...village, grade: 2, constructionSlots: [...village.constructionSlots, ...newSlots],
    inventory: { ...village.inventory, wood: roundResource(village.inventory.wood - EXPANSION_RULES.wood) },
    chronicle: [...village.chronicle, { id: `expansion:${village.elapsedDays}:${village.chronicle.length}`, type: 'village_expanded', elapsedDay: village.elapsedDays,
      fromGrade: 1, toGrade: 2, addedSlots: EXPANSION_RULES.addedSlots, woodCost: EXPANSION_RULES.wood }],
  };
  validateVillageState(next);
  return next;
}
