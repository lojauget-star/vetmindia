import { db } from '@/services/firebase.config';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { LiteratureChunk } from '@/types/rag.types';

export class LiteratureRepository {
  private chunksCollection = collection(db, 'literatureChunks');

  /**
   * Saves a literature chunk to Firestore literatureChunks/{chunkId}
   */
  async saveChunk(chunk: LiteratureChunk): Promise<LiteratureChunk> {
    try {
      const ref = doc(db, 'literatureChunks', chunk.id);
      await setDoc(ref, chunk, { merge: true });
      return chunk;
    } catch (error) {
      console.error(`[LiteratureRepository] Error saving chunk ${chunk.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches candidate chunks accessible to a given user.
   * Multi-Tenant Isolation Rule:
   * Returns global literature OR private PDFs where ownerId == userId.
   */
  async getAccessibleChunks(userId: string): Promise<LiteratureChunk[]> {
    try {
      // Query global literature
      const qGlobal = query(this.chunksCollection, where('sourceType', '==', 'GLOBAL_LITERATURE'));
      const snapGlobal = await getDocs(qGlobal);

      // Query private PDFs owned by this user
      const qPrivate = query(
        this.chunksCollection,
        where('sourceType', '==', 'PRIVATE_PDF'),
        where('ownerId', '==', userId)
      );
      const snapPrivate = await getDocs(qPrivate);

      const chunks: LiteratureChunk[] = [];
      snapGlobal.forEach((d) => chunks.push(d.data() as LiteratureChunk));
      snapPrivate.forEach((d) => chunks.push(d.data() as LiteratureChunk));

      return chunks;
    } catch (error) {
      console.error(`[LiteratureRepository] Error fetching chunks for user ${userId}:`, error);
      throw error;
    }
  }
}

export const literatureRepository = new LiteratureRepository();
