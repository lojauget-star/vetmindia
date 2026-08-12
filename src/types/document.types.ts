export type DocumentType =
  | 'PRESCRIPTION'
  | 'EXAM_REQUEST'
  | 'TUTOR_INSTRUCTIONS'
  | 'CLINICAL_SUMMARY'
  | 'CLINICAL_REPORT'
  | 'FOLLOWUP_PLAN';

export interface DocumentMetadata {
  vetName: string;
  crmv: string;
  clinicName: string;
  phone?: string;
  address?: string;
  logoUrl?: string;
  patientName: string;
  species: string;
  tutorName: string;
  generatedAt: string;
}

export interface ClinicalDocument {
  id: string;
  caseId: string;
  patientId: string;
  userId: string;
  type: DocumentType;
  title: string;
  version: number;
  pdfUrl: string;
  downloadUrl?: string;
  contentHtml: string;
  metadata: DocumentMetadata;
  createdAt: string;
  updatedAt: string;
}
