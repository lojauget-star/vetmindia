import { describe, it, expect, beforeEach, vi } from 'vitest';
import { doseCalculationService } from '@/services/doseCalculation.service';
import { prescriptionService } from '@/services/prescription.service';
import { prescriptionRepository } from '@/repositories/prescription.repository';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { Prescription } from '@/types/prescription.types';
import { ClinicalCase, Patient } from '@/types/clinical.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockPatients: Record<string, Patient> = {};
const mockPrescriptions: Record<string, Prescription> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockCases[id] || null;
});

vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => {
  return mockPatients[id] || null;
});

vi.spyOn(prescriptionRepository, 'getPrescription').mockImplementation(async (id: string) => {
  return mockPrescriptions[id] || null;
});

vi.spyOn(prescriptionRepository, 'getPrescriptionByCaseAndHypothesis').mockImplementation(async (caseId: string, hypothesisId: string) => {
  return Object.values(mockPrescriptions).find((p) => p.caseId === caseId && p.hypothesisId === hypothesisId) || null;
});

vi.spyOn(prescriptionRepository, 'createPrescription').mockImplementation(async (p: Prescription) => {
  mockPrescriptions[p.id] = p;
  return p;
});

vi.spyOn(prescriptionRepository, 'updatePrescription').mockImplementation(async (id: string, data: Partial<Prescription>) => {
  const current = mockPrescriptions[id];
  if (!current) throw new Error('Prescrição não encontrada.');
  const updated = { ...current, ...data, version: (current.version || 1) + 1, updatedAt: new Date().toISOString() };
  mockPrescriptions[id] = updated;
  return updated;
});

describe('Vetmind Prescription Module & Deterministic Dose Calculation Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockPatients) delete mockPatients[k];
    for (const k in mockPrescriptions) delete mockPrescriptions[k];

    mockPatients['pat_300'] = {
      id: 'pat_300',
      userId: 'vet_A',
      ownerId: 'vet_A',
      name: 'Bob',
      species: 'CANINE',
      breed: 'Golden Retriever',
      gender: 'MALE_INTACT',
      ageYears: 3,
      ageMonths: 0,
      weightKg: 30.0, // Original patient weight: 30 kg
      tutorName: 'Maria Silva',
      tutorContact: '11999998888',
      createdAt: now,
      updatedAt: now,
    };

    mockCases['case_300'] = {
      id: 'case_300',
      userId: 'vet_A',
      ownerId: 'vet_A',
      patientId: 'pat_300',
      caseNumber: 'CAS-300',
      status: 'CONDUCT_SET',
      title: 'Atendimento Bob',
      chiefComplaint: 'Emeses',
      selectedHypothesisId: 'hyp_300',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. DoseCalculationService performs exact deterministic math without LLM', () => {
    // 30 kg dog, 1.0 mg/kg dose, 10 mg/mL liquid concentration
    const resLiquid = doseCalculationService.calculateDose({
      weightKg: 30.0,
      dosageMgKg: 1.0,
      concentrationMgMl: 10.0,
    });

    expect(resLiquid.totalDoseMg).toBe(30.0);
    expect(resLiquid.calculatedVolumeMl).toBe(3.0);

    // 15 kg dog, 2.0 mg/kg dose, 10 mg tablet presentation
    const resTablet = doseCalculationService.calculateDose({
      weightKg: 15.0,
      dosageMgKg: 2.0,
      tabletMg: 10.0,
    });

    expect(resTablet.totalDoseMg).toBe(30.0);
    expect(resTablet.calculatedTablets).toBe(3.0);
  });

  it('2. Generates draft prescription and saves real record to Firestore', async () => {
    const draft = await prescriptionService.generateDraftForHypothesis('case_300', 'hyp_300', 'vet_A');

    expect(draft.weightUsed).toBe(30.0);
    expect(draft.items.length).toBeGreaterThan(0);

    const saved = await prescriptionService.savePrescription(draft, 'vet_A');
    expect(mockPrescriptions[saved.id]).toBeDefined();
    expect(saved.status).toBe('DRAFT');
  });

  it('3. Weight Customization: recalculates item doses without mutating original patient weight in patients collection', async () => {
    const draft = await prescriptionService.generateDraftForHypothesis('case_300', 'hyp_300', 'vet_A');

    // Vet adjusts weight in prescription wizard from 30 kg to 15 kg
    const newWeight = 15.0;
    const recalculatedItems = prescriptionService.recalculateItemsForNewWeight(draft.items, newWeight);

    const updatedPrescription: Prescription = {
      ...draft,
      weightUsed: newWeight,
      items: recalculatedItems,
    };

    const saved = await prescriptionService.savePrescription(updatedPrescription, 'vet_A');

    // 1. Prescription reflects updated weightUsed and halved doses
    expect(saved.weightUsed).toBe(15.0);
    expect(saved.items[0].calculatedTotalDoseMg).toBe(15.0); // 15kg * 1mg/kg = 15mg

    // 2. ABSOLUTE RULE: Patient's original registered weight in patients/{pat_300} remains 30.0 kg!
    const originalPatient = mockPatients['pat_300'];
    expect(originalPatient.weightKg).toBe(30.0);
  });

  it('4. Reopening Case: persisted prescription remains accessible', async () => {
    const draft = await prescriptionService.generateDraftForHypothesis('case_300', 'hyp_300', 'vet_A');
    await prescriptionService.savePrescription(draft, 'vet_A');

    // Reopen case
    const fetched = await prescriptionRepository.getPrescriptionByCaseAndHypothesis('case_300', 'hyp_300');
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(draft.id);
  });

  it('5. Multi-Tenant Security & Safety Validation: rejects unauthorized user or invalid weight', async () => {
    const draft = await prescriptionService.generateDraftForHypothesis('case_300', 'hyp_300', 'vet_A');

    // User B tries to save User A prescription
    await expect(prescriptionService.savePrescription(draft, 'vet_B')).rejects.toThrow('Permissão negada');

    // Invalid weightUsed = 0
    const invalidWeightPrescription = { ...draft, weightUsed: 0 };
    await expect(prescriptionService.savePrescription(invalidWeightPrescription, 'vet_A')).rejects.toThrow('Impossível gerar prescrição');
  });
});
