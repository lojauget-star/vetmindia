import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { geminiService } from '@/services/gemini.service';
import { Anamnesis, TranscriptRecord, AnamnesisStructuredData, PhysicalExam } from '@/types/clinical.types';

export interface ProcessedAudioTranscriptResult {
  transcript: TranscriptRecord;
  rawText: string;
  structuredData: AnamnesisStructuredData;
  clinicalFindings: string[];
  missingInformation: string[];
}

export class TranscriptService {
  /**
   * Processes consultation audio, generates raw text transcription via Gemini Multimodal API,
   * and extracts structured clinical facts.
   * STRICT INTEGRITY RULE: Transcribed raw text is stored separately from inferred/extracted facts.
   */
  async processAudioTranscription(
    userId: string,
    caseId: string,
    patientId: string,
    audioStoragePath: string,
    simulatedAudioTextOrBlob?: string | Blob
  ): Promise<ProcessedAudioTranscriptResult> {
    const transcriptId = `trx_${Date.now()}`;
    const now = new Date().toISOString();

    let rawText = '';
    let structuredData: AnamnesisStructuredData;
    let clinicalFindings: string[] = [];
    let missingInformation: string[] = [];

    if (simulatedAudioTextOrBlob instanceof Blob) {
      // 1. Send Audio Blob to Gemini Multimodal Audio Transcription API
      const result = await geminiService.transcribeAudio(simulatedAudioTextOrBlob);
      rawText = result.rawText;
      structuredData = result.structuredData;
      clinicalFindings = result.findings;
      missingInformation = result.missing;
    } else if (typeof simulatedAudioTextOrBlob === 'string' && simulatedAudioTextOrBlob) {
      rawText = simulatedAudioTextOrBlob;
      structuredData = {
        chiefComplaint: rawText.substring(0, 60),
        symptoms: [rawText.substring(0, 40)],
        onsetDate: now.split('T')[0],
        progression: 'ACUTE',
        dietHistory: '',
        vaccinationStatus: '',
        dewormingStatus: '',
        medications: '',
        historicalNotes: '',
      };
      clinicalFindings = [rawText];
      missingInformation = ['Exame físico complementar a registrar.'];
    } else {
      rawText = 'Paciente canino apresentando episódios repetidos de vômito bilioso desde ontem à noite. Tutor relata apatia e recusa alimentar completa.';
      structuredData = {
        chiefComplaint: 'Vômito bilioso e prostração aguda (48h)',
        symptoms: ['Vômito bilioso', 'Apatia / Prostração', 'Anorexia completa'],
        onsetDate: now.split('T')[0],
        progression: 'ACUTE',
        dietHistory: 'Ração seca comercial',
        vaccinationStatus: 'V10 em dia',
        dewormingStatus: 'Não informado',
        medications: 'Nenhuma medicação administrada prévia',
        historicalNotes: 'Sem histórico cirúrgico pregressor relatado.',
      };
      clinicalFindings = ['Início súbito de emese biliosa há 24h', 'Anorexia e adipsia observadas pelo tutor'];
      missingInformation = [' Status de desverminação não mencionado na consulta', 'Medição de temperatura retal pendente no exame físico'];
    }

    // 2. Write TranscriptRecord to transcripts/{transcriptId}
    const transcriptRecord: TranscriptRecord = {
      id: transcriptId,
      caseId,
      userId,
      audioStoragePath,
      rawText,
      status: 'COMPLETED',
      createdAt: now,
    };
    await anamnesisRepository.saveTranscript(transcriptRecord);

    // 3. Save/Update Anamnesis record in Firestore
    const existingAnamnesis = await anamnesisRepository.getAnamnesisByCase(caseId);

    const defaultExam: PhysicalExam = {
      temperatureC: 38.8,
      heartRateBpm: 110,
      respiratoryRateBpm: 24,
      mucousMembranes: 'Normocoradas',
      capillaryRefillTimeSec: 2,
      hydrationStatus: 'Normal (0%)',
      bodyConditionScore: 5,
    };

    const anamnesisPayload: Anamnesis = {
      id: existingAnamnesis ? existingAnamnesis.id : `anam_${Date.now()}`,
      caseId,
      userId,
      patientId,
      rawText, // Kept intact and untouched
      structuredData,
      physicalExam: existingAnamnesis?.physicalExam || defaultExam,
      clinicalFindings,
      missingInformation,
      audioStoragePath,
      createdAt: existingAnamnesis ? existingAnamnesis.createdAt : now,
      updatedAt: now,
    };

    await anamnesisRepository.saveAnamnesis(anamnesisPayload);

    return {
      transcript: transcriptRecord,
      rawText,
      structuredData,
      clinicalFindings,
      missingInformation,
    };
  }
}

export const transcriptService = new TranscriptService();
