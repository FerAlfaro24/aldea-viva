import type { Building, Family, HousingAssignment, Resident } from '../models/village';
import { INITIAL_CONFIG } from '../rules/initialConfig';

export function allocateInitialHousing(
  residents: readonly Resident[],
  families: readonly Family[],
  buildings: readonly Building[],
): readonly HousingAssignment[] {
  const houses = buildings.filter((building) => building.type === 'house')
    .sort((left, right) => left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  const freeBeds = new Map(houses.map((house) => [house.id, house.housingCapacity]));
  const byId = new Map(residents.map((resident) => [resident.id, resident]));
  const assignments = new Map<string, string | null>();
  const getMember = (id: string): Resident => {
    const member = byId.get(id);
    if (!member) throw new Error('Una familia referencia a un habitante inexistente.');
    return member;
  };
  const familyPriority = (family: Family) => family.memberIds.some((id) => getMember(id).initialAge < INITIAL_CONFIG.adultAges[0]) ? 0 : family.memberIds.length > 1 ? 1 : 2;
  const ordered = [...families].sort((left, right) => {
    return familyPriority(left) - familyPriority(right) || right.memberIds.length - left.memberIds.length
      || (left.id < right.id ? -1 : left.id > right.id ? 1 : 0);
  });

  for (const family of ordered) {
    const memberIds = [...family.memberIds].sort();
    const size = memberIds.length;
    const wholeHouse = houses
      .filter((house) => (freeBeds.get(house.id) ?? 0) >= size)
      .sort((left, right) => (freeBeds.get(left.id) ?? 0) - (freeBeds.get(right.id) ?? 0))[0];
    if (wholeHouse) {
      for (const id of memberIds) assignments.set(id, wholeHouse.id);
      freeBeds.set(wholeHouse.id, (freeBeds.get(wholeHouse.id) ?? 0) - size);
      continue;
    }

    // Si no cabe el hogar completo, aprovechar camas reales sin inventar plazas.
    for (const id of memberIds) {
      const house = houses.filter((candidate) => (freeBeds.get(candidate.id) ?? 0) > 0)
        .sort((left, right) => (freeBeds.get(right.id) ?? 0) - (freeBeds.get(left.id) ?? 0))[0];
      assignments.set(id, house?.id ?? null);
      if (house) freeBeds.set(house.id, (freeBeds.get(house.id) ?? 0) - 1);
    }
  }
  return residents.map((resident) => ({ residentId: resident.id, houseId: assignments.get(resident.id) ?? null, source: 'system', locked: false }));
}
