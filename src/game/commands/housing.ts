import type { VillageState } from '../models/village';
import { validateVillageState } from '../validation/village';
import { isBuildingUsable } from '../selectors/survival';

export function moveResident(village: VillageState, residentId: string, toHouseId: string): VillageState {
  validateVillageState(village);
  const resident = village.residents.find((person) => person.id === residentId);
  if (!resident?.alive) throw new Error('No se puede cambiar la vivienda de este habitante.');
  const assignment = village.housingAssignments.find((entry) => entry.residentId === residentId)!;
  const destination = village.buildings.find((building) => building.id === toHouseId);
  if (destination?.type !== 'house' || !isBuildingUsable(destination)) throw new Error('Elige una vivienda habitable de la aldea.');
  if (assignment.houseId === toHouseId) return village;
  const occupied = village.housingAssignments.filter((entry) => entry.houseId === toHouseId).length;
  if (occupied >= destination.housingCapacity) throw new Error('Esta casa no tiene plazas libres. La vivienda anterior se conserva.');
  const next: VillageState = {
    ...village,
    housingAssignments: village.housingAssignments.map((entry) => entry.residentId === residentId
      ? { ...entry, houseId: toHouseId, source: 'player', locked: true } : entry),
    chronicle: [...village.chronicle, { id: `housing:${village.elapsedDays}:${residentId}:${village.chronicle.length}`,
      type: 'housing_changed', elapsedDay: village.elapsedDays, residentId, fromHouseId: assignment.houseId, toHouseId }],
  };
  validateVillageState(next);
  return next;
}
