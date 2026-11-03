import type { VillageState } from '../models/village';
import { getAge } from '../core/calendar';
import { STORY_RULES as R } from '../rules/story';

export function validateStory(village: VillageState): void {
  const check = (value: unknown, message: string) => { if (!value) throw new Error(`Suceso no válido: ${message}`); };
  const story = village.story;
  if (story) check(Number.isSafeInteger(story.nextCheckDay) && story.nextCheckDay >= 0, 'fecha de comprobación');
  if (story?.lastVisitorDay !== undefined) check(Number.isSafeInteger(story.lastVisitorDay) && story.lastVisitorDay >= 0 && story.lastVisitorDay <= village.elapsedDays, 'fecha de visitantes');
  const pending = story?.pending;
  const offered = village.chronicle.filter((entry) => entry.type === 'story_offered');
  const resolved = village.chronicle.filter((entry) => entry.type === 'story_resolved' || entry.type === 'visitors_resolved');
  const offersById = new Map(offered.map((entry) => [entry.eventId, entry]));
  const resultsById = new Map(resolved.map((entry) => [entry.eventId, entry]));
  const discoveries = new Map(village.chronicle.filter((entry) => entry.type === 'talent_discovered').map((entry) => [`${entry.residentId}:${entry.profession}:${entry.level}`, entry]));
  const people = new Map(village.residents.map((person) => [person.id, person]));
  check(offersById.size === offered.length && resultsById.size === resolved.length, 'suceso duplicado');
  if (pending) {
    check(pending.elapsedDay === village.elapsedDays && village.pendingDecision?.type === 'story_event' && village.pendingDecision.id === pending.id && village.pendingDecision.sinceElapsedDay === pending.elapsedDay, 'decisión ausente');
    const offer = offersById.get(pending.id);
    check(offer?.kind === pending.kind && offer.elapsedDay === pending.elapsedDay && !resultsById.has(pending.id), 'oferta incoherente');
    if (pending.kind === 'visitors') {
      const ids = pending.residents.map((person) => person.id);
      check(ids.length > 0 && ids.length <= 5 && new Set(ids).size === ids.length && !village.families.some((family) => family.id === pending.family.id), 'identidad de visitantes');
      check(pending.family.memberIds.length === ids.length && pending.family.memberIds.every((id) => ids.includes(id)), 'familia visitante');
      for (const person of pending.residents) {
        check(!village.residents.some((resident) => resident.id === person.id) && person.familyId === pending.family.id && person.alive && person.profession === null && person.workplaceId === null && person.arrivedAt === pending.elapsedDay, 'estado visitante');
        getAge(person, pending.elapsedDay);
        check([...person.relations.parentIds, ...person.relations.childIds, ...person.relations.siblingIds, ...(person.relations.partnerId ? [person.relations.partnerId] : [])].every((id) => ids.includes(id)), 'parentesco visitante');
      }
    } else {
      check(village.residents.some((person) => person.id === pending.residentId), 'participante ausente');
      if (pending.kind === 'urgent-repair') check(village.buildings.some((building) => building.id === pending.buildingId && building.collapsedAt === undefined), 'edificio ausente');
    }
  }
  if (village.pendingDecision?.type === 'story_event') check(pending?.id === village.pendingDecision.id, 'decisión sin suceso');
  for (const entry of offered) check(pending?.id === entry.eventId || resultsById.has(entry.eventId), 'oferta sin resolver');
  for (const entry of resolved) {
    check(offersById.get(entry.eventId)?.elapsedDay === entry.elapsedDay, 'resultado sin oferta');
    if (entry.type === 'visitors_resolved') check(entry.accepted ? entry.familyId !== null && village.families.some((family) => family.id === entry.familyId && JSON.stringify(family.memberIds) === JSON.stringify(entry.residentIds)) : entry.familyId === null && entry.residentIds.length === 0, 'incorporación incoherente');
    if (entry.type === 'story_resolved' && entry.buildingId !== null) check(village.buildings.some((building) => building.id === entry.buildingId), 'reparación sin edificio');
  }
  for (const person of village.residents) {
    if (person.arrivedAt !== undefined) check(Number.isSafeInteger(person.arrivedAt) && person.arrivedAt >= 0 && person.arrivedAt <= village.elapsedDays, 'llegada futura');
    const talents = person.talents ?? [];
    check(new Set(talents.map((talent) => `${talent.profession}:${talent.level}`)).size === talents.length, 'talento duplicado');
    for (const talent of talents) {
      const skill = person.skills[talent.profession];
      check(talent.elapsedDay <= village.elapsedDays && talent.elapsedDay >= (person.arrivedAt ?? 0) && skill.potentialSecret >= R.talentPotential
        && skill.experience >= (talent.level === 'confirmed' ? R.confirmedExperience : R.promisingExperience), 'talento sin trayectoria');
      check(discoveries.get(`${person.id}:${talent.profession}:${talent.level}`)?.elapsedDay === talent.elapsedDay, 'talento sin historia');
    }
  }
  for (const entry of village.chronicle) if (entry.type === 'talent_discovered') {
    const person = people.get(entry.residentId);
    check(person?.talents?.some((talent) => talent.profession === entry.profession && talent.level === entry.level && talent.elapsedDay === entry.elapsedDay), 'descubrimiento sin talento');
    check(entry.level === 'confirmed' ? entry.potential === person?.skills[entry.profession].potentialSecret : entry.potential === undefined, 'revelación incoherente');
  }
}
