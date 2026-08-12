import { db } from '@/services/firebase.config';
import { collection, query, where, getDocs, doc, setDoc, limit, orderBy } from 'firebase/firestore';
import { StructuredAnalysisResult, GroundedHypothesis, EvidenceItem } from '@/types/rag.types';
import { Analysis } from '@/types/clinical.types';

export class AnalysisRepository {
  /**
   * Saves complete RAG analysis result to analyses/{analysisId}, hypotheses, and evidence collections
   */
  async saveAnalysisResult(result: StructuredAnalysisResult): Promise<void> {
    try {
      // 1. Save root Analysis document
      const analysisDoc: Analysis = {
        id: result.analysisId,
        caseId: result.caseId,
        userId: result.userId,
        anamnesisId: result.analysisId,
        geminiModelVersion: 'gemini-1.5-pro',
        clinicalSummary: result.clinicalSummary,
        urgencyLevel: result.urgencyLevel,
        suggestedDiagnosticSteps: result.suggestedExams.map((e) => e.examName),
        rawPromptTokens: result.rawPromptTokens,
        rawResponseTokens: result.rawResponseTokens,
        createdAt: result.createdAt,
      };

      await setDoc(doc(db, 'analyses', result.analysisId), analysisDoc, { merge: true });

      // 2. Save individual Hypotheses documents
      for (const h of result.hypotheses) {
        await setDoc(doc(db, 'hypotheses', h.id), h, { merge: true });
      }

      // 3. Save individual Evidence documents
      for (const e of result.evidence) {
        await setDoc(doc(db, 'evidence', e.id), e, { merge: true });
      }
    } catch (error) {
      console.error(`[AnalysisRepository] Error saving analysis result ${result.analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches latest analysis result for a caseId
   */
  async getAnalysisByCase(caseId: string): Promise<Analysis | null> {
    try {
      const q = query(collection(db, 'analyses'), where('caseId', '==', caseId));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as Analysis;
      }
      return null;
    } catch (error) {
      console.error(`[AnalysisRepository] Error fetching analysis for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches recent analyses for a user (Dashboard)
   */
  async getRecentAnalyses(userId: string, limitCount = 5): Promise<Analysis[]> {
    try {
      const q = query(
        collection(db, 'analyses'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      const items: Analysis[] = [];
      snap.forEach((d) => items.push(d.data() as Analysis));
      return items;
    } catch (error) {
      console.error(`[AnalysisRepository] Error fetching recent analyses for user ${userId}:`, error);
      return [];
    }
  }

  /**
   * Fetches hypotheses for an analysisId
   */
  async getHypothesesByAnalysis(analysisId: string): Promise<GroundedHypothesis[]> {
    try {
      const q = query(collection(db, 'hypotheses'), where('analysisId', '==', analysisId));
      const snap = await getDocs(q);
      const items: GroundedHypothesis[] = [];
      snap.forEach((d) => items.push(d.data() as GroundedHypothesis));
      return items;
    } catch (error) {
      console.error(`[AnalysisRepository] Error fetching hypotheses for analysis ${analysisId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches evidence items for a caseId
   */
  async getEvidenceByCase(caseId: string): Promise<EvidenceItem[]> {
    try {
      const q = query(collection(db, 'evidence'), where('caseId', '==', caseId));
      const snap = await getDocs(q);
      const items: EvidenceItem[] = [];
      snap.forEach((d) => items.push(d.data() as EvidenceItem));
      return items;
    } catch (error) {
      console.error(`[AnalysisRepository] Error fetching evidence for case ${caseId}:`, error);
      throw error;
    }
  }
}

export const analysisRepository = new AnalysisRepository();
