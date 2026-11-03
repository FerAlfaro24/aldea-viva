// Equilibrio provisional de juego; todos los riesgos se acumulan durante días.
export const SURVIVAL_RULES = {
  unusableCondition: 20,
  collapseAfterZeroDays: 7,
  dailyWear: 0.02,
  winterWear: { mild: 1.25, normal: 1.5, harsh: 2 },
  coldDamage: { mild: 0.6, normal: 1.1, harsh: 1.7 },
  hungerGain: 5,
  hungerRecovery: 3,
  healthRecovery: 0.35,
  abundantRecoveryBonus: 0.8,
  hungerDamageFrom: 35,
  maximumHungerDamage: 2.5,
  rescueChancePerThousand: 30,
  rescueStabilizedDays: 7,
} as const;
