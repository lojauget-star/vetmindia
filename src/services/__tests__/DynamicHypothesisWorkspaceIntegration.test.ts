import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caseRepository } from '@/repositories/case.repository';
import { analysisRepository } from '@/repositories/analysis.repository';
import { hypothesisWorkspaceService } from '@/services/hypothesisWorkspace.service';
import { ClinicalCase, Analysis } from '@/types/clinical.types';
import { GroundedHypothesis, EvidenceItem } from '@/types/rag.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockAnalyses: Record<string, Analysis> = {};
const mockHypotheses: Record<string, GroundedHypothesis[]> = {};
const mockEvidence: Record<string, EvidenceItem[]> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockCases[id] || null;
});

vi.spyOn(analysisRepository, 'getHypothesesByAnalysis').mockImplementation(async (analysisId: string) => {
  return mockHypotheses[analysisId] || [];
});

vi.spyOn(analysisRepository, 'getEvidenceByCase').mockImplementation(async (caseId: string) => {
  return mockEvidence[caseId] || [];
});

describe('Vetmind Dynamic Hypothesis Workspace Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockAnalyses) delete mockAnalyses[k];
    for (const k in mockHypotheses) delete mockHypotheses[k];
    for (const k in mockEvidence) delete mockEvidence[k];

    // Setup Case for Vet A
    mockCases['case_200'] = {
      id: 'case_200',
      userId: 'vet_A',
      ownerId: 'vet_A',
      patientId: 'pat_2',
      caseNumber: 'CAS-200',
      status: 'HYPOTHESES_GENERATED',
      title: 'Atendimento Mel',
      chiefComplaint: 'Vômito e apatia',
      latestAnalysisId: 'anal_200',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    // Setup 2 Hypotheses for case_200
    mockHypotheses['anal_200'] = [
      {
        id: 'hyp_A',
        analysisId: 'anal_200',
        caseId: 'case_200',
        userId: 'vet_A',
        diseaseName: 'Gastroenterite Aguda',
        probabilityScore: 0.85,
        reasoning: 'Raciocínio clínico específico da Gastroenterite Aguda',
        supportingFindings: ['Vômito alimentares', 'Desidratação leve'],
        contradictingFindings: ['Sem febre'],
        recommendedExams: ['Hemograma Completo', 'Ultrassonografia Abdominal'],
        citations: [],
        isSelected: true,
        createdAt: now,
      },
      {
        id: 'hyp_B',
        analysisId: 'anal_200',
        caseId: 'case_200',
        userId: 'vet_A',
        diseaseName: 'Obstrução por Corpo Estranho',
        probabilityScore: 0.5,
        reasoning: 'Raciocínio clínico específico de Obstrução por Corpo Estranho',
        supportingFindings: ['Dor à palpação abdominal', 'Histórico de roer brinquedos'],
        contradictingFindings: ['Defecou hoje cedo'],
        recommendedExams: ['Radiografia Abdominal Contrastada'],
        citations: [],
        isSelected: false,
        createdAt: now,
      },
    ];

    // Setup Evidence for case_200
    mockEvidence['case_200'] = [
      {
        id: 'ev_A',
        caseId: 'case_200',
        userId: 'vet_A',
        hypothesisId: 'hyp_A',
        literatureChunkId: 'chunk_1',
        paperTitle: 'Manual de Gastroenterologia Canina',
        journal: 'Journal of Vet Internal Med',
        publicationYear: 2023,
        authors: ['Dr. Smith'],
        snippet: 'Evidência A para gastroenterite',
        relevanceScore: 0.9,
        createdAt: now,
      },
      {
        id: 'ev_B',
        caseId: 'case_200',
        userId: 'vet_A',
        hypothesisId: 'hyp_B',
        literatureChunkId: 'chunk_2',
        paperTitle: 'Tratado de Cirurgia de Corpo Estranho',
        journal: 'Vet Surgery Today',
        publicationYear: 2024,
        authors: ['Dr. Jones'],
        snippet: 'Evidência B para obstrução intestinal',
        relevanceScore: 0.85,
        createdAt: now,
      },
    ];
  });

  it('1. Fetches 9 dynamic cards for Hipótese A (Gastroenterite Aguda)', async () => {
    const resA = await hypothesisWorkspaceService.getFullHypothesisWorkspace('case_200', 'hyp_A', 'vet_A');

    expect(resA.hypothesis.diseaseName).toBe('Gastroenterite Aguda');
    expect(resA.evidence[0].hypothesisId).toBe('hyp_A');
    expect(resA.supportingFindings).toContain('Vômito alimentares');
    expect(resA.suggestedConducts.some((c) => c.action.includes('Fluidoterapia'))).toBe(true);
    expect(resA.prescriptionItems.some((p) => p.medicationName.includes('Cerenia'))).toBe(true);
    expect(resA.tutorExplanation).toContain('Gastroenterite');
  });

  it('2. Switching to Hipótese B (Obstrução) dynamically updates ALL dependent card contents', async () => {
    const resB = await hypothesisWorkspaceService.getFullHypothesisWorkspace('case_200', 'hyp_B', 'vet_A');

    expect(resB.hypothesis.diseaseName).toBe('Obstrução por Corpo Estranho');
    expect(resB.evidence[0].hypothesisId).toBe('hyp_B');
    expect(resB.supportingFindings).toContain('Histórico de roer brinquedos');
    expect(resB.suggestedConducts.some((c) => c.action.includes('Jejum Oral') || c.action.includes('Cirúrgica'))).toBe(true);
    expect(resB.tutorExplanation).toContain('objeto ou corpo estranho');
  });

  it('3. Multi-Tenant Security: User B cannot fetch hypothesis workspace for User A case', async () => {
    await expect(
      hypothesisWorkspaceService.getFullHypothesisWorkspace('case_200', 'hyp_A', 'vet_B')
    ).rejects.toThrow('Permissão negada');
  });

  it('4. Rejects request if hypothesisId does not belong to caseId', async () => {
    await expect(
      hypothesisWorkspaceService.getFullHypothesisWorkspace('case_200', 'hyp_NON_EXISTENT', 'vet_A')
    ).rejects.toThrow('Hipótese não pertence a este caso clínico.');
  });
});
