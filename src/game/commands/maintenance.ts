import type { MaintenanceSettings, VillageState } from '../models/village';
import { validateVillageState } from '../validation/village';
import { markUnavailableWork } from '../selectors/work';

export function selectMaintenance(village: VillageState): MaintenanceSettings {
  return village.maintenance ?? { minimumWoodReserve: 0, orders: [] };
}

export function configureMaintenance(village: VillageState, buildingId: string | null, priority: 'normal' | 'high' | null, minimumWoodReserve?: number): VillageState {
  validateVillageState(village);
  const settings = selectMaintenance(village);
  let nextSettings: MaintenanceSettings;
  if (buildingId === null) {
    if (!Number.isSafeInteger(minimumWoodReserve) || minimumWoodReserve! < 0) throw new Error('La reserva mínima debe ser un entero no negativo.');
    if (settings.minimumWoodReserve === minimumWoodReserve) return village;
    nextSettings = { ...settings, minimumWoodReserve: minimumWoodReserve! };
  } else {
    if (!village.buildings.some((building) => building.id === buildingId)) throw new Error('Edificio de mantenimiento desconocido.');
    if (priority !== null && priority !== 'normal' && priority !== 'high') throw new Error('Prioridad desconocida.');
    const current = settings.orders.find((order) => order.buildingId === buildingId);
    if ((current?.priority ?? null) === priority) return village;
    nextSettings = { ...settings, orders: [...settings.orders.filter((order) => order.buildingId !== buildingId), ...(priority ? [{ buildingId, priority }] : [])] };
  }
  const next: VillageState = markUnavailableWork({ ...village, maintenance: nextSettings,
    chronicle: [...village.chronicle, { id: `maintenance:${village.elapsedDays}:${village.chronicle.length}`, type: 'maintenance_changed', elapsedDay: village.elapsedDays,
      buildingId, priority: buildingId === null ? null : priority, minimumWoodReserve: nextSettings.minimumWoodReserve }],
  });
  validateVillageState(next);
  return next;
}
