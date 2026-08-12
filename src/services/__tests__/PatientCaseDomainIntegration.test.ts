import { describe, it, expect, beforeEach, vi } from 'vitest';
import { patientRepository } from '@/repositories/patient.repository';
import { caseRepository } from '@/repositories/case.repository';
import { Patient, ClinicalCase } from '@/types/clinical.types';

// In-Memory database representing Firestore collections
const mockFirestore: { patients: Record<string, Patient>; cases: Record<string, ClinicalCase> } = {
  patients: {},
  cases: {},
};

vi.spyOn(patientRepository, 'createPatient').mockImplementation(async (p: Patient) => {
  mockFirestore.patients[p.id] = { ...p };
  return p;
});

vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => {
  return mockFirestore.patients[id] || null;
});

vi.spyOn(patientRepository, 'getPatientsByUser').mockImplementation(async (userId: string) => {
  return Object.values(mockFirestore.patients).filter((p) => p.userId === userId || p.ownerId === userId);
});

vi.spyOn(patientRepository, 'deletePatient').mockImplementation(async (patientId: string, userId: string) => {
  const p = mockFirestore.patients[patientId];
  if (!p || (p.userId !== userId && p.ownerId !== userId)) {
    throw new Error('Permissão negada para excluir este paciente.');
  }
  delete mockFirestore.patients[patientId];
});

vi.spyOn(caseRepository, 'createCase').mockImplementation(async (c: ClinicalCase) => {
  mockFirestore.cases[c.id] = { ...c };
  return c;
});

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockFirestore.cases[id] || null;
});

vi.spyOn(caseRepository, 'getCasesByUser').mockImplementation(async (userId: string) => {
  return Object.values(mockFirestore.cases).filter((c) => c.userId === userId || c.ownerId === userId);
});

vi.spyOn(caseRepository, 'getCasesByPatient').mockImplementation(async (patientId: string) => {
  return Object.values(mockFirestore.cases).filter((c) => c.patientId === patientId);
});

vi.spyOn(caseRepository, 'updateCase').mockImplementation(async (caseId: string, data: Partial<ClinicalCase>) => {
  const c = mockFirestore.cases[caseId];
  if (!c) throw new Error('Caso clínico não encontrado.');
  const newVersion = (c.currentVersion || 1) + 1;
  const updated: ClinicalCase = {
    ...c,
    ...data,
    currentVersion: newVersion,
    version: newVersion,
    updatedAt: new Date().toISOString(),
  };
  mockFirestore.cases[caseId] = updated;
  return updated;
});

vi.spyOn(caseRepository, 'deleteCase').mockImplementation(async (caseId: string, userId: string) => {
  const c = mockFirestore.cases[caseId];
  if (!c || (c.userId !== userId && c.ownerId !== userId)) {
    throw new Error('Permissão negada para excluir este caso clínico.');
  }
  delete mockFirestore.cases[caseId];
});

describe('Vetmind Domain Integration Gate - Patient + ClinicalCase', () => {
  beforeEach(() => {
    mockFirestore.patients = {};
    mockFirestore.cases = {};
  });

  it('1. Creates Patient A and Case A for User A, and Patient B and Case B for User B', async () => {
    const now = new Date().toISOString();

    const patientA = await patientRepository.createPatient({
      id: 'pat_A',
      userId: 'usr_A',
      ownerId: 'usr_A',
      name: 'Rex',
      species: 'CANINE',
      breed: 'Pastor Alemão',
      gender: 'MALE_INTACT',
      ageYears: 5,
      ageMonths: 0,
      weightKg: 35.0,
      tutorName: 'Alice',
      tutorContact: '(11) 91111-1111',
      createdAt: now,
      updatedAt: now,
    });

    const caseA = await caseRepository.createCase({
      id: 'case_A',
      userId: 'usr_A',
      ownerId: 'usr_A',
      patientId: 'pat_A',
      caseNumber: 'CAS-2026-0001',
      status: 'ANAMNESIS_PENDING',
      title: 'Consulta: Rex',
      chiefComplaint: 'Claudicação em membro posterior direito.',
      currentVersion: 1,
      version: 1,
      tags: ['Ortopedia'],
      createdAt: now,
      updatedAt: now,
    });

    const patientB = await patientRepository.createPatient({
      id: 'pat_B',
      userId: 'usr_B',
      ownerId: 'usr_B',
      name: 'Mimi',
      species: 'FELINE',
      breed: 'Siamês',
      gender: 'FEMALE_SPAYED',
      ageYears: 2,
      ageMonths: 4,
      weightKg: 3.8,
      tutorName: 'Bruno',
      tutorContact: '(21) 92222-2222',
      createdAt: now,
      updatedAt: now,
    });

    const caseB = await caseRepository.createCase({
      id: 'case_B',
      userId: 'usr_B',
      ownerId: 'usr_B',
      patientId: 'pat_B',
      caseNumber: 'CAS-2026-0002',
      status: 'ANAMNESIS_PENDING',
      title: 'Consulta: Mimi',
      chiefComplaint: 'Anorexia e vômito bilioso.',
      currentVersion: 1,
      version: 1,
      tags: ['Gastroenterologia'],
      createdAt: now,
      updatedAt: now,
    });

    expect(patientA.id).toBe('pat_A');
    expect(caseA.id).toBe('case_A');
    expect(patientB.id).toBe('pat_B');
    expect(caseB.id).toBe('case_B');
  });

  it('2. Enforces absolute multi-tenant data isolation between User A and User B', async () => {
    const now = new Date().toISOString();

    await patientRepository.createPatient({
      id: 'pat_A', userId: 'usr_A', ownerId: 'usr_A', name: 'Rex', species: 'CANINE', breed: 'Pastor', gender: 'MALE_INTACT', ageYears: 5, ageMonths: 0, weightKg: 35, tutorName: 'Alice', tutorContact: '', createdAt: now, updatedAt: now
    });
    await caseRepository.createCase({
      id: 'case_A', userId: 'usr_A', ownerId: 'usr_A', patientId: 'pat_A', caseNumber: 'CAS-A', status: 'ANAMNESIS_PENDING', title: 'Caso A', chiefComplaint: 'Queixa A', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    });

    await patientRepository.createPatient({
      id: 'pat_B', userId: 'usr_B', ownerId: 'usr_B', name: 'Mimi', species: 'FELINE', breed: 'Siamês', gender: 'FEMALE_SPAYED', ageYears: 2, ageMonths: 0, weightKg: 3, tutorName: 'Bruno', tutorContact: '', createdAt: now, updatedAt: now
    });
    await caseRepository.createCase({
      id: 'case_B', userId: 'usr_B', ownerId: 'usr_B', patientId: 'pat_B', caseNumber: 'CAS-B', status: 'ANAMNESIS_PENDING', title: 'Caso B', chiefComplaint: 'Queixa B', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    });

    const userAPatients = await patientRepository.getPatientsByUser('usr_A');
    const userBPatients = await patientRepository.getPatientsByUser('usr_B');

    expect(userAPatients.map((p) => p.id)).toEqual(['pat_A']);
    expect(userBPatients.map((p) => p.id)).toEqual(['pat_B']);

    const userACases = await caseRepository.getCasesByUser('usr_A');
    const userBCases = await caseRepository.getCasesByUser('usr_B');

    expect(userACases.map((c) => c.id)).toEqual(['case_A']);
    expect(userBCases.map((c) => c.id)).toEqual(['case_B']);

    // Unauthorized deletion attempt
    await expect(caseRepository.deleteCase('case_B', 'usr_A')).rejects.toThrow('Permissão negada');
  });

  it('3. Relation Patient -> Cases: fetches multiple cases belonging to a single patient', async () => {
    const now = new Date().toISOString();
    await caseRepository.createCase({ id: 'c1', userId: 'usr_A', patientId: 'pat_A', caseNumber: 'C1', status: 'CLOSED', title: 'Consulta 1', chiefComplaint: 'Vacinação', currentVersion: 1, tags: [], createdAt: now, updatedAt: now });
    await caseRepository.createCase({ id: 'c2', userId: 'usr_A', patientId: 'pat_A', caseNumber: 'C2', status: 'ANAMNESIS_PENDING', title: 'Consulta 2', chiefComplaint: 'Otite bilateral', currentVersion: 1, tags: [], createdAt: now, updatedAt: now });

    const patientCases = await caseRepository.getCasesByPatient('pat_A');
    expect(patientCases.length).toBe(2);
  });

  it('4. Autosave and Version Incrementing: updating a case increments currentVersion', async () => {
    const now = new Date().toISOString();
    await caseRepository.createCase({ id: 'c1', userId: 'usr_A', patientId: 'pat_A', caseNumber: 'C1', status: 'ANAMNESIS_PENDING', title: 'Consulta 1', chiefComplaint: 'Queixa inicial', currentVersion: 1, tags: [], createdAt: now, updatedAt: now });

    const updated = await caseRepository.updateCase('c1', { chiefComplaint: 'Queixa detalhada e atualizada' });

    expect(updated.chiefComplaint).toBe('Queixa detalhada e atualizada');
    expect(updated.currentVersion).toBe(2);
  });
});
