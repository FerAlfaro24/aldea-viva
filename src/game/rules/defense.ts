// Balance provisional. Probabilidades porcentuales; el motor usa estos mismos valores.
export const DEFENSE_RULES = {
  firstCheckDay: 28,
  interval: [28, 56],
  attackChance: 45,
  baseDetectionChance: 40,
  forestDetectionBonus: 20,
  tactics: {
    defend: { power: 1, theft: 1, injuryWin: 12, injuryLoss: 35, deathWin: 2, deathLoss: 8 },
    'protect-storage': { power: 0.9, theft: 0.45, injuryWin: 15, injuryLoss: 45, deathWin: 3, deathLoss: 10 },
    negotiate: { power: 1, theft: 0.8, injuryWin: 0, injuryLoss: 25, deathWin: 0, deathLoss: 5 },
    sortie: { power: 1.2, theft: 1.3, injuryWin: 25, injuryLoss: 60, deathWin: 5, deathLoss: 18 },
  },
} as const;
