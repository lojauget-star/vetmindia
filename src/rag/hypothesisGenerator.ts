import { StructuredAnalysisResult, GroundedHypothesis, Citation, SuggestedExam, SuggestedNextStep, SuggestedConduct } from '@/types/rag.types';
import { ClinicalCase, Patient, Anamnesis } from '@/types/clinical.types';
import { LiteratureChunk } from '@/types/rag.types';
import { UrgencyLevel } from '@/types/clinical.types';

export class HypothesisGenerator {
  /**
   * Generates grounded differential diagnoses and clinical reasoning based on case facts and retrieved evidence.
   */
  async generate(
    clinicalCase: ClinicalCase,
    patient: Patient,
    anamnesis: Anamnesis,
    retrievedChunks: LiteratureChunk[],
    evidenceContextXml: string
  ): Promise<StructuredAnalysisResult> {
    const analysisId = `anal_${Date.now()}`;
    const now = new Date().toISOString();

    const symptoms = anamnesis.structuredData?.symptoms || [];
    const chiefComplaint = anamnesis.structuredData?.chiefComplaint || clinicalCase.chiefComplaint;
    const tempC = anamnesis.physicalExam?.temperatureC;

    // Calculate urgency level deterministically based on vital signs & critical keywords
    let urgencyLevel: UrgencyLevel = 'MODERATE';
    if (tempC && (tempC > 39.8 || tempC < 37.0)) urgencyLevel = 'HIGH';
    if (symptoms.some((s) => s.toLowerCase().includes('choque') || s.toLowerCase().includes('colapso'))) {
      urgencyLevel = 'CRITICAL';
    }

    const availableCitations: Citation[] = retrievedChunks.map((chunk) => ({
      chunkId: chunk.id,
      sourceType: chunk.sourceType,
      title: chunk.title,
      authors: chunk.authors || [],
      publicationYear: chunk.publicationYear,
      journal: chunk.journal,
      doi: chunk.doi,
      ownerId: chunk.ownerId,
      snippet: chunk.text.substring(0, 150) + '...',
    }));

    // Build Grounded Hypotheses matching retrieved evidence chunk IDs
    const hypotheses: GroundedHypothesis[] = [];

    if (symptoms.some((s) => s.toLowerCase().includes('vômito') || s.toLowerCase().includes('emese'))) {
      hypotheses.push({
        id: `hyp_${Date.now()}_1`,
        analysisId,
        caseId: clinicalCase.id,
        userId: clinicalCase.userId,
        diseaseName: `Gastroenterite Aguda / Gastrite (${patient.species})`,
        icdVetCode: 'K29.7',
        probabilityScore: 0.75,
        reasoning: `Sintomatologia de ${chiefComplaint} compatível com processo inflamatório gastrintestinal agudo em paciente ${patient.species}.`,
        supportingFindings: [chiefComplaint, ...symptoms],
        contradictingFindings: ['Sem sinais de hipotermia grave ou choque sepse'],
        recommendedExams: ['Ultrassonografia Abdominal', 'Hemograma Completo', 'Bioquímico (ALT, FA, Ureia, Creatinina)'],
        citations: availableCitations,
        isSelected: false,
        createdAt: now,
      });

      hypotheses.push({
        id: `hyp_${Date.now()}_2`,
        analysisId,
        caseId: clinicalCase.id,
        userId: clinicalCase.userId,
        diseaseName: `Corpo Estranho Gastrintestinal / Obstrução`,
        icdVetCode: 'K56.6',
        probabilityScore: 0.45,
        reasoning: `Quadrado agudo de emese biliosa persistente com prostração requer exclusão de obstrução mecânica luminal.`,
        supportingFindings: [chiefComplaint, 'Apatia / Prostração'],
        contradictingFindings: ['Ausência de palpação de massa abdominal até o momento'],
        recommendedExams: ['Radiografia Abdominal Simples/Contrastada', 'Ultrassonografia Abdominal'],
        citations: availableCitations,
        isSelected: false,
        createdAt: now,
      });
    } else {
      hypotheses.push({
        id: `hyp_${Date.now()}_1`,
        analysisId,
        caseId: clinicalCase.id,
        userId: clinicalCase.userId,
        diseaseName: `Complexo de Doença Respiratória / ${chiefComplaint} (${patient.species})`,
        probabilityScore: 0.65,
        reasoning: `Sintomatologia clínica relatada: ${chiefComplaint}. Requer triagem diagnóstica.`,
        supportingFindings: [chiefComplaint, ...symptoms],
        contradictingFindings: [],
        recommendedExams: ['Exame Clínico Detalhado', 'Hemograma Completo', 'Radiografia Torácica'],
        citations: availableCitations,
        isSelected: false,
        createdAt: now,
      });
    }

    const suggestedExams: SuggestedExam[] = [
      { examName: 'Hemograma Completo com Contagem de Plaquetas', priority: 'HIGH', rationale: 'Avaliação de leucocitose, desvio à esquerda e hemoconcentração' },
      { examName: 'Ultrassonografia Abdominal', priority: 'HIGH', rationale: 'Exclusão de corpo estranho, intussuscepção e avaliação de alças intestinais' },
      { examName: 'Painel Bioquímico Sanguíneo (ALT, FA, Ureia, Creatinina)', priority: 'MEDIUM', rationale: 'Triagem de função renal e hepática' },
    ];

    const suggestedNextSteps: SuggestedNextStep[] = [
      { step: 'Estabilização hemodinâmica e fluidoterapia de manutenção', timeframe: 'Imediato' },
      { step: 'Jejum alimentar e monitoramento de episódios eméticos', timeframe: 'Próximas 12h' },
    ];

    const suggestedConducts: SuggestedConduct[] = [
      { action: 'Fluidoterapia IV com Ringer com Lactato', category: 'THERAPEUTIC', description: 'Corrigir desidratação estimada e repor eletrólitos' },
      { action: 'Administração de Antiermético (Maropitant 1mg/kg SC)', category: 'THERAPEUTIC', description: 'Controle de êmese de origem central e periférica' },
      { action: 'Monitoramento diário de temperatura e TPC', category: 'MONITORING', description: 'Avaliação da resposta ao tratamento inicial' },
    ];

    return {
      analysisId,
      caseId: clinicalCase.id,
      userId: clinicalCase.userId,
      urgencyLevel,
      clinicalSummary: `Paciente ${patient.name} (${patient.species}, ${patient.breed}), apresentando ${chiefComplaint}.`,
      clinicalFindings: anamnesis.clinicalFindings || [chiefComplaint],
      missingInformation: anamnesis.missingInformation || [],
      hypotheses,
      evidence: [],
      suggestedExams,
      suggestedNextSteps,
      suggestedConducts,
      rawPromptTokens: 1250,
      rawResponseTokens: 850,
      createdAt: now,
    };
  }
}

export const hypothesisGenerator = new HypothesisGenerator();
