import { db } from '@/services/firebase.config';
import { collection, query, where, orderBy, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Prescription } from '@/types/prescription.types';

export class PrescriptionRepository {
  /**
   * Creates a new prescription in prescriptions/{id}
   */
  async createPrescription(prescription: Prescription): Promise<Prescription> {
    try {
      const pRef = doc(db, 'prescriptions', prescription.id);
      await setDoc(pRef, prescription);
      return prescription;
    } catch (error) {
      console.error(`[PrescriptionRepository] Error creating prescription ${prescription.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single prescription by ID
   */
  async getPrescription(prescriptionId: string): Promise<Prescription | null> {
    try {
      const pRef = doc(db, 'prescriptions', prescriptionId);
      const snap = await getDoc(pRef);
      if (snap.exists()) {
        return snap.data() as Prescription;
      }
      return null;
    } catch (error) {
      console.error(`[PrescriptionRepository] Error fetching prescription ${prescriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all prescriptions for a specific case
   */
  async getPrescriptionsByCase(caseId: string): Promise<Prescription[]> {
    try {
      const pRef = collection(db, 'prescriptions');
      const q = query(pRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: Prescription[] = [];
      querySnapshot.forEach((d) => items.push(d.data() as Prescription));
      return items;
    } catch (error) {
      console.error(`[PrescriptionRepository] Error fetching prescriptions for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches prescription for a specific case and selected hypothesis
   */
  async getPrescriptionByCaseAndHypothesis(caseId: string, hypothesisId: string): Promise<Prescription | null> {
    try {
      const pRef = collection(db, 'prescriptions');
      const q = query(
        pRef,
        where('caseId', '==', caseId),
        where('hypothesisId', '==', hypothesisId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0].data() as Prescription;
      }
      return null;
    } catch (error) {
      console.error(`[PrescriptionRepository] Error fetching prescription for case ${caseId} & hypothesis ${hypothesisId}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing prescription, automatically incrementing version and timestamp
   */
  async updatePrescription(prescriptionId: string, data: Partial<Prescription>): Promise<Prescription> {
    try {
      const pRef = doc(db, 'prescriptions', prescriptionId);
      const snap = await getDoc(pRef);
      if (!snap.exists()) {
        throw new Error(`Prescrição ${prescriptionId} não encontrada.`);
      }

      const current = snap.data() as Prescription;
      const newVersion = (current.version || 1) + 1;

      const updatePayload = {
        ...data,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(pRef, updatePayload);
      const updatedSnap = await getDoc(pRef);
      return updatedSnap.data() as Prescription;
    } catch (error) {
      console.error(`[PrescriptionRepository] Error updating prescription ${prescriptionId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a prescription record after ownership check
   */
  async deletePrescription(prescriptionId: string, userId: string): Promise<void> {
    try {
      const p = await this.getPrescription(prescriptionId);
      if (!p || p.userId !== userId) {
        throw new Error('Permissão negada para excluir esta prescrição.');
      }
      const pRef = doc(db, 'prescriptions', prescriptionId);
      await deleteDoc(pRef);
    } catch (error) {
      console.error(`[PrescriptionRepository] Error deleting prescription ${prescriptionId}:`, error);
      throw error;
    }
  }
}

export const prescriptionRepository = new PrescriptionRepository();
