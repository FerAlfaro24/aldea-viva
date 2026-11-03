import type { VillageState } from '../models/village';
import { GenerationRandom } from './random';
import { generatePopulation } from './residents';

export function generateVisitors(village: VillageState, eventId: string) {
  const random = new GenerationRandom(village.rng);
  const population = generatePopulation(random);
  const family = population.families[random.int(0, population.families.length - 1)]!;
  const familyId = `family:${eventId}`;
  const id = (old: string) => `visitor:${eventId}:${old}`;
  const residents = population.residents.filter((person) => family.memberIds.includes(person.id)).map((person) => ({
    ...person, id: id(person.id), familyId, arrivedAt: village.elapsedDays,
    origin: 'Llegó por los caminos y solicitó formar parte de la aldea.',
    relations: { parentIds: person.relations.parentIds.map(id), childIds: person.relations.childIds.map(id),
      siblingIds: person.relations.siblingIds.map(id), partnerId: person.relations.partnerId === null ? null : id(person.relations.partnerId) },
  }));
  return { residents, family: { ...family, id: familyId, memberIds: family.memberIds.map(id) }, rng: random.snapshot() };
}
