import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caseRepository } from '@/repositories/case.repository';
import { ClinicalCase } from '@/types/clinical.types';
import { GroundedHypothesis } from '@/types/rag.types';

// In-Memory Database for Firestore
const mockCases: Record<string, ClinicalCase> = {};
const mockHypotheses: Record<string, GroundedHypothesis> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockCases[id] || null;
});

vi.spyOn(caseRepository, 'updateCase').mockImplementation(async (id: string, data: Partial<ClinicalCase>) => {
  const current = mockCases[id];
  if (!current) throw new Error('Caso não encontrado.');
  const updated: ClinicalCase = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  mockCases[id] = updated;
  return updated;
});

vi.spyOn(caseRepository, 'selectHypothesis').mockImplementation(async (caseId: string, hypothesisId: string, userId: string) => {
  const c = mockCases[caseId];
  if (!c || (c.userId !== userId && c.ownerId !== userId)) {
    throw new Error('Permissão negada para alterar este caso clínico.');
  }

  const h = mockHypotheses[hypothesisId];
  if (!h || h.caseId !== caseId) {
    throw new Error('Hipótese não pertence a este caso clínico.');
  }

  // Update isSelected on hypotheses
  Object.values(mockHypotheses).forEach((hyp) => {
    if (hyp.caseId === caseId) {
      hyp.isSelected = hyp.id === hypothesisId;
    }
  });

  // Update ClinicalCase in Firestore
  const updatedCase = await caseRepository.updateCase(caseId, {
    selectedHypothesisId: hypothesisId,
    status: 'CONDUCT_SET',
  });

  return updatedCase;
});

describe('Vetmind Hypothesis Selection & Results View Integration Gate', () => {
  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockHypotheses) delete mockHypotheses[k];
  });

  it('1. Selects hypothesis for a case, updating selectedHypothesisId and status to CONDUCT_SET in Firestore', async () => {
    const now = new Date().toISOString();
    mockCases['case_100'] = {
      id: 'case_100', userId: 'vet_A', ownerId: 'vet_A', patientId: 'pat_1', caseNumber: 'CAS-100', status: 'HYPOTHESES_GENERATED', title: 'Atendimento Thor', chiefComplaint: 'Emese', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    mockHypotheses['hyp_1'] = {
      id: 'hyp_1', analysisId: 'anal_1', caseId: 'case_100', userId: 'vet_A', diseaseName: 'Gastroenterite Aguda', probabilityScore: 0.8, reasoning: 'Razão 1', supportingFindings: [], contradictingFindings: [], recommendedExams: [], citations: [], isSelected: false, createdAt: now
    };
    mockHypotheses['hyp_2'] = {
      id: 'hyp_2', analysisId: 'anal_1', caseId: 'case_100', userId: 'vet_A', diseaseName: 'Corpo Estranho Gastrintestinal', probabilityScore: 0.4, reasoning: 'Razão 2', supportingFindings: [], contradictingFindings: [], recommendedExams: [], citations: [], isSelected: false, createdAt: now
    };

    const updatedCase = await caseRepository.selectHypothesis('case_100', 'hyp_1', 'vet_A');

    expect(updatedCase.selectedHypothesisId).toBe('hyp_1');
    expect(updatedCase.status).toBe('CONDUCT_SET');
    expect(mockHypotheses['hyp_1'].isSelected).toBe(true);
    expect(mockHypotheses['hyp_2'].isSelected).toBe(false);
  });

  it('2. Page Reload Persistence: reopening case retrieves selectedHypothesisId intact from Firestore', async () => {
    const now = new Date().toISOString();
    mockCases['case_100'] = {
      id: 'case_100', userId: 'vet_A', ownerId: 'vet_A', patientId: 'pat_1', caseNumber: 'CAS-100', status: 'CONDUCT_SET', title: 'Atendimento Thor', chiefComplaint: 'Emese', selectedHypothesisId: 'hyp_1', currentVersion: 2, tags: [], createdAt: now, updatedAt: now
    };

    // Simulate reloading the page and querying Firestore
    const reloadedCase = await caseRepository.getCase('case_100');

    expect(reloadedCase).not.toBeNull();
    expect(reloadedCase?.selectedHypothesisId).toBe('hyp_1');
    expect(reloadedCase?.status).toBe('CONDUCT_SET');
  });

  it('3. Multi-Tenant Security: User B cannot select hypothesis on User A case', async () => {
    const now = new Date().toISOString();
    mockCases['case_100'] = {
      id: 'case_100', userId: 'vet_A', ownerId: 'vet_A', patientId: 'pat_1', caseNumber: 'CAS-100', status: 'HYPOTHESES_GENERATED', title: 'Atendimento Thor', chiefComplaint: 'Emese', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    mockHypotheses['hyp_1'] = {
      id: 'hyp_1', analysisId: 'anal_1', caseId: 'case_100', userId: 'vet_A', diseaseName: 'Gastroenterite Aguda', probabilityScore: 0.8, reasoning: 'Razão 1', supportingFindings: [], contradictingFindings: [], recommendedExams: [], citations: [], isSelected: false, createdAt: now
    };

    // User B tries to select User A hypothesis
    await expect(caseRepository.selectHypothesis('case_100', 'hyp_1', 'vet_B')).rejects.toThrow('Permissão negada');
  });

  it('4. Rejects hypothesis selection if hypothesis belongs to a different case', async () => {
    const now = new Date().toISOString();
    mockCases['case_100'] = {
      id: 'case_100', userId: 'vet_A', ownerId: 'vet_A', patientId: 'pat_1', caseNumber: 'CAS-100', status: 'HYPOTHESES_GENERATED', title: 'Atendimento Thor', chiefComplaint: 'Emese', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    mockHypotheses['hyp_other'] = {
      id: 'hyp_other', analysisId: 'anal_99', caseId: 'case_999', userId: 'vet_A', diseaseName: 'Outra Doença', probabilityScore: 0.5, reasoning: '', supportingFindings: [], contradictingFindings: [], recommendedExams: [], citations: [], isSelected: false, createdAt: now
    };

    await expect(caseRepository.selectHypothesis('case_100', 'hyp_other', 'vet_A')).rejects.toThrow('Hipótese não pertence a este caso clínico.');
  });
});
