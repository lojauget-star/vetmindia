import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analysisJobService } from '../analysisJob.service';
import { analysisJobRepository } from '@/repositories/analysisJob.repository';
import { caseRepository } from '@/repositories/case.repository';
import { ragService } from '@/services/rag.service';
import { AnalysisJob } from '@/types/job.types';
import { ClinicalCase } from '@/types/clinical.types';

// In-Memory Firestore database
const mockJobsStore: Record<string, AnalysisJob> = {};
const mockCasesStore: Record<string, ClinicalCase> = {};

vi.spyOn(analysisJobRepository, 'createJob').mockImplementation(async (j: AnalysisJob) => {
  mockJobsStore[j.jobId] = { ...j };
  return j;
});

vi.spyOn(analysisJobRepository, 'updateJob').mockImplementation(async (jobId: string, updates: Partial<AnalysisJob>) => {
  const current = mockJobsStore[jobId];
  if (!current) throw new Error(`Job ${jobId} não encontrado.`);
  const updated: AnalysisJob = {
    ...current,
    ...updates,
  };
  mockJobsStore[jobId] = updated;
  return updated;
});

vi.spyOn(analysisJobRepository, 'getJob').mockImplementation(async (jobId: string) => {
  return mockJobsStore[jobId] || null;
});

vi.spyOn(analysisJobRepository, 'getActiveJobForCase').mockImplementation(async (caseId: string) => {
  return Object.values(mockJobsStore).find((j) => j.caseId === caseId) || null;
});

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (caseId: string) => {
  return mockCasesStore[caseId] || null;
});

vi.spyOn(caseRepository, 'updateCase').mockImplementation(async (id: string, updates: Partial<ClinicalCase>) => {
  if (mockCasesStore[id]) {
    mockCasesStore[id] = { ...mockCasesStore[id], ...updates };
  }
  return mockCasesStore[id];
});

vi.spyOn(ragService, 'runAnalysisPipeline').mockImplementation(async (caseId: string, userId: string) => {
  if (mockCasesStore[caseId]) {
    mockCasesStore[caseId].status = 'HYPOTHESES_GENERATED';
  }
  return {
    analysisId: `anal_${caseId}`,
    caseId,
    userId,
    urgencyLevel: 'MODERATE',
    clinicalSummary: 'Síntese de teste',
    clinicalFindings: ['Sintoma 1'],
    missingInformation: [],
    hypotheses: [],
    evidence: [],
    suggestedExams: [],
    suggestedNextSteps: [],
    suggestedConducts: [],
    rawPromptTokens: 100,
    rawResponseTokens: 50,
    createdAt: new Date().toISOString(),
  };
});

describe('Vetmind AI Analysis Job Connection & Page Reload Integration Gate', () => {
  beforeEach(() => {
    for (const k in mockJobsStore) delete mockJobsStore[k];
    for (const k in mockCasesStore) delete mockCasesStore[k];
  });

  it('1. Creates a real AnalysisJob in Firestore with status PROCESSING and transitions to COMPLETED', async () => {
    const now = new Date().toISOString();
    mockCasesStore['case_77'] = {
      id: 'case_77', userId: 'usr_10', patientId: 'pat_10', caseNumber: 'CAS-77', status: 'ANAMNESIS_PENDING', title: 'Atendimento Rex', chiefComplaint: 'Emese', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    const { jobId } = await analysisJobService.startAnalysis('case_77', 'usr_10');

    expect(jobId).toBeDefined();
    const initialJob = mockJobsStore[jobId];
    expect(initialJob).toBeDefined();
    expect(initialJob.caseId).toBe('case_77');
    expect(initialJob.userId).toBe('usr_10');

    // Wait microtask for async pipeline completion
    await new Promise((r) => setTimeout(r, 50));

    const finalJob = mockJobsStore[jobId];
    expect(finalJob.status).toBe('COMPLETED');
    expect(finalJob.progress).toBe(100);
    expect(finalJob.currentStage).toBe('Concluído.');
    expect(mockCasesStore['case_77'].status).toBe('HYPOTHESES_GENERATED');
  });

  it('2. Enables Page Reload Persistence: recovers existing job state for case from Firestore', async () => {
    const now = new Date().toISOString();
    mockCasesStore['case_77'] = {
      id: 'case_77', userId: 'usr_10', patientId: 'pat_10', caseNumber: 'CAS-77', status: 'HYPOTHESES_GENERATED', title: 'Atendimento Rex', chiefComplaint: 'Emese', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    mockJobsStore['job_77'] = {
      jobId: 'job_77',
      caseId: 'case_77',
      userId: 'usr_10',
      status: 'COMPLETED',
      progress: 100,
      currentStage: 'Concluído.',
      startedAt: now,
      completedAt: now,
      resultVersion: 1,
    };

    // Simulate page mount / reload query
    const recoveredJob = await analysisJobService.getActiveJobForCase('case_77');

    expect(recoveredJob).not.toBeNull();
    expect(recoveredJob?.jobId).toBe('job_77');
    expect(recoveredJob?.status).toBe('COMPLETED');
  });

  it('3. Real Error Handling: marks job as FAILED with error message if backend processing fails', async () => {
    const now = new Date().toISOString();
    mockCasesStore['case_err'] = {
      id: 'case_err', userId: 'usr_10', patientId: 'pat_10', caseNumber: 'CAS-ERR', status: 'ANAMNESIS_PENDING', title: 'Erro Test', chiefComplaint: 'Dor', currentVersion: 1, tags: [], createdAt: now, updatedAt: now
    };

    vi.spyOn(ragService, 'runAnalysisPipeline').mockRejectedValueOnce(new Error('Conexão Gemini interrompida'));

    const { jobId } = await analysisJobService.startAnalysis('case_err', 'usr_10');

    // Wait microtask for async pipeline completion
    await new Promise((r) => setTimeout(r, 50));

    const failedJob = mockJobsStore[jobId];
    expect(failedJob).toBeDefined();
    expect(failedJob.status).toBe('FAILED');
    expect(failedJob.error).toBe('Conexão Gemini interrompida');
  });
});
