/**
 * VETMIND CLINICAL DOMAIN TYPES
 * Root Central Entity: ClinicalCase
 */

export type CaseStatus =
  | 'DRAFT'
  | 'ANAMNESIS_PENDING'
  | 'ANALYZING'
  | 'HYPOTHESES_GENERATED'
  | 'CONDUCT_SET'
  | 'CLOSED';

export type Species = 'CANINE' | 'FELINE' | 'EQUINE' | 'EXOTIC' | 'OTHER';

export type Gender =
  | 'MALE_INTACT'
  | 'MALE_NEUTERED'
  | 'FEMALE_INTACT'
  | 'FEMALE_SPAYED';

export type UrgencyLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface Patient {
  id: string;
  userId: string; // Internal UID owner
  ownerId?: string; // Explicit ownerId alias matching domain contract
  name: string;
  species: Species;
  breed: string;
  sex?: Gender;
  gender: Gender;
  birthDate?: string;
  ageYears: number;
  ageMonths: number;
  weightKg: number;
  tutorName: string;
  tutorContact: string;
  microchipId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClinicalCase {
  id: string;
  userId: string; // Internal UID owner
  ownerId?: string; // Explicit ownerId alias matching domain contract
  patientId: string;
  caseNumber: string;
  status: CaseStatus;
  title: string;
  chiefComplaint: string;
  selectedHypothesisId?: string;
  activeAnamnesisId?: string;
  latestAnalysisId?: string;
  currentVersion: number;
  version?: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PhysicalExam {
  temperatureC?: number;
  heartRateBpm?: number;
  respiratoryRateBpm?: number;
  mucousMembranes?: string;
  capillaryRefillTimeSec?: number;
  hydrationStatus?: string;
  bodyConditionScore?: number;
  notes?: string;
}

export interface AnamnesisStructuredData {
  chiefComplaint: string;
  symptoms: string[];
  onsetDate: string;
  progression: 'ACUTE' | 'SUBACUTE' | 'CHRONIC' | 'EPISODIC';
  dietHistory: string;
  vaccinationStatus: string;
  dewormingStatus: string;
  medications: string;
  historicalNotes: string;
}

export interface Anamnesis {
  id: string;
  caseId: string;
  userId: string;
  patientId: string;
  rawText: string; // Original raw transcript / text notes (NEVER altered automatically)
  structuredData: AnamnesisStructuredData;
  physicalExam: PhysicalExam;
  clinicalFindings: string[]; // Facts extracted from transcription
  missingInformation: string[]; // Clinical gaps identified by AI
  audioStoragePath?: string;
  audioDownloadUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptRecord {
  id: string;
  caseId: string;
  userId: string;
  audioStoragePath: string;
  rawText: string;
  status: 'RECORDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: string;
}

export interface Analysis {
  id: string;
  caseId: string;
  userId: string;
  anamnesisId: string;
  geminiModelVersion: string;
  clinicalSummary: string;
  urgencyLevel: UrgencyLevel;
  suggestedDiagnosticSteps: string[];
  rawPromptTokens: number;
  rawResponseTokens: number;
  createdAt: string;
}

export interface Hypothesis {
  id: string;
  analysisId: string;
  caseId: string;
  userId: string;
  diseaseName: string;
  icdVetCode?: string;
  probabilityScore: number;
  reasoning: string;
  supportingFindings: string[];
  contradictingFindings: string[];
  recommendedExams: string[];
  isSelected: boolean;
  createdAt: string;
}

export interface Evidence {
  id: string;
  hypothesisId: string;
  caseId: string;
  userId: string;
  literatureChunkId: string;
  paperTitle: string;
  authors: string[];
  publicationYear: number;
  journal: string;
  doi?: string;
  snippet: string;
  relevanceScore: number;
  createdAt: string;
}

export interface PrescriptionItem {
  medicationName: string;
  activeIngredient: string;
  dosageMgKg: number;
  totalDosage: string;
  route: 'ORAL' | 'SUBCUTANEOUS' | 'INTRAMUSCULAR' | 'INTRAVENOUS' | 'TOPICAL' | 'OTHER';
  frequency: string;
  durationDays: number;
  instructions: string;
}

export interface Prescription {
  id: string;
  caseId: string;
  userId: string;
  patientId: string;
  items: PrescriptionItem[];
  specialInstructions: string;
  digitalSignatureUrl?: string;
  createdAt: string;
}

export interface TimelineEvent {
  id: string;
  caseId: string;
  userId: string;
  eventType:
    | 'CASE_CREATED'
    | 'ANAMNESIS_ADDED'
    | 'ATTACHMENT_UPLOADED'
    | 'AI_ANALYSIS_COMPLETED'
    | 'HYPOTHESIS_SELECTED'
    | 'PRESCRIPTION_GENERATED'
    | 'DOCUMENT_EXPORTED';
  actorName: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: string;
}
