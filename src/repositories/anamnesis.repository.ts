import { db } from '@/services/firebase.config';
import { collection, query, where, getDocs, getDoc, doc, setDoc, updateDoc } from 'firebase/firestore';
import { Anamnesis, TranscriptRecord } from '@/types/clinical.types';

export class AnamnesisRepository {
  /**
   * Fetches Anamnesis record for a specific caseId
   */
  async getAnamnesisByCase(caseId: string): Promise<Anamnesis | null> {
    try {
      const ref = collection(db, 'anamneses');
      const q = query(ref, where('caseId', '==', caseId));
      const snap = await getDocs(q);

      if (!snap.empty) {
        return snap.docs[0].data() as Anamnesis;
      }
      return null;
    } catch (error) {
      console.error(`[AnamnesisRepository] Error fetching anamnesis for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches Anamnesis record by ID
   */
  async getAnamnesis(anamnesisId: string): Promise<Anamnesis | null> {
    try {
      const ref = doc(db, 'anamneses', anamnesisId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as Anamnesis;
      }
      return null;
    } catch (error) {
      console.error(`[AnamnesisRepository] Error fetching anamnesis ${anamnesisId}:`, error);
      throw error;
    }
  }

  /**
   * Saves or overwrites Anamnesis document
   */
  async saveAnamnesis(anamnesis: Anamnesis): Promise<Anamnesis> {
    try {
      const ref = doc(db, 'anamneses', anamnesis.id);
      await setDoc(ref, anamnesis, { merge: true });
      return anamnesis;
    } catch (error) {
      console.error(`[AnamnesisRepository] Error saving anamnesis ${anamnesis.id}:`, error);
      throw error;
    }
  }

  /**
   * Updates partial fields in Anamnesis document (Guarantees rawText is never altered unless explicitly passed)
   */
  async updateAnamnesis(anamnesisId: string, data: Partial<Anamnesis>): Promise<Anamnesis> {
    try {
      const ref = doc(db, 'anamneses', anamnesisId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        throw new Error(`Anamnese ${anamnesisId} não encontrada.`);
      }

      const current = snap.data() as Anamnesis;

      // Rule: NEVER alter rawText automatically unless explicitly updated by user in transcript editor
      const rawTextToKeep = data.rawText !== undefined ? data.rawText : current.rawText;

      const updatePayload = {
        ...data,
        rawText: rawTextToKeep,
        updatedAt: new Date().toISOString(),
      };

      await updateDoc(ref, updatePayload);
      const updatedSnap = await getDoc(ref);
      return updatedSnap.data() as Anamnesis;
    } catch (error) {
      console.error(`[AnamnesisRepository] Error updating anamnesis ${anamnesisId}:`, error);
      throw error;
    }
  }

  /**
   * Saves Transcript record to transcripts/{transcriptId}
   */
  async saveTranscript(transcript: TranscriptRecord): Promise<TranscriptRecord> {
    try {
      const ref = doc(db, 'transcripts', transcript.id);
      await setDoc(ref, transcript, { merge: true });
      return transcript;
    } catch (error) {
      console.error(`[AnamnesisRepository] Error saving transcript ${transcript.id}:`, error);
      throw error;
    }
  }
}

export const anamnesisRepository = new AnamnesisRepository();
