// Recursos con dos decimales; las operaciones de reparto se realizan en centésimas enteras.
export const resourceUnits = (value: number): number => Math.round(value * 100);
export const resourceAmount = (units: number): number => units / 100;
export const roundResource = (value: number): number => resourceAmount(resourceUnits(value));
export function isResourceAmount(value: number): boolean {
  return Number.isFinite(value) && value >= 0 && Number.isSafeInteger(resourceUnits(value))
    && Math.abs(value * 100 - resourceUnits(value)) < 0.00001;
}
