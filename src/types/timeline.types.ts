export type TimelineEventType =
  | 'CASE_CREATED'
  | 'ANAMNESIS_UPDATED'
  | 'AUDIO_RECORDED'
  | 'TRANSCRIPT_CREATED'
  | 'ANALYSIS_STARTED'
  | 'ANALYSIS_COMPLETED'
  | 'HYPOTHESIS_SELECTED'
  | 'PRESCRIPTION_CREATED'
  | 'DOCUMENT_GENERATED';

export interface TimelineEvent {
  id: string;
  caseId: string;
  patientId?: string;
  userId: string;
  type: TimelineEventType;
  title: string;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string;
}
