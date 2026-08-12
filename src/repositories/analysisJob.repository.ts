import { db } from '@/services/firebase.config';
import { collection, doc, setDoc, updateDoc, getDoc, query, where, orderBy, limit, getDocs, onSnapshot } from 'firebase/firestore';
import { AnalysisJob } from '@/types/job.types';

export class AnalysisJobRepository {
  private collectionRef = collection(db, 'analysisJobs');

  /**
   * Creates a new AnalysisJob in Firestore
   */
  async createJob(job: AnalysisJob): Promise<AnalysisJob> {
    try {
      const ref = doc(db, 'analysisJobs', job.jobId);
      await setDoc(ref, job, { merge: true });
      return job;
    } catch (error) {
      console.error(`[AnalysisJobRepository] Error creating job ${job.jobId}:`, error);
      throw error;
    }
  }

  /**
   * Updates progress, stage, status, or completion of an AnalysisJob in Firestore
   */
  async updateJob(jobId: string, updates: Partial<AnalysisJob>): Promise<AnalysisJob> {
    try {
      const ref = doc(db, 'analysisJobs', jobId);
      await updateDoc(ref, updates);
      const snap = await getDoc(ref);
      return snap.data() as AnalysisJob;
    } catch (error) {
      console.error(`[AnalysisJobRepository] Error updating job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches an AnalysisJob by jobId
   */
  async getJob(jobId: string): Promise<AnalysisJob | null> {
    try {
      const ref = doc(db, 'analysisJobs', jobId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as AnalysisJob;
      }
      return null;
    } catch (error) {
      console.error(`[AnalysisJobRepository] Error fetching job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches the latest active or completed job for a caseId (enables state recovery on page reload)
   */
  async getActiveJobForCase(caseId: string): Promise<AnalysisJob | null> {
    try {
      const q = query(
        this.collectionRef,
        where('caseId', '==', caseId),
        orderBy('startedAt', 'desc'),
        limit(1)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        return snap.docs[0].data() as AnalysisJob;
      }
      return null;
    } catch (error) {
      console.error(`[AnalysisJobRepository] Error fetching active job for case ${caseId}:`, error);
      return null;
    }
  }

  /**
   * Real-time subscription listener to job updates in Firestore
   */
  subscribeToJob(jobId: string, callback: (job: AnalysisJob | null) => void): () => void {
    const ref = doc(db, 'analysisJobs', jobId);
    return onSnapshot(
      ref,
      (snap) => {
        if (snap.exists()) {
          callback(snap.data() as AnalysisJob);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error(`[AnalysisJobRepository] Snapshot error for job ${jobId}:`, error);
      }
    );
  }
}

export const analysisJobRepository = new AnalysisJobRepository();
