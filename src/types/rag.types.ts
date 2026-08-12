/**
 * VETMIND RAG & ANALYSIS STRUCTURED SCHEMAS
 */

import { UrgencyLevel } from './clinical.types';

export interface Citation {
  chunkId: string;
  sourceType: 'GLOBAL_LITERATURE' | 'PRIVATE_PDF' | 'GUIDELINE';
  title: string;
  authors: string[];
  publicationYear?: number;
  journal?: string;
  doi?: string;
  ownerId?: string; // Present for private PDFs
  snippet: string;
}

export interface EvidenceItem {
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

export interface SuggestedExam {
  examName: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  rationale: string;
}

export interface SuggestedNextStep {
  step: string;
  timeframe: string;
}

export interface SuggestedConduct {
  action: string;
  category: 'DIAGNOSTIC' | 'THERAPEUTIC' | 'MONITORING' | 'REFERRAL';
  description: string;
}

export interface GroundedHypothesis {
  id: string;
  analysisId: string;
  caseId: string;
  userId: string;
  diseaseName: string;
  icdVetCode?: string;
  probabilityScore: number; // 0.0 to 1.0
  reasoning: string;
  supportingFindings: string[];
  contradictingFindings: string[];
  recommendedExams: string[];
  citations: Citation[];
  isSelected: boolean;
  createdAt: string;
}

export interface StructuredAnalysisResult {
  analysisId: string;
  caseId: string;
  userId: string;
  urgencyLevel: UrgencyLevel;
  clinicalSummary: string;
  clinicalFindings: string[];
  missingInformation: string[];
  hypotheses: GroundedHypothesis[];
  evidence: EvidenceItem[];
  suggestedExams: SuggestedExam[];
  suggestedNextSteps: SuggestedNextStep[];
  suggestedConducts: SuggestedConduct[];
  rawPromptTokens: number;
  rawResponseTokens: number;
  createdAt: string;
}

export interface LiteratureChunk {
  id: string;
  literatureId: string;
  chunkIndex: number;
  text: string;
  embedding: number[];
  keywords: string[];
  sourceType: 'GLOBAL_LITERATURE' | 'PRIVATE_PDF' | 'GUIDELINE';
  ownerId?: string; // For private PDFs
  title: string;
  authors: string[];
  publicationYear?: number;
  journal?: string;
  doi?: string;
}
