import { db } from '@/services/firebase.config';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc } from 'firebase/firestore';
import { BrandKit, MarketingProject } from '@/types/marketing.types';

export class MarketingRepository {
  private projectsRef = collection(db, 'marketingProjects');
  private brandKitsRef = collection(db, 'brandKits');

  /**
   * Saves or updates BrandKit configuration for a veterinarian
   */
  async saveBrandKit(brandKit: BrandKit): Promise<BrandKit> {
    try {
      const ref = doc(db, 'brandKits', brandKit.userId);
      await setDoc(ref, brandKit, { merge: true });
      return brandKit;
    } catch (error) {
      console.error('[MarketingRepository] Error saving BrandKit:', error);
      throw error;
    }
  }

  /**
   * Fetches BrandKit configuration for a user (or returns default Vetmind BrandKit)
   */
  async getBrandKit(userId: string): Promise<BrandKit> {
    try {
      const ref = doc(db, 'brandKits', userId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        return snap.data() as BrandKit;
      }

      // Default Vetmind BrandKit
      return {
        id: `brand_${userId}`,
        userId,
        name: 'Clínica Veterinária Vetmind',
        primaryColor: '#4F46E5', // Clinical Blue
        secondaryColor: '#0F8A5F', // Trusted Green
        accentColor: '#6366F1',
        fontFamily: 'Inter',
        toneOfVoice: 'EDITORIAL',
        visualStyle: 'Minimalista & Editorial',
        photographyStyle: 'Fotografia Clínica e Humana',
        backgroundColor: '#F7F7F5',
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('[MarketingRepository] Error fetching BrandKit:', error);
      throw error;
    }
  }

  /**
   * Saves or updates a MarketingProject in Firestore
   */
  async saveProject(project: MarketingProject): Promise<MarketingProject> {
    try {
      const ref = doc(db, 'marketingProjects', project.id);
      await setDoc(ref, project, { merge: true });
      return project;
    } catch (error) {
      console.error('[MarketingRepository] Error saving MarketingProject:', error);
      throw error;
    }
  }

  /**
   * Fetches a MarketingProject by ID with ownership security check
   */
  async getProject(projectId: string, userId: string): Promise<MarketingProject | null> {
    try {
      const ref = doc(db, 'marketingProjects', projectId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data() as MarketingProject;
        if (data.userId !== userId) throw new Error('Permissão negada.');
        return data;
      }
      return null;
    } catch (error) {
      console.error('[MarketingRepository] Error fetching MarketingProject:', error);
      throw error;
    }
  }

  /**
   * Lists all MarketingProjects owned by a user
   */
  async listUserProjects(userId: string): Promise<MarketingProject[]> {
    try {
      const q = query(this.projectsRef, where('userId', '==', userId), orderBy('updatedAt', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as MarketingProject);
    } catch (error) {
      console.error('[MarketingRepository] Error listing MarketingProjects:', error);
      return [];
    }
  }

  /**
   * Deletes a MarketingProject
   */
  async deleteProject(projectId: string, userId: string): Promise<void> {
    try {
      const project = await this.getProject(projectId, userId);
      if (!project) return;
      const ref = doc(db, 'marketingProjects', projectId);
      await deleteDoc(ref);
    } catch (error) {
      console.error('[MarketingRepository] Error deleting MarketingProject:', error);
      throw error;
    }
  }
}

export const marketingRepository = new MarketingRepository();
