// Cupos provisionales aprobados; la muralla requiere un edificio todavía inexistente.
export const GUARD_POSTS = [
  { id: 'work:guard-village', label: 'Guardia de la aldea', capacity: 2 },
  { id: 'work:guard-forest', label: 'Guardia del bosque', capacity: 2 },
] as const;

// Balance inicial de 0.3, ajustable jugando. Unidades de trabajo, no días prometidos.
export const WORK_RULES = {
  constructionWork: { house: 60, orchard: 40, warehouse: 80 },
  buildersPerTask: 3,
  automaticRepairBelow: 95,
  baseEffort: 3,
  skillWeight: 0.08,
  attributeWeight: 0.04,
  repairWoodPerWorkerDay: 1,
  repairConditionPerEffort: 0.5,
  baseExperience: 4,
  potentialExperienceWeight: 0.24,
  experiencePerSkillPoint: 100,
  recoveryMultiplier: 2,
  attributeGainPerExperience: 0.0002,
  dailyDisuse: 0.001,
  agingFrom: 60,
  agingPerYearOfAge: 0.0001,
} as const;
