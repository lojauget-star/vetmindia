export type AdministrationRoute =
  | 'ORAL'
  | 'SUBCUTANEOUS'
  | 'INTRAVENOUS'
  | 'INTRAMUSCULAR'
  | 'TOPICAL'
  | 'OPHTHALMIC'
  | 'OTIC';

export interface PrescriptionItemDetailed {
  id: string;
  medicationName: string;
  activeIngredient: string;
  dosageMgKg: number;
  concentrationMgMl?: number;
  tabletMg?: number;
  route: AdministrationRoute;
  frequency: string;
  durationDays: number;
  calculatedTotalDoseMg: number;
  calculatedVolumeMl?: number;
  calculatedTablets?: number;
  instructions: string;
  observations?: string;
}

export interface Prescription {
  id: string;
  caseId: string;
  hypothesisId: string;
  patientId: string;
  userId: string;
  createdBy: string;
  weightUsed: number; // Stored weight used for this calculation
  items: PrescriptionItemDetailed[];
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  version: number;
  createdAt: string;
  updatedAt: string;
}
