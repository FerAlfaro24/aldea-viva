import type { VillageState } from '../models/village';
import { selectStorage } from '../selectors/storage';
import { validateVillageState } from '../validation/village';
import { isResourceAmount, roundResource } from '../rules/resources';

// Contrato de entrada para los sistemas que entreguen recursos; sin botones de
// crear recursos en la UI. El llamante recibe también la cantidad rechazada.
// Paso interno de entrega: el avance diario valida el mundo completo al entrar y salir.
export function storeDelivery(village: VillageState, resource: 'food' | 'wood', quantity: number) {
  if (resource !== 'food' && resource !== 'wood') throw new Error('Recurso desconocido.');
  if (!isResourceAmount(quantity)) throw new Error('Cantidad de recursos no válida. Usa como máximo dos decimales.');
  const accepted = Math.min(quantity, selectStorage(village).free);
  const state = accepted === 0 ? village : { ...village, inventory: { ...village.inventory, [resource]: roundResource(village.inventory[resource] + accepted) } };
  return { state, accepted, rejected: roundResource(quantity - accepted) };
}

export function receiveResource(village: VillageState, resource: 'food' | 'wood', quantity: number) {
  validateVillageState(village);
  const receipt = storeDelivery(village, resource, quantity);
  validateVillageState(receipt.state);
  return receipt;
}
