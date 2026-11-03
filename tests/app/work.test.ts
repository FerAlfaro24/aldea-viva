import { describe, expect, it, vi } from 'vitest';
import { IDBFactory } from 'fake-indexeddb';
import { generateVillage } from '../../src/game/generation/village';
import { assignWork } from '../../src/game/commands/work';
import { prepareConstruction, changeConstruction } from '../../src/game/commands/construction';
import { configureMaintenance } from '../../src/game/commands/maintenance';
import { advanceVillageDays as advanceDays } from '../../src/game/core/workDay';
import { selectWorkAssignment } from '../../src/game/selectors/work';
import { validateVillageState } from '../../src/game/validation/village';
import { createSave, parseSave } from '../../src/storage/schema';
import { IndexedDbSaveRepository } from '../../src/storage/indexedDb';
import { PersistentSession } from '../../src/app/persistence';
import { renderProfessions } from '../../src/ui/professions';
import { renderResident, filterResidents } from '../../src/ui/residents';
import { EMPTY_FILTERS } from '../../src/app/session';
import { freezeDeep } from '../fixtures/simulation';
import type { VillageState } from '../../src/game/models/village';

const initial = () => generateVillage('oficios-0.3');
const adults = (village: VillageState) => village.residents.filter((person) => person.initialAge >= 18);
const orchardId = (village: VillageState) => village.buildings.find((building) => building.type === 'orchard')!.id;

describe('0.3: nombramiento manual y destinos', () => {
  it('respeta las edades 12/14/15/16 y un cumpleaños habilita sin contratar', () => {
    const original = initial(); const child = original.residents.find((person) => person.initialAge < 18)!;
    const projects = prepareConstruction(original, original.constructionSlots.find((slot) => slot.buildingId === null)!.id, 'house');
    const sites = { farmer: orchardId(projects), builder: 'work:builder-auto', woodcutter: 'work:forest', warrior: 'work:guard-village' };
    for (const [profession, minimum] of [['farmer', 12], ['builder', 14], ['woodcutter', 15], ['warrior', 16]] as const) {
      const atAge = (age: number) => ({ ...projects, residents: projects.residents.map((person) => person.id === child.id ? { ...person, initialAge: age, birthDayOfYear: 2 } : person) });
      expect(() => assignWork(atAge(minimum - 1), child.id, profession, sites[profession])).toThrow('edad');
      expect(assignWork(atAge(minimum), child.id, profession, sites[profession]).residents.find((person) => person.id === child.id)!.profession).toBe(profession);
      const birthday = advanceDays(atAge(minimum - 1), 1).state;
      expect(birthday.residents.find((person) => person.id === child.id)!.profession).toBeNull();
      expect(assignWork(birthday, child.id, profession, sites[profession]).residents.find((person) => person.id === child.id)!.profession).toBe(profession);
    }
  });

  it('respeta cupos, conserva habilidades/familia/RNG y cambiar oficio libera la plaza anterior', () => {
    const original = freezeDeep(initial()); const people = adults(original); const site = orchardId(original);
    let village = assignWork(original, people[0]!.id, 'farmer', site);
    village = assignWork(village, people[1]!.id, 'farmer', site);
    expect(() => assignWork(village, people[2]!.id, 'farmer', site)).toThrow('plazas');
    expect(assignWork(village, people[0]!.id, 'farmer', site)).toBe(village);
    village = assignWork(village, people[0]!.id, 'woodcutter', 'work:forest');
    village = assignWork(village, people[2]!.id, 'farmer', site);
    expect(village.residents[0]!.skills).toBe(original.residents[0]!.skills);
    expect(village.rng).toBe(original.rng); expect(village.inventory).toBe(original.inventory);
    expect(village.housingAssignments).toBe(original.housingAssignments); expect(village.families).toBe(original.families);
    expect(filterResidents(village, { ...EMPTY_FILTERS, employment: 'farmer' })).toHaveLength(2);
    expect(selectWorkAssignment(village, people[0]!.id)?.manualLock).toBe(true);
    expect(original.residents.every((person) => person.profession === null)).toBe(true);
  });

  it('limita la guardia a dos por destino y rechaza destinos incompatibles y órdenes incoherentes', () => {
    let village = initial(); const people = adults(village);
    for (const [index, post] of ['work:guard-village', 'work:guard-village', 'work:guard-forest', 'work:guard-forest'].entries()) {
      village = assignWork(village, people[index]!.id, 'warrior', post);
    }
    expect(() => assignWork(village, people[4]!.id, 'warrior', 'work:guard-forest')).toThrow('plazas');
    expect(() => assignWork(village, people[4]!.id, 'farmer', 'work:forest')).toThrow('destino');
    expect(() => assignWork(village, people[4]!.id, null, 'work:forest')).toThrow();
    const invalid = { ...village, workAssignments: [...village.workAssignments!, village.workAssignments![0]!] };
    expect(() => validateVillageState(invalid)).toThrow();
    expect(() => parseSave({ ...createSave(village, 1, 1, '2026-11-02T00:00:00Z'), village: { ...village,
      workAssignments: village.workAssignments!.map((order, index) => index === 0 ? { ...order, authorized: false } : order) } })).toThrow();
  });

  it('el constructor flexible no recluta y el exclusivo queda pendiente al cancelar su obra', () => {
    const original = initial(); const people = adults(original);
    let village = prepareConstruction(original, original.constructionSlots.find((slot) => slot.buildingId === null)!.id, 'house');
    const project = village.constructionProjects![0]!;
    village = assignWork(village, people[0]!.id, 'builder', project.id);
    village = assignWork(village, people[1]!.id, 'builder', 'work:builder-auto');
    expect(selectWorkAssignment(village, people[0]!.id)?.manualLock).toBe(true);
    expect(selectWorkAssignment(village, people[1]!.id)?.manualLock).toBe(false);
    const advanced = advanceDays(freezeDeep(village), 1).state;
    expect(advanced.workAssignments).toEqual(village.workAssignments);
    expect(advanced.constructionProjects![0]!.progress).toBeGreaterThan(0);
    village = changeConstruction(village, project.id, 'cancel');
    expect(selectWorkAssignment(village, people[0]!.id)?.status).toBe('conflict');
    expect(village.residents.find((person) => person.id === people[0]!.id)?.profession).toBe('builder');
    expect(selectWorkAssignment(village, people[1]!.id)?.status).toBe('active');
    village = assignWork(village, people[0]!.id, null, null);
    expect(selectWorkAssignment(village, people[0]!.id)).toBeNull();
    const buildingId = village.buildings[0]!.id;
    village = configureMaintenance(village, buildingId, 'high');
    village = assignWork(village, people[0]!.id, 'builder', buildingId);
    village = configureMaintenance(village, buildingId, null);
    expect(selectWorkAssignment(village, people[0]!.id)?.status).toBe('conflict');
    village = configureMaintenance(village, buildingId, 'normal');
    expect(selectWorkAssignment(village, people[0]!.id)?.status).toBe('active');
  });

  it('lee v4 sin escribir, guarda v5 y recupera los destinos sin tocar las otras ranuras', async () => {
    const factory = new IDBFactory(); const repo = new IndexedDbSaveRepository('work-compatibility', factory);
    const oldSave = { ...createSave(initial(), 1, 1, '2026-11-02T00:00:00Z'), schemaVersion: 4 as const, gameVersion: '0.2.0' };
    await repo.write(oldSave, null);
    const session = new PersistentSession(repo); await session.load();
    expect((await repo.readAll())[1]).toEqual(oldSave);
    await session.perform({ type: 'create', slot: 2, seed: 'otra-aldea', confirmReplacement: false });
    const other = session.snapshot.session.slots[2];
    session.read({ type: 'continue', slot: 1 }); const person = adults(session.village!)[0]!;
    await session.perform({ type: 'assign-work', residentId: person.id, profession: 'woodcutter', workplaceId: 'work:forest' });
    expect(parseSave((await repo.readAll())[1]).schemaVersion).toBe(9);
    const expected = session.village!; expect(session.snapshot.session.slots[2]).toEqual(other);
    session.dispose();
    const reopened = new PersistentSession(new IndexedDbSaveRepository('work-compatibility', factory));
    await reopened.load(); reopened.read({ type: 'continue', slot: 1 });
    expect(reopened.village).toEqual(expected);
    expect(() => parseSave({ ...createSave(expected, 1, 3, '2026-11-02T00:00:00Z'), schemaVersion: 4 })).toThrow();
    reopened.dispose();
  });

  it('reintenta un fallo de guardado sin duplicar el nombramiento', async () => {
    const repo = new IndexedDbSaveRepository('work-retry', new IDBFactory()); const session = new PersistentSession(repo);
    await session.load(); await session.perform({ type: 'create', slot: 1, seed: 'oficios-0.3', confirmReplacement: false });
    const original = session.village!; const person = adults(original)[0]!;
    vi.spyOn(repo, 'write').mockRejectedValueOnce(new Error('fallo'));
    await expect(session.perform({ type: 'assign-work', residentId: person.id, profession: 'builder', workplaceId: 'work:builder-auto' })).rejects.toThrow();
    expect(session.village).toBe(original); await session.retry();
    expect(session.village!.workAssignments).toHaveLength(1);
    expect(session.village!.chronicle.filter((entry) => entry.type === 'job_changed')).toHaveLength(1);
    session.dispose();
  });

  it('muestra habilidad y destino sin filtrar el potencial oculto', () => {
    const original = initial(); const person = adults(original)[0]!;
    const village = assignWork(original, person.id, 'woodcutter', 'work:forest');
    const secret = { ...village, residents: village.residents.map((resident) => ({ ...resident,
      skills: Object.fromEntries(Object.entries(resident.skills).map(([profession, skill]) => [profession, { ...skill, potentialSecret: 987654321 }])) as typeof resident.skills })) };
    const markup = renderProfessions(secret) + renderResident(secret, person.id);
    expect(markup).toContain('Bosque'); expect(markup).not.toMatch(/987654321|potentialSecret/);
    expect(renderResident(village, person.id)).not.toContain('La asignación de trabajos llegará');
  });
});
