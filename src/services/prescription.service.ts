import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { prescriptionRepository } from '@/repositories/prescription.repository';
import { doseCalculationService } from '@/services/doseCalculation.service';
import { timelineService } from '@/services/timeline.service';
import { Prescription, PrescriptionItemDetailed } from '@/types/prescription.types';

export class PrescriptionService {
  /**
   * Generates initial draft prescription for case & hypothesis using patient weight
   */
  async generateDraftForHypothesis(caseId: string, hypothesisId: string, userId: string): Promise<Prescription> {
    const c = await caseRepository.getCase(caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para acessar este caso clínico.');
    }

    const patient = await patientRepository.getPatient(c.patientId);
    if (!patient) {
      throw new Error('Paciente associado a este caso não foi encontrado.');
    }

    const weightKg = patient.weightKg || 10.0; // Default or registered weight

    // Initial suggested medications for Gastroenterite or general conditions
    const defaultRawItems = [
      {
        medicationName: 'Cerenia (Maropitant)',
        activeIngredient: 'Maropitant Citrato',
        dosageMgKg: 1.0,
        concentrationMgMl: 10.0,
        route: 'SUBCUTANEOUS' as const,
        frequency: 'A cada 24 horas',
        durationDays: 3,
        instructions: 'Administrar via subcutânea em região de escápula.',
      },
      {
        medicationName: 'Gaviz V (Omeprazol)',
        activeIngredient: 'Omeprazol',
        dosageMgKg: 1.0,
        tabletMg: 10.0,
        route: 'ORAL' as const,
        frequency: 'A cada 24 horas (em jejum)',
        durationDays: 7,
        instructions: 'Dar pela manhã antes da primeira refeição.',
      },
    ];

    const items: PrescriptionItemDetailed[] = defaultRawItems.map((raw, idx) => {
      const calc = doseCalculationService.calculateDose({
        weightKg,
        dosageMgKg: raw.dosageMgKg,
        concentrationMgMl: raw.concentrationMgMl,
        tabletMg: raw.tabletMg,
      });

      return {
        id: `item_${Date.now()}_${idx}`,
        medicationName: raw.medicationName,
        activeIngredient: raw.activeIngredient,
        dosageMgKg: raw.dosageMgKg,
        concentrationMgMl: raw.concentrationMgMl,
        tabletMg: raw.tabletMg,
        route: raw.route,
        frequency: raw.frequency,
        durationDays: raw.durationDays,
        calculatedTotalDoseMg: calc.totalDoseMg,
        calculatedVolumeMl: calc.calculatedVolumeMl,
        calculatedTablets: calc.calculatedTablets,
        instructions: raw.instructions,
      };
    });

    const now = new Date().toISOString();
    return {
      id: `presc_${Date.now()}`,
      caseId,
      hypothesisId,
      patientId: c.patientId,
      userId,
      createdBy: userId,
      weightUsed: weightKg,
      items,
      status: 'DRAFT',
      version: 1,
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Recalculates all prescription item doses when weight is customized in the wizard.
   * ABSOLUTE RULE: Does NOT mutate or overwrite the patient's original registered weight in patients/{patientId}.
   */
  recalculateItemsForNewWeight(items: PrescriptionItemDetailed[], newWeightKg: number): PrescriptionItemDetailed[] {
    if (!newWeightKg || newWeightKg <= 0) {
      throw new Error('O peso utilizado para a prescrição deve ser maior que zero.');
    }

    return items.map((item) => {
      const calc = doseCalculationService.calculateDose({
        weightKg: newWeightKg,
        dosageMgKg: item.dosageMgKg,
        concentrationMgMl: item.concentrationMgMl,
        tabletMg: item.tabletMg,
      });

      return {
        ...item,
        calculatedTotalDoseMg: calc.totalDoseMg,
        calculatedVolumeMl: calc.calculatedVolumeMl,
        calculatedTablets: calc.calculatedTablets,
      };
    });
  }

  /**
   * Validates safety constraints and saves prescription to Firestore
   */
  async savePrescription(prescription: Prescription, userId: string): Promise<Prescription> {
    // 1. Validate Ownership
    const c = await caseRepository.getCase(prescription.caseId);
    if (!c || (c.userId !== userId && c.ownerId !== userId)) {
      throw new Error('Permissão negada para alterar a prescrição deste caso clínico.');
    }

    // 2. Safety & Information Completeness Validation
    if (!prescription.weightUsed || prescription.weightUsed <= 0) {
      throw new Error('Impossível gerar prescrição: O peso do paciente deve ser um valor numérico válido maior que zero.');
    }

    if (!prescription.items || prescription.items.length === 0) {
      throw new Error('Impossível gerar prescrição: Adicione ao menos um medicamento ao formulário.');
    }

    for (const item of prescription.items) {
      if (!item.medicationName || item.medicationName.trim() === '') {
        throw new Error('Falta informação crítica: Todos os medicamentos devem possuir um nome válido.');
      }
      if (!item.dosageMgKg || item.dosageMgKg <= 0) {
        throw new Error(`Falta informação crítica no medicamento ${item.medicationName}: A dose mg/kg deve ser maior que zero.`);
      }
      if (!item.durationDays || item.durationDays <= 0) {
        throw new Error(`Falta informação crítica no medicamento ${item.medicationName}: A duração do tratamento deve ser maior que zero.`);
      }
    }

    // 3. Save / Update in Firestore
    const existing = await prescriptionRepository.getPrescription(prescription.id);
    const result = existing
      ? await prescriptionRepository.updatePrescription(prescription.id, prescription)
      : await prescriptionRepository.createPrescription(prescription);

    // Automatically log domain timeline event
    timelineService.logPrescriptionCreated(prescription.caseId, userId, prescription.items.length).catch(() => {});
    return result;
  }
}

export const prescriptionService = new PrescriptionService();
