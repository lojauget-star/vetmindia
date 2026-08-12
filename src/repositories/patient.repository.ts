import { db } from '@/services/firebase.config';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Patient } from '@/types/clinical.types';

export class PatientRepository {
  /**
   * Fetches recent patients for a specific user from patients collection
   */
  async getRecentPatients(userId: string, limitCount = 5): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(
        patientsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const patients: Patient[] = [];
      querySnapshot.forEach((docSnap) => {
        patients.push(docSnap.data() as Patient);
      });
      return patients;
    } catch (error) {
      console.error(`[PatientRepository] Error fetching recent patients for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all patients owned by a user
   */
  async getPatientsByUser(userId: string): Promise<Patient[]> {
    try {
      const patientsRef = collection(db, 'patients');
      const q = query(patientsRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const patients: Patient[] = [];
      querySnapshot.forEach((docSnap) => {
        patients.push(docSnap.data() as Patient);
      });
      return patients;
    } catch (error) {
      console.error(`[PatientRepository] Error fetching patients for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single Patient by ID
   */
  async getPatient(patientId: string): Promise<Patient | null> {
    try {
      const patientRef = doc(db, 'patients', patientId);
      const snap = await getDoc(patientRef);
      if (snap.exists()) {
        return snap.data() as Patient;
      }
      return null;
    } catch (error) {
      console.error(`[PatientRepository] Error fetching patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Creates a new Patient record in patients/{patientId}
   */
  async createPatient(patient: Patient): Promise<Patient> {
    try {
      const patientRef = doc(db, 'patients', patient.id);
      await setDoc(patientRef, patient);
      return patient;
    } catch (error) {
      console.error(`[PatientRepository] Error creating patient ${patient.id}:`, error);
      throw error;
    }
  }

  /**
   * Updates an existing Patient record
   */
  async updatePatient(patientId: string, data: Partial<Patient>): Promise<Patient> {
    try {
      const patientRef = doc(db, 'patients', patientId);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(patientRef, updateData);
      const updatedSnap = await getDoc(patientRef);
      return updatedSnap.data() as Patient;
    } catch (error) {
      console.error(`[PatientRepository] Error updating patient ${patientId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes a Patient record if owned by userId
   */
  async deletePatient(patientId: string, userId: string): Promise<void> {
    try {
      const patient = await this.getPatient(patientId);
      if (!patient || (patient.userId !== userId && patient.ownerId !== userId)) {
        throw new Error('Permissão negada para excluir este paciente.');
      }
      const patientRef = doc(db, 'patients', patientId);
      await deleteDoc(patientRef);
    } catch (error) {
      console.error(`[PatientRepository] Error deleting patient ${patientId}:`, error);
      throw error;
    }
  }
}

export const patientRepository = new PatientRepository();
