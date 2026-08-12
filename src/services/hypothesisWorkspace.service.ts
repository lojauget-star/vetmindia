import { caseRepository } from '@/repositories/case.repository';
import { analysisRepository } from '@/repositories/analysis.repository';
import { GroundedHypothesis, EvidenceItem, SuggestedExam, SuggestedNextStep, SuggestedConduct } from '@/types/rag.types';
import { PrescriptionItem } from '@/types/clinical.types';

export interface DynamicHypothesisWorkspaceData {
  hypothesis: GroundedHypothesis;
  evidence: EvidenceItem[];
  supportingFindings: string[];
  contradictingFindings: string[];
  suggestedExams: SuggestedExam[];
  nextSteps: SuggestedNextStep[];
  suggestedConducts: SuggestedConduct[];
  prescriptionItems: PrescriptionItem[];
  tutorExplanation: string;
}

export class HypothesisWorkspaceService {
  /**
   * Validates case ownership and hypothesis belonging
   */
  private async validateOwnershipAndBelonging(caseId: string, hypothesisId: string, userId: string) {
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para acessar este caso clínico.');
    }

    const hypotheses = await analysisRepository.getHypothesesByAnalysis(c.latestAnalysisId || caseId);
    const hyp = hypotheses.find((h) => h.id === hypothesisId);

    if (!hyp || (hyp.caseId && hyp.caseId !== caseId)) {
      throw new Error('Hipótese não pertence a este caso clínico.');
    }

    return { case: c, hypothesis: hyp };
  }

  /**
   * Gets evidence items specifically linked to hypothesisId
   */
  async getHypothesisEvidence(caseId: string, hypothesisId: string, userId: string): Promise<EvidenceItem[]> {
    await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);
    const allEvidence = await analysisRepository.getEvidenceByCase(caseId);
    return allEvidence.filter((e) => e.hypothesisId === hypothesisId);
  }

  /**
   * Gets suggested diagnostic exams tailored specifically to hypothesisId
   */
  async getSuggestedExams(caseId: string, hypothesisId: string, userId: string): Promise<SuggestedExam[]> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);

    return (hypothesis.recommendedExams || []).map((examName) => ({
      examName,
      priority: examName.toLowerCase().includes('ultrassonografia') || examName.toLowerCase().includes('radiografia') ? 'HIGH' : 'MEDIUM',
      rationale: `Exame específico para confirmar ou descartar ${hypothesis.diseaseName}`,
    }));
  }

  /**
   * Gets next steps tailored to hypothesisId
   */
  async getNextSteps(caseId: string, hypothesisId: string, userId: string): Promise<SuggestedNextStep[]> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);

    return [
      { step: `Iniciar triagem diagnóstica para ${hypothesis.diseaseName}`, timeframe: 'Nas próximas 2 horas' },
      { step: 'Reavaliar parâmetros vitais (Temperatura, FC, FR)', timeframe: 'A cada 4 horas' },
    ];
  }

  /**
   * Gets suggested therapeutic and monitoring conducts tailored to hypothesisId
   */
  async getSuggestedConduct(caseId: string, hypothesisId: string, userId: string): Promise<SuggestedConduct[]> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);

    if (hypothesis.diseaseName.toLowerCase().includes('gastroenterite') || hypothesis.diseaseName.toLowerCase().includes('gastrite')) {
      return [
        { action: 'Fluidoterapia de Reposição (Ringer Lactato 50ml/kg/dia)', category: 'THERAPEUTIC', description: 'Correção de desidratação decorrente da emese' },
        { action: 'Antiemético (Maropitant 1mg/kg SC a cada 24h)', category: 'THERAPEUTIC', description: 'Bloqueio de receptores NK1 para cessação de vômitos' },
        { action: 'Protetor de Mucosa (Omeprazol 1mg/kg IV a cada 12h)', category: 'THERAPEUTIC', description: 'Redução da acidez gástrica e suporte de mucosa' },
      ];
    }

    if (hypothesis.diseaseName.toLowerCase().includes('obstrução') || hypothesis.diseaseName.toLowerCase().includes('corpo estranho')) {
      return [
        { action: 'Jejum Oral Estrito', category: 'THERAPEUTIC', description: 'Prevenção de distensão gástrica e broncoaspiração' },
        { action: 'Radiografia Abdominal Simples e Contrastada', category: 'DIAGNOSTIC', description: 'Localização do radiopaco ou padrão de íleo obstrutivo' },
        { action: 'Avaliação Cirúrgica (Laparotomia Exploratória)', category: 'REFERRAL', description: 'Encaminhamento para cirurgia de emergência se obstrutivo' },
      ];
    }

    return [
      { action: `Suporte sintomático e monitoramento para ${hypothesis.diseaseName}`, category: 'THERAPEUTIC', description: 'Protocolo de estabilização do paciente' },
      { action: 'Monitoramento diário de TPC e Mucosas', category: 'MONITORING', description: 'Avaliação da resposta ao tratamento' },
    ];
  }

  /**
   * Gets client-facing tutor explanation in clear, non-technical language
   */
  async getTutorExplanation(caseId: string, hypothesisId: string, userId: string): Promise<string> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);

    if (hypothesis.diseaseName.toLowerCase().includes('gastroenterite')) {
      return `Explicação para o Tutor: O seu pet está com uma inflamação aguda no estômago e intestino (Gastroenterite), o que provoca os vômitos e a prostração. O tratamento inicial consiste em hidratá-lo com soro e aplicar medicamentos para cessar os vômitos.`;
    }

    if (hypothesis.diseaseName.toLowerCase().includes('obstrução') || hypothesis.diseaseName.toLowerCase().includes('corpo estranho')) {
      return `Explicação para o Tutor: Há uma suspeita de que o seu pet possa ter ingerido algum objeto ou corpo estranho que está bloqueando a passagem de alimentos no intestino. Precisamos realizar exames de imagem (raio-X e ultrassom) para confirmar e decidir se será necessária uma cirurgia.`;
    }

    return `Explicação para o Tutor: O seu pet está passando por uma investigação clínica para a suspeita de ${hypothesis.diseaseName}. Iniciamos o tratamento sintomático para deixá-lo confortável enquanto aguardamos os exames.`;
  }

  /**
   * Gets prescription items tailored specifically to hypothesisId
   */
  async getPrescriptionForHypothesis(caseId: string, hypothesisId: string, userId: string): Promise<PrescriptionItem[]> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);

    if (hypothesis.diseaseName.toLowerCase().includes('gastroenterite') || hypothesis.diseaseName.toLowerCase().includes('gastrite')) {
      return [
        {
          medicationName: 'Cerenia (Maropitant)',
          activeIngredient: 'Maropitant Citrato',
          dosageMgKg: 1.0,
          totalDosage: '1.0 mL (Injectable 10mg/mL)',
          route: 'SUBCUTANEOUS',
          frequency: 'A cada 24 horas',
          durationDays: 3,
          instructions: 'Administrar via subcutânea em região de escápula.',
        },
        {
          medicationName: 'Gaviz V (Omeprazol)',
          activeIngredient: 'Omeprazol',
          dosageMgKg: 1.0,
          totalDosage: '10 mg (1 comprimido)',
          route: 'ORAL',
          frequency: 'A cada 24 horas (em jejum)',
          durationDays: 7,
          instructions: 'Dar pela manhã antes da primeira refeição.',
        },
      ];
    }

    return [
      {
        medicationName: 'Dipirona Sódica Vet',
        activeIngredient: 'Dipirona',
        dosageMgKg: 25.0,
        totalDosage: '1.0 mL',
        route: 'ORAL',
        frequency: 'A cada 8 horas',
        durationDays: 3,
        instructions: 'Em caso de dor ou febre.',
      },
    ];
  }

  /**
   * Gets full consolidated dynamic workspace dataset for a selected hypothesis
   */
  async getFullHypothesisWorkspace(caseId: string, hypothesisId: string, userId: string): Promise<DynamicHypothesisWorkspaceData> {
    const { hypothesis } = await this.validateOwnershipAndBelonging(caseId, hypothesisId, userId);
    const evidence = await this.getHypothesisEvidence(caseId, hypothesisId, userId);
    const suggestedExams = await this.getSuggestedExams(caseId, hypothesisId, userId);
    const nextSteps = await this.getNextSteps(caseId, hypothesisId, userId);
    const suggestedConducts = await this.getSuggestedConduct(caseId, hypothesisId, userId);
    const prescriptionItems = await this.getPrescriptionForHypothesis(caseId, hypothesisId, userId);
    const tutorExplanation = await this.getTutorExplanation(caseId, hypothesisId, userId);

    return {
      hypothesis,
      evidence,
      supportingFindings: hypothesis.supportingFindings || [],
      contradictingFindings: hypothesis.contradictingFindings || [],
      suggestedExams,
      nextSteps,
      suggestedConducts,
      prescriptionItems,
      tutorExplanation,
    };
  }
}

export const hypothesisWorkspaceService = new HypothesisWorkspaceService();
