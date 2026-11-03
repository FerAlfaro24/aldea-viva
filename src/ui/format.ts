import { getCalendarDate } from '../game/core/calendar';
import type { ChronicleEntry, Profession, Season } from '../game/models/simulation';
import type { AttributeKey } from '../game/models/village';
import type { VillageState } from '../game/models/village';
import { CONSTRUCTION_CATALOG } from '../game/rules/construction';
import type { FoodPriority, Ration } from '../game/models/economy';
import type { HealthWarning, SurvivalCause, WinterSeverity } from '../game/models/survival';
import type { DefenseTactic } from '../game/models/defense';
import type { StoryChoice, StoryKind } from '../game/models/story';
export const STORY_NAMES: Readonly<Record<StoryKind, string>> = { 'harvest-trial': 'Un ensayo en el huerto', 'forest-route': 'Una ruta difícil del bosque', 'urgent-repair': 'Una reparación que no puede esperar', visitors: 'Personas en los caminos' };
export const STORY_CHOICE_NAMES: Readonly<Record<StoryChoice, string>> = { decline: 'Dejar pasar', careful: 'Intentarlo con prudencia', bold: 'Asumir más riesgo', patch: 'Apuntalar con lo justo', reinforce: 'Reforzar con más madera', accept: 'Acoger a los visitantes', reject: 'Rechazar la llegada' };
export const TACTIC_NAMES: Readonly<Record<DefenseTactic, string>> = { defend: 'Defender la aldea', 'protect-storage': 'Proteger el almacén', negotiate: 'Negociar', sortie: 'Realizar una salida' };
export const WINTER_NAMES: Readonly<Record<WinterSeverity | 'uncertain', string>> = { mild: 'Suave', normal: 'Normal', harsh: 'Duro', uncertain: 'Incierto' };
export const HEALTH_NAMES: Readonly<Record<HealthWarning, string>> = { well: 'Estable', hungry: 'Con hambre', weak: 'Debilitado', critical: 'En estado crítico' };
export const SURVIVAL_CAUSE_NAMES: Readonly<Record<SurvivalCause, string>> = { hunger: 'Hambre prolongada', cold: 'Frío y exposición', combined: 'Hambre y frío', combat: 'Heridas de combate', accident: 'Accidente durante una tarea arriesgada' };

export const RATION_NAMES: Readonly<Record<Ration, string>> = { abundant: 'Abundante', normal: 'Normal', reduced: 'Reducida', emergency: 'Emergencia' };
export const FOOD_PRIORITY_NAMES: Readonly<Record<FoodPriority, string>> = { balanced: 'Equilibrada', children: 'Menores', workers: 'Trabajadores', houses: 'Viviendas señaladas' };
const resourceFormat = new Intl.NumberFormat('es', { maximumFractionDigits: 2 });
export const quantityLabel = (value: number): string => resourceFormat.format(value);

export const SEASON_NAMES: Readonly<Record<Season, string>> = {
  spring: 'Primavera', summer: 'Verano', autumn: 'Otoño', winter: 'Invierno',
};
export const PROFESSION_NAMES: Readonly<Record<Profession, string>> = {
  farmer: 'Agricultura', builder: 'Construcción', woodcutter: 'Tala', warrior: 'Combate',
};
export const ATTRIBUTE_NAMES: Readonly<Record<AttributeKey, string>> = {
  strength: 'Fuerza', endurance: 'Resistencia', agility: 'Agilidad', dexterity: 'Destreza', vitality: 'Vitalidad',
};

export function html(value: string | number): string {
  return String(value).replace(/[&<>"']/g, (character) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[character] ?? character;
  });
}

export function dateLabel(elapsedDays: number): string {
  const date = getCalendarDate(elapsedDays);
  return `Año ${date.year} · Mes ${date.month} · Día ${date.dayOfMonth}`;
}

export function eventLabel(entry: ChronicleEntry, village: VillageState): string {
  const name = 'residentId' in entry
    ? village.residents.find((person) => person.id === entry.residentId)?.displayName ?? 'Habitante'
    : '';
  switch (entry.type) {
    case 'story_offered': return `${STORY_NAMES[entry.kind]}${name ? `: ${name}` : ''}. El tiempo se detiene para que elijas en Sucesos.`;
    case 'story_resolved': return `${STORY_NAMES[entry.kind]} · ${name}: ${STORY_CHOICE_NAMES[entry.choice]}. ${entry.choice === 'decline' ? 'La oportunidad se deja pasar, sin consecuencias.' : `${entry.success ? 'El intento sale bien' : 'El intento falla'} (${entry.successPercent} % previsto). Aprende ${entry.experience} XP. Coste: ${quantityLabel(entry.foodCost)} alimentos y ${quantityLabel(entry.woodCost)} maderas. Almacenado: ${quantityLabel(entry.foodGained)} alimentos y ${quantityLabel(entry.woodGained)} maderas; rechazado por espacio: ${quantityLabel(entry.foodRejected + entry.woodRejected)}. ${entry.healthLost ? `Pierde ${quantityLabel(entry.healthLost)} de salud.` : ''}${entry.buildingChange ? ` El edificio recupera ${quantityLabel(entry.buildingChange)} de conservación.` : ''}`}`;
    case 'visitors_resolved': return entry.accepted ? `Acoges a ${entry.names.join(', ')}. Llegan sin oficio; se ocupan solo camas libres. A partir del próximo día necesitan alimento y refugio.` : `Decides no acoger a ${entry.names.join(', ')}. Siguen su camino y la población no cambia.`;
    case 'work_insight': return `${name} encuentra una mejora durante su jornada de ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}: aprende ${entry.experience} XP adicionales sin interrumpir el día.`;
    case 'talent_discovered': return entry.level === 'confirmed' ? `La trayectoria de ${name} confirma su talento para ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}. Potencial conocido: ${entry.potential} / 100.` : `${name} demuestra una facilidad especial para ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}. La práctica revela una aptitud prometedora; su límite todavía se desconoce.`;
    case 'bandit_warning': return `Huellas y exploradores anuncian ${entry.attackers} bandoleros. Llegada prevista: ${dateLabel(entry.arrivalDay)}. Prepara la defensa.`;
    case 'bandit_attack': return `${entry.surprise ? 'Por sorpresa, llegan' : 'Llegan'} ${entry.attackers} bandoleros. El tiempo se detiene hasta que decidas en Defensa.`;
    case 'bandit_resolved': return `${TACTIC_NAMES[entry.tactic]}: ${entry.success ? 'la táctica tiene éxito' : 'la táctica falla'} (estimación ${entry.successPercent} %). Tributo: ${quantityLabel(entry.paidFood)} alimentos y ${quantityLabel(entry.paidWood)} de madera. Robado: ${quantityLabel(entry.stolenFood)} alimentos y ${quantityLabel(entry.stolenWood)} de madera. ${entry.injuredIds.length} heridos y ${entry.deadIds.length} fallecidos. ${entry.damagedBuildingId ? `${village.buildings.find((building) => building.id === entry.damagedBuildingId)?.displayName ?? 'Edificio'} pierde ${quantityLabel(entry.buildingDamage)} de conservación.` : 'Sin daños en edificios.'} ${entry.cancelledProjectIds.length ? `${entry.cancelledProjectIds.length} obras canceladas al perder sus materiales reservados.` : ''}`;
    case 'winter_outlook': return `Indicios de un invierno ${WINTER_NAMES[entry.forecast].toLocaleLowerCase('es')} para el año ${entry.year}. La previsión es imperfecta; prepara alimentos y refugio.`;
    case 'winter_started': return `Comienza un invierno ${WINTER_NAMES[entry.severity].toLocaleLowerCase('es')}. La conservación de las viviendas determina su protección.`;
    case 'health_warning': return `${name}: ${HEALTH_NAMES[entry.warning].toLocaleLowerCase('es')}. Salud ${quantityLabel(entry.health)}, hambre ${quantityLabel(entry.hunger)}.`;
    case 'resident_died': return `${name} fallece por ${SURVIVAL_CAUSE_NAMES[entry.cause].toLocaleLowerCase('es')}. Su muerte es permanente y su historia se conserva.`;
    case 'medical_episode': return entry.action === 'injury' ? `${name} sufre ${entry.cause === 'accident' ? 'un accidente durante una tarea' : 'heridas de combate'}. Reposo al menos hasta ${dateLabel(entry.untilElapsedDay)}; conserva su oficio y necesita recuperarse.` : entry.action === 'recovered' ? `${name} se recupera y puede retomar su oficio anterior.` : entry.action === 'rescue'
      ? `${name} sobrevive excepcionalmente con 1 de salud. Queda estabilizado siete días, incapacitado al menos hasta ${dateLabel(entry.untilElapsedDay)} y con secuelas permanentes.`
      : `${name} enferma por ${SURVIVAL_CAUSE_NAMES[entry.cause].toLocaleLowerCase('es')}; necesita reposo y alimento. Revisión desde ${dateLabel(entry.untilElapsedDay)}.`;
    case 'building_warning': return `${village.buildings.find((building) => building.id === entry.buildingId)?.displayName ?? 'Edificio'}: conservación ${quantityLabel(entry.condition)} / 100. ${entry.level >= 4 ? 'Riesgo de derrumbe: siete días en cero lo destruyen.' : entry.level === 3 ? 'Inutilizable: necesita constructores autorizados.' : 'Autoriza mantenimiento para evitar que se deteriore más.'}`;
    case 'building_collapsed': return `${village.buildings.find((building) => building.id === entry.buildingId)?.displayName ?? 'Edificio'} se derrumba. ${entry.displacedResidentIds.length} personas quedan sin vivienda; se pierden ${quantityLabel(entry.lostFood)} alimentos y ${quantityLabel(entry.lostWood)} de madera. ${entry.cancelledProjectIds.length} obras canceladas por pérdida de materiales. El solar queda libre.`;
    case 'village_ended': return `Fallece el último superviviente. La historia termina tras ${entry.elapsedDay} días y conserva la memoria de sus ${entry.populationLost} habitantes.`;
    case 'economy_policy_changed': return `Cambias la política: ración ${RATION_NAMES[entry.policy.ration].toLocaleLowerCase('es')}, preferencia ${FOOD_PRIORITY_NAMES[entry.policy.priority].toLocaleLowerCase('es')} y ${entry.policy.deliveryPriority === 'food' ? 'alimentos' : 'madera'} primero en el almacén.`;
    case 'economy_day': return `Balance diario: ${quantityLabel(entry.foodStored)} alimentos y ${quantityLabel(entry.woodStored)} de madera almacenados. Alimentos solicitados: ${quantityLabel(entry.foodRequested)}; servidos y consumidos: ${quantityLabel(entry.foodConsumed)}; faltantes: ${quantityLabel(entry.foodMissing)}. Rechazados por falta de espacio: ${quantityLabel(entry.foodRejected)} alimentos y ${quantityLabel(entry.woodRejected)} de madera. Obras y reparaciones: ${quantityLabel(entry.workWoodSpent)} de madera. Reservas finales: ${quantityLabel(entry.closingFood)} alimentos y ${quantityLabel(entry.closingWood)} de madera.`;
    case 'job_changed': return entry.profession === null ? `${name} queda sin oficio por tu decisión.` : `${name} recibe una orden de ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}${entry.manualLock ? ' con destino exclusivo' : ' en modo flexible'}.`;
    case 'building_repaired': return `Se repara ${village.buildings.find((building) => building.id === entry.buildingId)?.displayName ?? 'un edificio'}: conservación ${entry.condition} / 100, coste ${entry.woodCost} de madera.`;
    case 'village_expanded': return `La aldea alcanza el grado ${entry.toGrade}: ${entry.addedSlots} solares nuevos por ${entry.woodCost} de madera.`;
    case 'maintenance_changed': {
      if (entry.buildingId === null) return `Fijas la reserva mínima para el mantenimiento automático en ${entry.minimumWoodReserve} de madera.`;
      const building = village.buildings.find((candidate) => candidate.id === entry.buildingId)?.displayName ?? 'Edificio';
      return entry.priority === null ? `Retiras la autorización de mantenimiento de ${building}.` : `Autorizas el mantenimiento de ${building} con prioridad ${entry.priority === 'high' ? 'alta' : 'normal'}.`;
    }
    case 'founded': return `Se funda la aldea con ${entry.population} habitantes.`;
    case 'year_changed': return `Comienza el año ${entry.year}.`;
    case 'season_changed': return `Llega ${SEASON_NAMES[entry.season].toLocaleLowerCase('es')}.`;
    case 'birthday': return `${name} cumple ${entry.age} años.`;
    case 'eligible_job': return `${name} alcanza la edad mínima para ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}. Tú decides si le asignas ese oficio.`;
    case 'housing_changed': {
      const houseName = (id: string) => village.buildings.find((building) => building.id === id)?.displayName ?? 'una vivienda anterior';
      return `${name} se traslada ${entry.fromHouseId ? `de ${houseName(entry.fromHouseId)}` : 'desde fuera de las viviendas'} a ${houseName(entry.toHouseId)} por tu decisión.`;
    }
    case 'construction_changed': {
      const action = { prepared: 'Preparas', paused: 'Pausas', resumed: 'Reanudas', cancelled: 'Cancelas', started: 'Comienza', completed: 'Termina' }[entry.action];
      const slot = village.constructionSlots.findIndex((candidate) => candidate.id === entry.slotId) + 1;
      const materials = entry.materialsConsumed ? (entry.action === 'started' ? 'consumidas al iniciar' : 'ya consumidas, sin nuevo cobro ni devolución') : entry.action === 'cancelled' ? 'liberadas' : 'reservadas';
      return `${action} una obra de ${CONSTRUCTION_CATALOG[entry.buildingType].label.toLocaleLowerCase('es')} en el solar ${slot}. ${entry.reservedWood} unidades de madera ${materials}.`;
    }
  }
}
