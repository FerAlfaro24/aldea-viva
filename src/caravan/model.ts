import { z } from 'zod';
import { createRng, nextRandom, restoreRng } from '../game/core/rng';

export const TASKS = {
  gather: { name: 'Recolectar', description: '2–3 raciones listas. Menos peligro y menos rendimiento que una buena cacería.' },
  hunt: { name: 'Cazar', description: '2–4 ingredientes. Lucía consigue uno adicional. Riesgo de herida: 18 % con Lucía; 30 % con los demás.' },
  cook: { name: 'Cocinar', description: 'Prepara hasta 3 ingredientes: 2 raciones por ingrediente; Inés prepara 3. Puede usar la carne de hoy.' },
  guard: { name: 'Vigilar', description: 'Protege las reservas y a tus compañeros. Bruno tiene mejores posibilidades al enfrentarse al peligro; también puede resultar herido.' },
  materials: { name: 'Recoger materiales', description: '2 materiales para reforzar el refugio. También pueden usarse en una obra de hoy.' },
  rest: { name: 'Descansar', description: 'Recupera 18 de salud y reduce 45 de cansancio. No produce recursos.' },
  build: { name: 'Reforzar el refugio', description: 'Aporta una jornada de trabajo. La obra necesita 4 materiales en total y 2 jornadas; dos personas pueden terminarla en un día.' },
} as const;
export type Task = keyof typeof TASKS;
const integer = z.number().int().nonnegative();
const personSchema = z.object({
  id: z.enum(['lucia', 'bruno', 'ines']), name: z.string(), age: z.number().int().min(18),
  specialty: z.enum(['hunt', 'guard', 'cook']), health: integer.max(100), fatigue: integer.max(100),
  task: z.enum(['gather', 'hunt', 'cook', 'guard', 'materials', 'rest', 'build']).nullable(),
});
export const WEEK_DAYS = 7;
export const SHELTER_COST = 4;
export const SHELTER_WORK = 2;
export const isRainy = (day: number) => day === 5 || day === 6;
export const improvementsUnlocked = (state: Caravan) => state.elapsedDays >= 3;
const reportSchema = z.object({ day: integer.min(1).max(WEEK_DAYS), foodBefore: integer, ingredientsBefore: integer, lines: z.array(z.string()), reactions: z.array(z.string()).max(3).default([]), eaten: integer.max(4) });
export const caravanSchema = z.object({
  version: z.union([z.literal(1), z.literal(2)]), id: z.string().min(1), revision: integer.min(1), elapsedDays: integer.max(WEEK_DAYS),
  phase: z.enum(['planning', 'decision', 'summary', 'complete']),
  people: z.array(personSchema).length(3), food: integer, ingredients: integer, materials: integer,
  rng: z.object({ algorithm: z.literal('xorshift32-fnv1a-utf16le-v1'), seed: z.string(), state: integer.min(1).max(0xffff_ffff) }),
  shelter: integer.max(SHELTER_WORK).optional(),
  pending: z.enum(['wolves', 'supplies']).nullable(), reports: z.array(reportSchema).max(WEEK_DAYS),
}).superRefine((state, context) => {
  const limit = state.version === 1 ? 3 : WEEK_DAYS;
  if (new Set(state.people.map(person => person.id)).size !== 3
    || (state.phase === 'decision') !== (state.pending !== null)
    || state.reports.length !== state.elapsedDays + (state.phase === 'decision' ? 1 : 0)
    || state.elapsedDays > limit || state.reports.some((report, index) => report.day !== index + 1 || report.day > limit)
    || (state.version === 2 && state.shelter === undefined)
    || (state.version === 1 && (state.shelter !== undefined || state.people.some(person => person.task === 'build')))
    || (state.phase === 'complete' && state.elapsedDays !== limit)
    || (state.phase === 'planning' && state.elapsedDays === limit)) {
    context.addIssue({ code: 'custom', message: 'La partida de caravana está incompleta o es incompatible.' });
  }
}).transform(state => ({ ...state, version: 2 as const, shelter: state.shelter ?? 0,
  // Abrir la antigua caravana no escribe ni repite el tercer día.
  phase: state.version === 1 && state.phase === 'complete' ? 'summary' as const : state.phase,
}));
export type Caravan = z.infer<typeof caravanSchema>;
export type Person = Caravan['people'][number];
export type Choice = 'stand' | 'distract' | 'salvage' | 'leave';
export const MOUTHS = 4;
export const dayNumber = (state: Caravan) => Math.min(WEEK_DAYS, state.elapsedDays + 1);

export function createCaravan(seed: string, id: string): Caravan {
  return {
    version: 2, id, revision: 1, elapsedDays: 0, phase: 'planning', food: 8, ingredients: 0, materials: 0, shelter: 0,
    rng: createRng(seed), pending: null, reports: [],
    people: [
      { id: 'lucia', name: 'Lucía', age: 27, specialty: 'hunt', health: 100, fatigue: 0, task: null },
      { id: 'bruno', name: 'Bruno', age: 34, specialty: 'guard', health: 100, fatigue: 0, task: null },
      { id: 'ines', name: 'Inés', age: 25, specialty: 'cook', health: 100, fatigue: 0, task: null },
    ],
  };
}

export function taskUnavailable(person: Person, task: Task, state?: Caravan): string | null {
  if (task === 'build' && state && !improvementsUnlocked(state)) return 'Los arreglos se descubrirán a partir del día 4.';
  if (task === 'build' && state?.shelter === SHELTER_WORK) return 'El refugio ya está reforzado. Elige otra tarea.';
  if (task !== 'rest' && person.health < 25) return 'Su salud es crítica: necesita descansar antes de trabajar.';
  if (task === 'hunt' && person.health < 65) return 'Necesita recuperar al menos 65 de salud para cazar.';
  if (task !== 'rest' && person.fatigue >= 85) return 'Necesita descansar: tiene demasiado cansancio.';
  return null;
}

export type CaravanAction = { type: 'assign'; personId: string; task: Task } | { type: 'start' } | { type: 'choose'; choice: Choice } | { type: 'next' };

export function act(state: Caravan, action: CaravanAction): Caravan {
  const next = structuredClone(state);
  next.revision++;
  const draw = () => { const result = nextRandom(next.rng); next.rng = result.rng; return result.value; };
  const line = (text: string) => next.reports.at(-1)!.lines.push(text);
  const finish = () => {
    const report = next.reports.at(-1)!;
    report.eaten = Math.min(MOUTHS, next.food);
    next.food -= report.eaten;
    if (report.eaten < MOUTHS) {
      next.people.forEach(person => { person.health = Math.max(0, person.health - (MOUTHS - report.eaten) * 4); });
      line(`Faltaron ${MOUTHS - report.eaten} raciones. Todos pierden ${(MOUTHS - report.eaten) * 4} de salud por hambre.`);
    }
    line(`Los cuatro comimos ${report.eaten} de las ${MOUTHS} raciones necesarias.`);
    if (isRainy(report.day) && next.shelter < SHELTER_WORK) {
      next.people.forEach(person => { person.fatigue = Math.min(100, person.fatigue + 14); });
      line('La lluvia se filtró por la lona: todos suman 14 de cansancio. Terminar el refugio evitará esta penalización.');
      report.reactions.push('Inés: «Con la ropa mojada cuesta recuperar fuerzas. Necesitamos cerrar esas goteras».');
    } else if (next.shelter === SHELTER_WORK) {
      next.people.forEach(person => { person.fatigue = Math.max(0, person.fatigue - 6); });
      line(`${isRainy(report.day) ? 'El refugio reforzado nos mantuvo secos bajo la lluvia.' : 'Dormimos bajo el refugio reforzado.'} Todos reducen hasta 6 de cansancio.`);
    }
    if (report.eaten < MOUTHS) report.reactions.unshift('Bruno: «Mañana la comida tiene que ser lo primero».');
    report.reactions = report.reactions.slice(0, 3);
    next.elapsedDays++;
    next.pending = null;
    next.phase = 'summary';
  };
  if (action.type === 'assign') {
    if (state.phase !== 'planning') throw new Error('Solo puedes repartir tareas por la mañana.');
    const person = next.people.find(person => person.id === action.personId);
    if (!person || !(action.task in TASKS)) throw new Error('Elige una persona y una tarea disponibles.');
    const reason = taskUnavailable(person, action.task, next);
    if (reason) throw new Error(reason);
    person.task = action.task;
  } else if (action.type === 'next') {
    if (state.phase !== 'summary') throw new Error('Termina primero esta jornada.');
    next.phase = state.elapsedDays === WEEK_DAYS ? 'complete' : 'planning';
  } else if (action.type === 'start') {
    if (state.phase !== 'planning') throw new Error('Esta jornada ya está resuelta o tiene una decisión pendiente.');
    for (const person of next.people) {
      if (!person.task) throw new Error(`Elige qué hará ${person.name}.`);
      const reason = taskUnavailable(person, person.task, next);
      if (reason) throw new Error(`${person.name}: ${reason}`);
    }
    const day = dayNumber(state);
    const problem = constructionProblem(next);
    if (problem) throw new Error(problem);
    next.reports.push({ day, foodBefore: state.food, ingredientsBefore: state.ingredients, eaten: 0, lines: [], reactions: [] });
    for (const person of next.people) {
      const tired = person.fatigue >= 60 ? 1 : 0;
      switch (person.task) {
        case 'gather': {
          const amount = 2 + Math.floor(draw() * 2) - tired;
          next.food += amount;
          line(`${person.name} recolectó ${amount} raciones listas para comer.`);
          break;
        }
        case 'hunt': {
          const skilled = person.specialty === 'hunt';
          const amount = 2 + Math.floor(draw() * 3) + Number(skilled) - tired;
          next.ingredients += amount;
          line(`${person.name} trajo ${amount} ingredientes de la cacería.`);
          if (draw() < (skilled ? 0.18 : 0.30)) {
            person.health = Math.max(0, person.health - 22);
            line(`${person.name} se hirió al cazar: perdió 22 de salud. Descansar ayudará a recuperarse.`);
            next.reports.at(-1)!.reactions.push(`${person.name}: «Traje comida, pero esta herida pide un respiro».`);
          }
          break;
        }
        case 'materials': next.materials += 2; line(`${person.name} recogió 2 materiales para los arreglos del campamento.`); break;
        case 'rest': {
          const healed = Math.min(18, 100 - person.health);
          const rested = Math.min(45, person.fatigue);
          person.health += healed; person.fatigue -= rested;
          line(`${person.name} descansó: recuperó ${healed} de salud y redujo ${rested} de cansancio.`);
          if (healed || rested) next.reports.at(-1)!.reactions.push(`${person.name}: «Gracias por dejarme parar. Hoy me siento con más fuerzas».`);
          break;
        }
        case 'guard': line(`${person.name} vigiló el campamento. La vigilancia no protege las salidas de caza.`); break;
      }
      if (person.task !== 'rest') person.fatigue = Math.min(100, person.fatigue + (person.task === 'hunt' ? 20 : person.task === 'cook' || person.task === 'guard' ? 10 : 14));
    }
    // Los materiales de hoy están disponibles antes de empezar la obra.
    const builders = next.people.filter(person => person.task === 'build');
    if (builders.length) {
      if (next.shelter === 0) { next.materials -= SHELTER_COST; line(`Comenzó el arreglo del refugio: se utilizaron ${SHELTER_COST} materiales. No se volverán a cobrar.`); }
      for (const person of builders) {
        if (next.shelter < SHELTER_WORK) { next.shelter++; line(`${person.name} reforzó la lona y los apoyos: obra ${next.shelter}/${SHELTER_WORK}.`); }
        else line(`${person.name} revisó los amarres; la obra ya había quedado terminada hoy.`);
      }
      if (next.shelter === SHELTER_WORK) {
        line('Refugio terminado: la lluvia ya no añade cansancio y dormir bajo techo reduce hasta 6 de cansancio cada noche. Cambia la tarea de quienes trabajaban en la obra para mañana.');
        next.reports.at(-1)!.reactions.unshift(`${builders[0]!.name}: «Ya tenemos un techo de verdad. Aquí podremos descansar».`);
      }
    }
    // Toda la obtención termina antes de cocinar; el orden de las tarjetas no altera la cena.
    for (const person of next.people.filter(person => person.task === 'cook')) {
      const ingredients = Math.min(3, next.ingredients);
      const meals = ingredients * (person.specialty === 'cook' ? 3 : 2);
      next.ingredients -= ingredients; next.food += meals;
      line(ingredients ? `${person.name} convirtió ${ingredients} ingredientes en ${meals} raciones.` : `${person.name} no pudo cocinar: no había ingredientes.`);
    }
    if (day === 1) { line('La primera noche fue tranquila. La caravana nos sirvió de refugio.'); finish(); }
    else if (day === 2 || day === 3 || day === 6) { next.pending = day === 3 ? 'supplies' : 'wolves'; next.phase = 'decision'; }
    else {
      if (day === 4) line(next.shelter === SHELTER_WORK ? 'Las nubes anuncian lluvia para los días 5 y 6. El refugio ya está preparado.' : 'La lona está deteriorada. Las nubes anuncian lluvia para los días 5 y 6: todavía podemos preparar el refugio.');
      if (day === 5) line('Bruno encontró huellas frescas. Conviene preparar vigilancia o reservar 2 raciones para la noche del día 6.');
      if (day === 7) next.reports.at(-1)!.reactions.push('Lucía: «Hace una semana solo veíamos una rueda rota. Ahora conocemos mejor el camino y a los demás».');
      finish();
    }
  } else {
    if (state.phase !== 'decision') throw new Error('No hay una decisión pendiente.');
    if (state.pending === 'wolves') {
      const guard = next.people.filter(person => person.task === 'guard').sort((a, b) => Number(b.specialty === 'guard') - Number(a.specialty === 'guard'))[0];
      if (action.choice === 'distract') {
        if (next.food < 2) throw new Error('Necesitas 2 raciones para alejar a los animales.');
        next.food -= 2; line('Dejaste 2 raciones lejos del campamento. Los lobos se alejaron sin herir a nadie.');
      } else if (action.choice === 'stand') {
        const success = draw() < defenseChance(next);
        if (success) {
          line(guard ? `${guard.name} mantuvo a los lobos lejos de las reservas.` : 'Lograsteis ahuyentar a los lobos sin vigilancia preparada.');
          if (guard && draw() < 0.20) { guard.health = Math.max(0, guard.health - 12); line(`${guard.name} perdió 12 de salud al defender la caravana.`); }
        } else {
          const lost = Math.min(4, next.food); next.food -= lost;
          const victim = guard ?? next.people[0]!;
          victim.health = Math.max(0, victim.health - (guard ? 18 : 26));
          line(`Los lobos se llevaron ${lost} raciones. ${victim.name} perdió ${guard ? 18 : 26} de salud al proteger el campamento.`);
        }
      } else throw new Error('Elige cómo responder a los lobos.');
    } else if (action.choice === 'salvage') {
      next.materials += 3; next.ingredients += 2;
      next.people.forEach(person => { person.fatigue = Math.min(100, person.fatigue + 10); });
      line('Revisasteis el carro abandonado: +3 materiales y +2 ingredientes. Todos suman 10 de cansancio. Esos ingredientes quedan para mañana; la cocina de hoy ya terminó.');
    } else if (action.choice === 'leave') {
      next.people.forEach(person => { person.fatigue = Math.max(0, person.fatigue - 10); });
      line('Dejasteis pasar el hallazgo para recuperar fuerzas: todos reducen 10 de cansancio.');
    } else throw new Error('Elige si aprovechar el hallazgo.');
    finish();
  }
  return caravanSchema.parse(next);
}

export function defenseChance(state: Caravan): number {
  const guards = state.people.filter(person => person.task === 'guard');
  return guards.some(person => person.specialty === 'guard') ? 0.88 : guards.length ? 0.72 : 0.35;
}

export function constructionProblem(state: Caravan): string | null {
  if (state.shelter === 0 && state.people.some(person => person.task === 'build')
    && state.materials + state.people.filter(person => person.task === 'materials').length * 2 < SHELTER_COST) {
    return `El refugio necesita ${SHELTER_COST} materiales. Reúne los que faltan o dedica otra persona a recogerlos hoy.`;
  }
  return null;
}

export function parseCaravan(raw: unknown): Caravan {
  const result = caravanSchema.safeParse(raw);
  if (!result.success) throw new Error('Esta partida de caravana tiene un formato incompatible. Se conserva sin modificar.');
  restoreRng(result.data.rng);
  return result.data;
}
