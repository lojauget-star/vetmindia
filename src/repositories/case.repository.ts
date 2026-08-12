import { db } from '@/services/firebase.config';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ClinicalCase } from '@/types/clinical.types';
import { timelineService } from '@/services/timeline.service';

export class CaseRepository {
  /**
   * Fetches recent clinical cases for a specific user from cases collection
   */
  async getRecentCases(userId: string, limitCount = 5): Promise<ClinicalCase[]> {
    try {
      const casesRef = collection(db, 'cases');
      const q = query(
        casesRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const cases: ClinicalCase[] = [];
      querySnapshot.forEach((docSnap) => {
        cases.push(docSnap.data() as ClinicalCase);
      });
      return cases;
    } catch (error) {
      console.error(`[CaseRepository] Error fetching recent cases for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all cases owned by a user
   */
  async getCasesByUser(userId: string): Promise<ClinicalCase[]> {
    try {
      const casesRef = collection(db, 'cases');
      const q = query(casesRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const cases: ClinicalCase[] = [];
      querySnapshot.forEach((docSnap) => {
        cases.push(docSnap.data() as ClinicalCase);
      });
      return cases;
    } catch (error) {
      console.error(`[CaseRepository] Error fetching cases for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all cases associated with a specific patient
   */
  async getCasesByPatient(patientId: string): Promise<ClinicalCase[]> {
    try {
      const casesRef = collection(db, 'cases');
      const q = query(casesRef, where('patientId', '==', patientId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const cases: ClinicalCase[] = [];
      querySnapshot.forEach((docSnap) => {
        cases.push(docSnap.data() as ClinicalCase);
      });
      return cases;
    } catch (error) {
      console.error(`[CaseRepository] Error fetching cases for patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single ClinicalCase by ID
   */
  async getCase(caseId: string): Promise<ClinicalCase | null> {
    try {
      const caseRef = doc(db, 'cases', caseId);
      const snap = await getDoc(caseRef);
      if (snap.exists()) {
        return snap.data() as ClinicalCase;
      }
      return null;
    } catch (error) {
      console.error(`[CaseRepository] Error fetching case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new ClinicalCase in cases/{caseId}
   */
  async createCase(clinicalCase: ClinicalCase): Promise<ClinicalCase> {
    try {
      const caseRef = doc(db, 'cases', clinicalCase.id);
      await setDoc(caseRef, clinicalCase);
      // Automatically log domain timeline event
      timelineService.logCaseCreated(clinicalCase.id, clinicalCase.userId, clinicalCase.caseNumber, clinicalCase.title).catch(() => {});
      return clinicalCase;
    } catch (error) {
      console.error(`[CaseRepository] Error creating case ${clinicalCase.id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing ClinicalCase, automatically incrementing version and timestamp
   */
  async updateCase(caseId: string, data: Partial<ClinicalCase>): Promise<ClinicalCase> {
    try {
      const caseRef = doc(db, 'cases', caseId);
      const snap = await getDoc(caseRef);
      if (!snap.exists()) {
        throw new Error(`Caso clínico ${caseId} não encontrado.`);
      }

      const current = snap.data() as ClinicalCase;
      const newVersion = (current.currentVersion || 1) + 1;

      const updatePayload = {
        ...data,
        currentVersion: newVersion,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(caseRef, updatePayload);
      const updatedSnap = await getDoc(caseRef);
      return updatedSnap.data() as ClinicalCase;
    } catch (error) {
      console.error(`[CaseRepository] Error updating case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Selects a clinical hypothesis for a case after strict validation.
   * Validates: user owns case, case exists, hypothesis belongs to case.
   * Persists selectedHypothesisId in cases/{caseId} and updates hypotheses/{hypothesisId}.
   */
  async selectHypothesis(caseId: string, hypothesisId: string, userId: string): Promise<ClinicalCase> {
    try {
      // 1. Validate Case Ownership
      const c = await this.getCase(caseId);
      if (!c || (c.userId !== userId && c.ownerId !== userId)) {
        throw new Error('Permissão negada para alterar este caso clínico.');
      }

      // 2. Validate Hypothesis belongs to Case
      const hypRef = doc(db, 'hypotheses', hypothesisId);
      const hypSnap = await getDoc(hypRef);
      if (hypSnap.exists()) {
        const hypData = hypSnap.data();
        if (hypData.caseId !== caseId) {
          throw new Error('Hipótese não pertence a este caso clínico.');
        }
      }

      // 3. Update all hypotheses for this case setting isSelected
      const qHyp = query(collection(db, 'hypotheses'), where('caseId', '==', caseId));
      const snapHyp = await getDocs(qHyp);
      for (const d of snapHyp.docs) {
        const isSel = d.id === hypothesisId;
        await updateDoc(doc(db, 'hypotheses', d.id), { isSelected: isSel });
      }

      // 4. Update ClinicalCase with selectedHypothesisId & status CONDUCT_SET
      const updatedCase = await this.updateCase(caseId, {
        selectedHypothesisId: hypothesisId,
        status: 'CONDUCT_SET',
      });

      // Automatically log domain timeline event
      timelineService.logHypothesisSelected(caseId, userId, hypothesisId).catch(() => {});
      return updatedCase;
    } catch (error) {
      console.error(`[CaseRepository] Error selecting hypothesis ${hypothesisId} for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a ClinicalCase record if owned by userId
   */
  async deleteCase(caseId: string, userId: string): Promise<void> {
    try {
      const c = await this.getCase(caseId);
      if (!c || (c.userId !== userId && c.ownerId !== userId)) {
        throw new Error('Permissão negada para excluir este caso clínico.');
      }
      const caseRef = doc(db, 'cases', caseId);
      await deleteDoc(caseRef);
    } catch (error) {
      console.error(`[CaseRepository] Error deleting case ${caseId}:`, error);
      throw error;
    }
  }
}

export const caseRepository = new CaseRepository();
