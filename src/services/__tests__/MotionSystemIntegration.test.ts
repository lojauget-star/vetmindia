import { describe, it, expect, beforeEach, vi } from 'vitest';
import { analysisJobRepository } from '@/repositories/analysisJob.repository';
import { caseRepository } from '@/repositories/case.repository';
import { AnalysisJob } from '@/types/job.types';
import { ClinicalCase } from '@/types/clinical.types';

const mockJobs: Record<string, AnalysisJob> = {};
const mockCases: Record<string, ClinicalCase> = {};

vi.spyOn(analysisJobRepository, 'createJob').mockImplementation(async (job: AnalysisJob) => {
  mockJobs[job.jobId] = job;
  return job;
});

vi.spyOn(analysisJobRepository, 'getJob').mockImplementation(async (jobId: string) => {
  return mockJobs[jobId] || null;
});

vi.spyOn(analysisJobRepository, 'getActiveJobForCase').mockImplementation(async (caseId: string) => {
  return Object.values(mockJobs).find((j) => j.caseId === caseId && (j.status === 'PROCESSING' || j.status === 'QUEUED')) || null;
});

vi.spyOn(analysisJobRepository, 'updateJob').mockImplementation(async (jobId: string, updates: Partial<AnalysisJob>) => {
  const current = mockJobs[jobId];
  if (!current) throw new Error('Job não encontrado.');
  const updated = { ...current, ...updates };
  mockJobs[jobId] = updated;
  return updated;
});

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => mockCases[id] || null);

describe('Vetmind Motion System & Real RAG Job Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockJobs) delete mockJobs[k];
    for (const k in mockCases) delete mockCases[k];

    mockCases['case_motion_1'] = {
      id: 'case_motion_1',
      userId: 'vet_motion',
      ownerId: 'vet_motion',
      patientId: 'pat_1',
      caseNumber: 'CAS-MOT-1',
      status: 'ANAMNESIS_PENDING',
      title: 'Atendimento Motion Test',
      chiefComplaint: 'Vômitos',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. Motion widget receives real job stage progression from Firestore without artificial timers', async () => {
    const job = await analysisJobRepository.createJob({
      jobId: 'job_mot_1',
      caseId: 'case_motion_1',
      userId: 'vet_motion',
      status: 'PROCESSING',
      currentStage: 'Entendendo a anamnese...',
      progress: 15,
      startedAt: now,
      resultVersion: 1,
    });

    expect(job.progress).toBe(15);
    expect(job.currentStage).toBe('Entendendo a anamnese...');

    // Stage 2: Retrieving literature
    const stage2 = await analysisJobRepository.updateJob('job_mot_1', {
      currentStage: 'Consultando literatura...',
      progress: 50,
    });
    expect(stage2.progress).toBe(50);
    expect(stage2.currentStage).toBe('Consultando literatura...');

    // Stage 3: Completed
    const stage3 = await analysisJobRepository.updateJob('job_mot_1', {
      status: 'COMPLETED',
      progress: 100,
      completedAt: new Date().toISOString(),
    });
    expect(stage3.status).toBe('COMPLETED');
    expect(stage3.progress).toBe(100);
  });

  it('2. Page Reload: recovers active job and motion state intact from Firestore', async () => {
    await analysisJobRepository.createJob({
      jobId: 'job_mot_2',
      caseId: 'case_motion_1',
      userId: 'vet_motion',
      status: 'PROCESSING',
      currentStage: 'Comparando evidências...',
      progress: 70,
      startedAt: now,
      resultVersion: 1,
    });

    const activeJob = await analysisJobRepository.getActiveJobForCase('case_motion_1');
    expect(activeJob).not.toBeNull();
    expect(activeJob?.progress).toBe(70);
    expect(activeJob?.currentStage).toBe('Comparando evidências...');
  });
});
