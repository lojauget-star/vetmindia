import { ClinicalCase, Patient, Anamnesis } from '@/types/clinical.types';
import { AnonymizedCaseContent } from '@/types/marketing.types';

export class AnonymizationService {
  /**
   * Sanitizes clinical case data, removing all tutor names, phone numbers, addresses, and personal IDs
   * before sending data to generative AI models or public marketing projects.
   */
  anonymizeCase(clinicalCase: ClinicalCase, patient?: Patient | null, anamnesis?: Anamnesis | null): AnonymizedCaseContent {
    const removedFields: string[] = [];

    // 1. Sanitize Patient & Tutor Information
    if (patient) {
      if (patient.tutorName) removedFields.push(`Nome do tutor: ${patient.tutorName}`);
      if (patient.tutorContact) removedFields.push(`Contato do tutor: ${patient.tutorContact}`);
    }

    // 2. Anonymize Chief Complaint & Clinical Text via Regex Regex Sanitize
    let sanitizedComplaint = clinicalCase.chiefComplaint || 'Atendimento de rotina';
    sanitizedComplaint = this.maskPersonalPatterns(sanitizedComplaint, removedFields);

    let sanitizedSummary = anamnesis?.rawText || 'Sem resumo adicional de anamnese.';
    sanitizedSummary = this.maskPersonalPatterns(sanitizedSummary, removedFields);

    // 3. Construct clean anonymized record
    const speciesLabel = patient?.species ? (patient.species === 'CANINE' ? 'Cão' : patient.species === 'FELINE' ? 'Gato' : patient.species) : 'Paciente';
    const breedLabel = patient?.breed || 'SRD';
    const ageLabel = patient?.ageYears ? `${patient.ageYears} anos` : 'Idade não informada';

    return {
      originalCaseId: clinicalCase.id,
      sanitizedTitle: `Caso Clínico (${speciesLabel} - ${breedLabel})`,
      sanitizedSpecies: speciesLabel,
      sanitizedBreed: breedLabel,
      sanitizedAge: ageLabel,
      sanitizedChiefComplaint: sanitizedComplaint,
      sanitizedClinicalSummary: sanitizedSummary,
      removedFields: Array.from(new Set(removedFields)),
    };
  }

  /**
   * Replaces phone numbers, email addresses, and names with anonymized placeholders
   */
  private maskPersonalPatterns(text: string, removedTracker: string[]): string {
    let sanitized = text;

    // Phone numbers
    const phoneRegex = /(?:\+?55\s?)?(?:\(?\d{2}\)?\s?)?(?:9?\d{4}[-\s]?\d{4})/g;
    if (phoneRegex.test(sanitized)) {
      removedTracker.push('Telefones ou contatos numéricos');
      sanitized = sanitized.replace(phoneRegex, '[CONTATO REMOVIDO]');
    }

    // Emails
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    if (emailRegex.test(sanitized)) {
      removedTracker.push('Endereço de e-mail');
      sanitized = sanitized.replace(emailRegex, '[EMAIL REMOVIDO]');
    }

    // Tutor / Owner Mentions
    const tutorRegex = /(?:tutor|proprietário|dono|sr\.|sra\.)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi;
    if (tutorRegex.test(sanitized)) {
      removedTracker.push('Menção direta ao tutor');
      sanitized = sanitized.replace(tutorRegex, 'Tutor [ANÔNIMO]');
    }

    return sanitized;
  }
}

export const anonymizationService = new AnonymizationService();
