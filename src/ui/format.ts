import { getCalendarDate } from '../game/core/calendar';
import type { ChronicleEntry, Profession, Season } from '../game/models/simulation';
import type { AttributeKey } from '../game/models/village';
import type { VillageState } from '../game/models/village';

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
    case 'founded': return `Se funda la aldea con ${entry.population} habitantes.`;
    case 'year_changed': return `Comienza el año ${entry.year}.`;
    case 'season_changed': return `Llega ${SEASON_NAMES[entry.season].toLocaleLowerCase('es')}.`;
    case 'birthday': return `${name} cumple ${entry.age} años.`;
    case 'eligible_job': return `${name} alcanza la edad mínima para ${PROFESSION_NAMES[entry.profession].toLocaleLowerCase('es')}. Todavía no se asignan oficios.`;
  }
}
