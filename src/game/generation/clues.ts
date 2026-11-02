import type { Attributes, ClueId, Resident, Skill } from '../models/village';
import type { Profession } from '../models/simulation';
import { INITIAL_CONFIG } from '../rules/initialConfig';

const CLUE_TEXT: Readonly<Record<ClueId, string>> = {
  'strong-build': 'Su constitución sugiere facilidad para los esfuerzos físicos.',
  'steady-hands': 'Sus manos parecen especialmente hábiles para las tareas delicadas.',
  'field-learning': 'Parece captar con facilidad algunos detalles de las labores del campo.',
  'wood-learning': 'Muestra indicios de aptitud para aprender las labores del bosque.',
  'craft-learning': 'Parece tener facilidad para aprender trabajos de construcción.',
  'defense-learning': 'Se aprecian indicios de aptitud para aprender a defender la aldea.',
  'unknown-aptitudes': 'Sus aptitudes se conocerán mejor con la práctica.',
};

export function deriveInitialClues(attributes: Attributes, skills: Readonly<Record<Profession, Skill>>): readonly ClueId[] {
  const clues: ClueId[] = [];
  const config = INITIAL_CONFIG;
  if (attributes.strength >= config.clueAttributeThreshold) clues.push('strong-build');
  if (attributes.dexterity >= config.clueAttributeThreshold) clues.push('steady-hands');
  const signals = [
    ['farmer', 'dexterity', 'field-learning'],
    ['woodcutter', 'endurance', 'wood-learning'],
    ['builder', 'dexterity', 'craft-learning'],
    ['warrior', 'agility', 'defense-learning'],
  ] as const;
  for (const [profession, attribute, clue] of signals) {
    if (skills[profession].potentialSecret >= config.cluePotentialThreshold
      && attributes[attribute] >= config.clueLearningAttributeThreshold) clues.push(clue);
  }
  return clues.length ? clues : ['unknown-aptitudes'];
}

export function getClueTexts(resident: Pick<Resident, 'initialClueIds'>): readonly string[] {
  return resident.initialClueIds.map((id) => CLUE_TEXT[id]);
}
