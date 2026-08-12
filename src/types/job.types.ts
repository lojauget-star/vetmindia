/**
 * VETMIND ANALYSIS JOB TYPES
 */

export type JobStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface AnalysisJob {
  jobId: string;
  caseId: string;
  userId: string;
  status: JobStatus;
  progress: number; // 0 to 100
  currentStage: string;
  startedAt: string;
  completedAt?: string;
  error?: string;
  resultVersion: number;
}

export type AnalysisStage =
  | 'Entendendo a anamnese...'
  | 'Identificando achados...'
  | 'Consultando literatura...'
  | 'Comparando evidências...'
  | 'Construindo hipóteses...'
  | 'Validando análise...'
  | 'Concluído.';
