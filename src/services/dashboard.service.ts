import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { analysisRepository } from '@/repositories/analysis.repository';
import { documentRepository, DocumentRecord } from '@/repositories/document.repository';
import { ClinicalCase, Patient, Analysis } from '@/types/clinical.types';

export interface DashboardData {
  cases: ClinicalCase[];
  patients: Patient[];
  analyses: Analysis[];
  documents: DocumentRecord[];
}

export class DashboardService {
  async getRecentCases(userId: string, limitCount = 5): Promise<ClinicalCase[]> {
    return caseRepository.getRecentCases(userId, limitCount);
  }

  async getRecentPatients(userId: string, limitCount = 5): Promise<Patient[]> {
    return patientRepository.getRecentPatients(userId, limitCount);
  }

  async getRecentAnalyses(userId: string, limitCount = 5): Promise<Analysis[]> {
    return analysisRepository.getRecentAnalyses(userId, limitCount);
  }

  async getRecentDocuments(userId: string, limitCount = 5): Promise<DocumentRecord[]> {
    return documentRepository.getRecentDocuments(userId, limitCount);
  }

  /**
   * Consolidated query fetching all recent clinical records for the Dashboard
   */
  async getDashboardData(userId: string): Promise<DashboardData> {
    const [cases, patients, analyses, documents] = await Promise.all([
      this.getRecentCases(userId),
      this.getRecentPatients(userId),
      this.getRecentAnalyses(userId),
      this.getRecentDocuments(userId),
    ]);

    return {
      cases,
      patients,
      analyses,
      documents,
    };
  }
}

export const dashboardService = new DashboardService();
