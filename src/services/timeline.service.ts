import { caseRepository } from '@/repositories/case.repository';
import { timelineRepository } from '@/repositories/timeline.repository';
import { TimelineEvent, TimelineEventType } from '@/types/timeline.types';

export class TimelineService {
  /**
   * Internal helper to record a domain event in Firestore
   */
  async recordEvent(
    caseId: string,
    userId: string,
    type: TimelineEventType,
    title: string,
    description: string,
    metadata?: Record<string, any>
  ): Promise<TimelineEvent> {
    const event: TimelineEvent = {
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      caseId,
      userId,
      type,
      title,
      description,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };
    return await timelineRepository.createEvent(event);
  }

  async logCaseCreated(caseId: string, userId: string, caseNumber: string, patientName = 'Paciente'): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'CASE_CREATED',
      'Atendimento Iniciado',
      `Caso clínico N.º ${caseNumber} criado para o paciente ${patientName}.`
    );
  }

  async logAnamnesisUpdated(caseId: string, userId: string): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'ANAMNESIS_UPDATED',
      'Anamnese Atualizada',
      'Dados de anamnese, histórico clínico e exame físico foram salvos.'
    );
  }

  async logAudioRecorded(caseId: string, userId: string, durationSeconds?: number): Promise<TimelineEvent> {
    const desc = durationSeconds ? `Áudio de consulta gravado (${durationSeconds}s) e enviado ao Storage.` : 'Áudio de consulta enviado ao Storage.';
    return this.recordEvent(caseId, userId, 'AUDIO_RECORDED', 'Gravação de Áudio Anexada', desc);
  }

  async logTranscriptCreated(caseId: string, userId: string, wordCount?: number): Promise<TimelineEvent> {
    const desc = wordCount ? `Transcrição automática de áudio concluída (${wordCount} palavras).` : 'Transcrição automática de áudio concluída.';
    return this.recordEvent(caseId, userId, 'TRANSCRIPT_CREATED', 'Transcrição Concluída', desc);
  }

  async logAnalysisStarted(caseId: string, userId: string, jobId: string): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'ANALYSIS_STARTED',
      'Análise RAG Iniciada',
      `Motor de inteligência artificial acionado (Job: ${jobId}).`
    );
  }

  async logAnalysisCompleted(caseId: string, userId: string, hypothesesCount: number): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'ANALYSIS_COMPLETED',
      'Análise RAG Concluída',
      `Pipeline de literatura finalizado com ${hypothesesCount} hipótese(s) diagnóstica(s) gerada(s).`
    );
  }

  async logHypothesisSelected(caseId: string, userId: string, diseaseName: string): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'HYPOTHESIS_SELECTED',
      'Hipótese Selecionada',
      `O veterinário definiu a hipótese principal: ${diseaseName}.`
    );
  }

  async logPrescriptionCreated(caseId: string, userId: string, itemsCount: number): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'PRESCRIPTION_CREATED',
      'Prescrição Médica Salva',
      `Prescrição com ${itemsCount} medicamento(s) calculados deterministicamente.`
    );
  }

  async logDocumentGenerated(caseId: string, userId: string, docTitle: string): Promise<TimelineEvent> {
    return this.recordEvent(
      caseId,
      userId,
      'DOCUMENT_GENERATED',
      'Documento Emitido',
      `Documento oficial gerado: ${docTitle}.`
    );
  }

  /**
   * Retrieves chronological timeline for a case after ownership check
   */
  async getTimelineForCase(caseId: string, userId: string): Promise<TimelineEvent[]> {
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para acessar a linha do tempo deste caso.');
    }
    return await timelineRepository.getEventsByCase(caseId);
  }
}

export const timelineService = new TimelineService();
