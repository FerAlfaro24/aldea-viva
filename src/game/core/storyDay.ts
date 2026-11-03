import type { ChronicleEntry, Profession } from '../models/simulation';
import type { Resident, VillageState } from '../models/village';
import { STORY_RULES as R } from '../rules/story';
import { PROFESSIONS } from '../rules/calendar';
import { eligibleStories, storyWorkers } from '../selectors/story';
import { isGameOver } from '../selectors/survival';
import { generateVisitors } from '../generation/visitors';
import { randomInt } from './rng';

export function awardExperience(person: Resident, profession: Profession, experience: number): Resident {
  const skill = person.skills[profession];
  const effective = Number(Math.min(Math.max(skill.potentialSecret, skill.historicalBest), skill.effective + experience / 100 * (skill.effective < skill.historicalBest ? 2 : 1)).toFixed(3));
  return { ...person, skills: { ...person.skills, [profession]: { ...skill, effective, historicalBest: Math.max(skill.historicalBest, effective), experience: Math.min(1_000_000, skill.experience + experience) } } };
}
export function discoverTalents(village: VillageState, previous: VillageState): VillageState {
  const events: ChronicleEntry[] = [];
  const before = new Map(previous.residents.map((person) => [person.id, person]));
  const residents = village.residents.map((person) => {
    if (!person.alive) return person;
    const talents = [...(person.talents ?? [])];
    for (const profession of PROFESSIONS) {
      const skill = person.skills[profession];
      if (skill.experience <= (before.get(person.id)?.skills[profession].experience ?? skill.experience) || skill.potentialSecret < R.talentPotential) continue;
      const promising = talents.some((talent) => talent.profession === profession && talent.level === 'promising');
      const confirmed = talents.some((talent) => talent.profession === profession && talent.level === 'confirmed');
      const level = promising && !confirmed && skill.experience >= R.confirmedExperience && skill.effective >= 50 ? 'confirmed'
        : !promising && skill.experience >= R.promisingExperience && skill.effective >= 30 ? 'promising' : null;
      if (!level) continue;
      talents.push({ profession, level, elapsedDay: village.elapsedDays });
      events.push({ id: `talent:${person.id}:${profession}:${level}`, type: 'talent_discovered', elapsedDay: village.elapsedDays, residentId: person.id, profession, level,
        ...(level === 'confirmed' ? { potential: skill.potentialSecret } : {}) });
    }
    return talents.length === (person.talents?.length ?? 0) ? person : { ...person, talents };
  });
  return events.length ? { ...village, residents, chronicle: [...village.chronicle, ...events] } : village;
}
export function processStoryDay(village: VillageState, previous: VillageState): VillageState {
  if (isGameOver(village)) return village;
  const next = discoverTalents(village, previous);
  if (next.pendingDecision || next.defense?.threat) return next;
  const story = next.story ?? { nextCheckDay: next.elapsedDays + R.firstCheckAfter };
  if (story.nextCheckDay > next.elapsedDays) return next.story ? next : { ...next, story };
  let rng = next.rng;
  const draw = (min: number, max: number) => { const result = randomInt(rng, min, max); rng = result.rng; return result.value; };
  const roll = draw(0, 99);
  const nextCheckDay = next.elapsedDays + draw(R.interval[0], R.interval[1]);
  const base = { id: `story:${next.elapsedDays}`, elapsedDay: next.elapsedDays };
  let pending;
  if (roll < R.visitorChance && (story.lastVisitorDay === undefined || next.elapsedDays - story.lastVisitorDay >= R.visitorCooldown)) {
    const generated = generateVisitors({ ...next, rng }, base.id); rng = generated.rng;
    pending = { ...base, kind: 'visitors' as const, residents: generated.residents, family: generated.family };
  } else {
    const allEligible = eligibleStories(next);
    const lastOffered = [...next.chronicle].reverse().find((entry) => entry.type === 'story_offered');
    const different = allEligible.filter((event) => lastOffered?.type !== 'story_offered' || event.kind !== lastOffered.kind);
    const eligible = different.length ? different : allEligible;
    if (roll < R.opportunityChance && eligible.length) pending = eligible[draw(0, eligible.length - 1)]!;
  }
  if (pending) return { ...next, rng, story: { ...story, nextCheckDay, pending, ...(pending.kind === 'visitors' ? { lastVisitorDay: next.elapsedDays } : {}) },
    pendingDecision: { id: pending.id, type: 'story_event', sinceElapsedDay: next.elapsedDays },
    chronicle: [...next.chronicle, { id: `offered:${pending.id}`, type: 'story_offered', elapsedDay: next.elapsedDays, eventId: pending.id, kind: pending.kind,
      ...('residentId' in pending ? { residentId: pending.residentId } : {}) }] };
  const workers = storyWorkers(next).filter((person) => person.profession !== null
    && person.skills[person.profession].experience > (previous.residents.find((resident) => resident.id === person.id)?.skills[person.profession].experience ?? person.skills[person.profession].experience));
  if (!workers.length) return { ...next, rng, story: { ...story, nextCheckDay } };
  const person = workers[draw(0, workers.length - 1)]!;
  const experience = 20;
  const learned = awardExperience(person, person.profession!, experience);
  return discoverTalents({ ...next, rng, story: { ...story, nextCheckDay }, residents: next.residents.map((candidate) => candidate.id === person.id ? learned : candidate),
    chronicle: [...next.chronicle, { id: `insight:${next.elapsedDays}`, type: 'work_insight', elapsedDay: next.elapsedDays, residentId: person.id, profession: person.profession!, experience }] }, next);
}
