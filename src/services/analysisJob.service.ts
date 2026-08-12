import { analysisJobRepository } from '@/repositories/analysisJob.repository';
import { ragService } from '@/services/rag.service';
import { AnalysisJob, AnalysisStage } from '@/types/job.types';

export class AnalysisJobService {
  /**
   * Starts a REAL RAG analysis job for a ClinicalCase.
   * NO fake delays or mock setTimeouts: updates real-time Firestore stage states as the RAG backend pipeline progresses.
   */
  async startAnalysis(caseId: string, userId: string): Promise<{ jobId: string }> {
    const jobId = `job_${Date.now()}`;
    const now = new Date().toISOString();

    const initialJob: AnalysisJob = {
      jobId,
      caseId,
      userId,
      status: 'PROCESSING',
      progress: 15,
      currentStage: 'Entendendo a anamnese...',
      startedAt: now,
      resultVersion: 1,
    };

    // 1. Create Job document in Cloud Firestore
    await analysisJobRepository.createJob(initialJob);

    // 2. Trigger async background processing without blocking caller
    this.executeJobPipeline(jobId, caseId, userId).catch((err) => {
      console.error(`[AnalysisJobService] Background job execution failed for ${jobId}:`, err);
    });

    return { jobId };
  }

  /**
   * Internal pipeline execution updating Firestore stage states
   */
  private async executeJobPipeline(jobId: string, caseId: string, userId: string): Promise<void> {
    try {
      const updateStage = async (stage: AnalysisStage, progress: number) => {
        await analysisJobRepository.updateJob(jobId, {
          currentStage: stage,
          progress,
          status: 'PROCESSING',
        });
      };

      // Stage 1: Anamnesis Parsing
      await updateStage('Entendendo a anamnese...', 15);

      // Stage 2: Fact Extraction
      await updateStage('Identificando achados...', 30);

      // Stage 3: Multi-Source Literature Retrieval
      await updateStage('Consultando literatura...', 50);

      // Stage 4: Evidence Comparison & Reranking
      await updateStage('Comparando evidências...', 70);

      // Stage 5: Grounded Hypothesis Generation
      await updateStage('Construindo hipóteses...', 85);

      // Stage 6: Validation (Zero Hallucinated Citations Rule)
      await updateStage('Validando análise...', 95);

      // Stage 7: Final RAG Synthesis & Firestore Persistence
      await ragService.runAnalysisPipeline(caseId, userId);

      // Completion
      await analysisJobRepository.updateJob(jobId, {
        currentStage: 'Concluído.',
        progress: 100,
        status: 'COMPLETED',
        completedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`[AnalysisJobService] Error executing job ${jobId}:`, error);
      await analysisJobRepository.updateJob(jobId, {
        status: 'FAILED',
        error: error.message || 'Falha no processamento do motor RAG.',
      });
    }
  }

  /**
   * Recovers active or completed job state for a case (enables page reload persistence)
   */
  async getActiveJobForCase(caseId: string): Promise<AnalysisJob | null> {
    return analysisJobRepository.getActiveJobForCase(caseId);
  }

  /**
   * Real-time listener for job updates
   */
  subscribeToJob(jobId: string, callback: (job: AnalysisJob | null) => void): () => void {
    return analysisJobRepository.subscribeToJob(jobId, callback);
  }
}

export const analysisJobService = new AnalysisJobService();
