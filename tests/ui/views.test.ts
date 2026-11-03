import { describe, expect, it } from 'vitest';
import { EMPTY_FILTERS } from '../../src/app/session';
import { generateVillage } from '../../src/game/generation/village';
import { selectResidentDetails } from '../../src/game/selectors/village';
import { filterResidents, renderResident, renderResidents } from '../../src/ui/residents';
import { renderVillage } from '../../src/ui/village';
import { html } from '../../src/ui/format';
import { freezeDeep } from '../fixtures/simulation';

describe('Filtros y presentación de datos reales', () => {
  it('solo muestra el aviso de salud cuando hay habitantes vivos que necesitan atención', () => {
    const village = freezeDeep(generateVillage('aviso-real'));
    expect(renderVillage(village)).not.toContain('Revisar Salud →');
    const hungry = { ...village, residents: village.residents.map((person, index) => index === 0
      ? { ...person, condition: { health: 100, hunger: 30 } } : person) };
    expect(renderVillage(hungry)).toContain('1 habitante necesita atención');
    const injured = { ...village, residents: village.residents.map((person, index) => index === 0
      ? { ...person, medical: { illnessActive: true, incapacityUntil: 20 } } : person) };
    expect(renderVillage(injured)).toContain('1 habitante necesita atención');
    expect(village.residents.every((person) => person.condition.hunger === 0)).toBe(true);
  });
  it('combina familia, vivienda y edad sin alterar el mundo', () => {
    const village = freezeDeep(generateVillage('filtros-de-vistas'));
    const family = village.families.find((candidate) => candidate.kind === 'parents-and-children');
    if (!family) throw new Error('Falta el hogar con menores.');
    const filtered = filterResidents(village, { ...EMPTY_FILTERS, family: family.id, age: 'children' });
    expect(filtered.length).toBeGreaterThanOrEqual(2);
    expect(filtered.every((person) => person.age < 18 && person.family.id === family.id && person.housing !== null)).toBe(true);
    expect(filterResidents(village, { ...EMPTY_FILTERS, housing: 'unhoused' })).toHaveLength(0);
    expect(village.elapsedDays).toBe(0);
  });

  it('busca con o sin acentos y conserva los datos de cada ficha', () => {
    const village = generateVillage('buscar-con-acentos');
    const first = village.residents[0]!;
    const search = first.displayName.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase();
    const filtered = filterResidents(village, { ...EMPTY_FILTERS, search });
    expect(filtered.map((person) => person.id)).toEqual([first.id]);
    expect(filtered[0]).toEqual(selectResidentDetails(village, first.id));
    expect(filterResidents(village, { ...EMPTY_FILTERS, search: 'nadie-con-este-nombre' })).toEqual([]);
  });

  it('ordena por edad sin cambiar la disposición interna del mundo', () => {
    const village = freezeDeep(generateVillage('orden-por-edad'));
    const before = JSON.stringify(village);
    const filtered = filterResidents(village, { ...EMPTY_FILTERS, sort: 'age', employment: 'unassigned' });
    const ages = filtered.map((person) => person.age);
    expect(ages).toEqual([...ages].sort((left, right) => left - right));
    expect(JSON.stringify(village)).toBe(before);
  });

  it('los datos privados de habilidades no llegan al HTML de listas ni fichas', () => {
    const original = generateVillage('secreto-no-visible');
    // Valor centinela exclusivo de la prueba, ajeno a una partida válida.
    const village = { ...original, residents: original.residents.map((person) => ({
      ...person, skills: { ...person.skills, farmer: { ...person.skills.farmer, potentialSecret: 987654321 } },
    })) };
    const markup = renderResidents(village) + village.residents.map((person) => renderResident(village, person.id)).join('');
    expect(markup).not.toContain('987654321');
    expect(markup).not.toMatch(/potentialSecret|historicalBest|experience/);
  });

  it('los textos que podrían contener HTML se muestran como texto, sin ejecutarse', () => {
    const name = '<img src=x onerror="alert(1)">';
    const original = generateVillage(name);
    const village = { ...original, residents: original.residents.map((person, index) => index === 0 ? { ...person, displayName: name } : person) };
    const markup = renderVillage(village) + renderResidents(village) + renderResident(village, village.residents[0]!.id);
    expect(markup).not.toContain('<img src=x');
    expect(markup).toContain('&lt;img src=x');
    expect(html(`A&B <C> "D" 'E'`)).toBe('A&amp;B &lt;C&gt; &quot;D&quot; &#39;E&#39;');
  });
});
