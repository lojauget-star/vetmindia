import { describe, it, expect, beforeEach, vi } from 'vitest';
import { dashboardService } from '../dashboard.service';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { ClinicalCase, Patient } from '@/types/clinical.types';

// Mock Memory Store simulating Firestore Database Collections
const mockFirestoreStore: Record<string, any[]> = {
  cases: [],
  patients: [],
  analyses: [],
  documents: [],
};

vi.spyOn(caseRepository, 'getRecentCases').mockImplementation(async (userId: string) => {
  return mockFirestoreStore.cases
    .filter((c: ClinicalCase) => c.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

vi.spyOn(caseRepository, 'createCase').mockImplementation(async (c: ClinicalCase) => {
  mockFirestoreStore.cases.push(c);
  return c;
});

vi.spyOn(patientRepository, 'getRecentPatients').mockImplementation(async (userId: string) => {
  return mockFirestoreStore.patients
    .filter((p: Patient) => p.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
});

vi.spyOn(patientRepository, 'createPatient').mockImplementation(async (p: Patient) => {
  mockFirestoreStore.patients.push(p);
  return p;
});

describe('Vetmind Application Shell & Dashboard Integration Gate', () => {
  beforeEach(() => {
    mockFirestoreStore.cases = [];
    mockFirestoreStore.patients = [];
    mockFirestoreStore.analyses = [];
    mockFirestoreStore.documents = [];
  });

  it('1. Handles empty state when no clinical records exist for user', async () => {
    const data = await dashboardService.getDashboardData('usr_empty');
    expect(data.cases).toEqual([]);
    expect(data.patients).toEqual([]);
    expect(data.analyses).toEqual([]);
    expect(data.documents).toEqual([]);
  });

  it('2. Queries real Firestore repositories and returns user cases and patients', async () => {
    const userId = 'usr_vet_1';
    const now = new Date().toISOString();

    await patientRepository.createPatient({
      id: 'pat_01',
      userId,
      name: 'Mel',
      species: 'FELINE',
      breed: 'Persa',
      ageYears: 2,
      ageMonths: 5,
      gender: 'FEMALE_SPAYED',
      weightKg: 4.2,
      tutorName: 'Ana Souza',
      tutorContact: '(11) 97777-6666',
      createdAt: now,
      updatedAt: now,
    });

    await caseRepository.createCase({
      id: 'case_01',
      userId,
      patientId: 'pat_01',
      caseNumber: 'CAS-2026-1001',
      status: 'ANAMNESIS_PENDING',
      title: 'Consulta: Mel (Gato)',
      chiefComplaint: 'Apatia e disúria há 24h.',
      currentVersion: 1,
      tags: ['FELINE', 'Urologia'],
      createdAt: now,
      updatedAt: now,
    });

    const dashboard = await dashboardService.getDashboardData(userId);
    expect(dashboard.cases.length).toBe(1);
    expect(dashboard.cases[0].title).toBe('Consulta: Mel (Gato)');
    expect(dashboard.patients.length).toBe(1);
    expect(dashboard.patients[0].name).toBe('Mel');
  });

  it('3. Multi-tenant Data Isolation - User A cannot see User B records', async () => {
    const userA = 'usr_vet_A';
    const userB = 'usr_vet_B';
    const now = new Date().toISOString();

    await caseRepository.createCase({
      id: 'case_user_A',
      userId: userA,
      patientId: 'pat_A',
      caseNumber: 'CAS-A',
      status: 'DRAFT',
      title: 'Caso do Veterinário A',
      chiefComplaint: 'Consulta A',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    await caseRepository.createCase({
      id: 'case_user_B',
      userId: userB,
      patientId: 'pat_B',
      caseNumber: 'CAS-B',
      status: 'DRAFT',
      title: 'Caso do Veterinário B',
      chiefComplaint: 'Consulta B',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    const dataA = await dashboardService.getDashboardData(userA);
    const dataB = await dashboardService.getDashboardData(userB);

    expect(dataA.cases.length).toBe(1);
    expect(dataA.cases[0].title).toBe('Caso do Veterinário A');

    expect(dataB.cases.length).toBe(1);
    expect(dataB.cases[0].title).toBe('Caso do Veterinário B');
  });
});
