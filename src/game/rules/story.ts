// Provisional: contexto primero, nunca llenar una cuota de decisiones.
export const STORY_RULES = {
  firstCheckAfter: 14,
  interval: [7, 14],
  visitorChance: 1, // Por comprobación, no por día.
  visitorCooldown: 336,
  opportunityChance: 75,
  promisingExperience: 400,
  confirmedExperience: 1500,
  talentPotential: 70,
  choices: {
    careful: { foodCost: 3, reward: 8, experienceWin: 120, experienceLoss: 60, injuryOnLoss: 5, deathIfInjured: 0 },
    bold: { foodCost: 6, reward: 20, experienceWin: 300, experienceLoss: 160, injuryOnLoss: 25, deathIfInjured: 2 },
  },
} as const;
