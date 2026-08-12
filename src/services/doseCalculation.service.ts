export interface DoseCalculationInput {
  weightKg: number;
  dosageMgKg: number;
  concentrationMgMl?: number; // For liquid/injectable
  tabletMg?: number; // For oral solid tablets
}

export interface DoseCalculationResult {
  weightKg: number;
  dosageMgKg: number;
  totalDoseMg: number;
  calculatedVolumeMl?: number;
  calculatedTablets?: number;
  formattedInstruction: string;
}

export class DoseCalculationService {
  /**
   * Deterministically calculates total dose (mg) and volume (mL) or tablets.
   * ABSOLUTE RULE: No LLM/Gemini is used for math calculations.
   */
  calculateDose(input: DoseCalculationInput): DoseCalculationResult {
    const { weightKg, dosageMgKg, concentrationMgMl, tabletMg } = input;

    if (!weightKg || weightKg <= 0) {
      throw new Error('Peso inválido. O peso deve ser um número positivo maior que zero.');
    }
    if (!dosageMgKg || dosageMgKg <= 0) {
      throw new Error('Dose por kg inválida. A dose mg/kg deve ser maior que zero.');
    }

    // 1. Total Dose (mg) = weight (kg) * dosage (mg/kg)
    const totalDoseMg = Number((weightKg * dosageMgKg).toFixed(4));

    let calculatedVolumeMl: number | undefined;
    let calculatedTablets: number | undefined;
    let formattedInstruction = `Dose total: ${totalDoseMg} mg (${dosageMgKg} mg/kg para ${weightKg} kg).`;

    // 2. Liquid / Injectable calculation
    if (concentrationMgMl && concentrationMgMl > 0) {
      calculatedVolumeMl = Number((totalDoseMg / concentrationMgMl).toFixed(2));
      formattedInstruction += ` Volume a administrar: ${calculatedVolumeMl} mL (Concentração: ${concentrationMgMl} mg/mL).`;
    }

    // 3. Tablet calculation
    if (tabletMg && tabletMg > 0) {
      calculatedTablets = Number((totalDoseMg / tabletMg).toFixed(2));
      formattedInstruction += ` Quantidade: ${calculatedTablets} comprimido(s) (Apresentação: ${tabletMg} mg).`;
    }

    return {
      weightKg,
      dosageMgKg,
      totalDoseMg,
      calculatedVolumeMl,
      calculatedTablets,
      formattedInstruction,
    };
  }
}

export const doseCalculationService = new DoseCalculationService();
