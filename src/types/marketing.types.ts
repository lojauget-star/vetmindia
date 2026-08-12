/**
 * VETMIND MARKETING STUDIO DOMAIN TYPES
 */

export type MarketingFormat =
  | 'INSTAGRAM_POST'
  | 'INSTAGRAM_STORIES'
  | 'LINKEDIN_ARTICLE'
  | 'PATIENT_CASE_STUDY';

export type ToneOfVoice =
  | 'EDITORIAL'
  | 'PREMIUM'
  | 'MINIMALIST'
  | 'CLINICAL'
  | 'HUMAN';

export interface BrandKit {
  id: string;
  userId: string;
  name: string;
  logoUrl?: string;
  primaryColor: string; // #4F46E5
  secondaryColor: string; // #0F8A5F
  accentColor: string; // #6366F1
  fontFamily: string; // Inter
  toneOfVoice: ToneOfVoice;
  visualStyle: string;
  photographyStyle: string;
  backgroundColor: string; // #F7F7F5
  updatedAt: string;
}

export interface AnonymizedCaseContent {
  originalCaseId: string;
  sanitizedTitle: string;
  sanitizedSpecies: string;
  sanitizedBreed: string;
  sanitizedAge: string;
  sanitizedChiefComplaint: string;
  sanitizedClinicalSummary: string;
  removedFields: string[];
}

export interface MarketingCopy {
  headline: string;
  subheadline: string;
  caption: string;
  cta: string;
  hashtags: string[];
  altText: string;
  format: MarketingFormat;
}

export interface MarketingProject {
  id: string;
  userId: string;
  caseId: string;
  title: string;
  brandKit: BrandKit;
  anonymizedContent: AnonymizedCaseContent;
  copy: MarketingCopy;
  imageUrl?: string;
  imageStoragePath?: string;
  format: MarketingFormat;
  status: 'DRAFT' | 'GENERATED' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
}
