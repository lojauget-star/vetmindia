import { db } from '@/services/firebase.config';
import { collection, query, where, orderBy, limit, getDocs, getDoc, doc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ClinicalDocument } from '@/types/document.types';

export type DocumentRecord = ClinicalDocument;

export class DocumentRepository {
  /**
   * Saves a new clinical document metadata in documents/{id}
   */
  async createDocument(document: ClinicalDocument): Promise<ClinicalDocument> {
    try {
      const docRef = doc(db, 'documents', document.id);
      await setDoc(docRef, document);
      return document;
    } catch (error) {
      console.error(`[DocumentRepository] Error creating document ${document.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches a single document by ID
   */
  async getDocument(documentId: string): Promise<ClinicalDocument | null> {
    try {
      const docRef = doc(db, 'documents', documentId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data() as ClinicalDocument;
      }
      return null;
    } catch (error) {
      console.error(`[DocumentRepository] Error fetching document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all documents associated with a specific case
   */
  async getDocumentsByCase(caseId: string): Promise<ClinicalDocument[]> {
    try {
      const docRef = collection(db, 'documents');
      const q = query(docRef, where('caseId', '==', caseId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs: ClinicalDocument[] = [];
      querySnapshot.forEach((d) => docs.push(d.data() as ClinicalDocument));
      return docs;
    } catch (error) {
      console.error(`[DocumentRepository] Error fetching documents for case ${caseId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches recent documents created by a specific user (used by Dashboard)
   */
  async getRecentDocuments(userId: string, limitCount = 5): Promise<ClinicalDocument[]> {
    try {
      const docRef = collection(db, 'documents');
      const q = query(docRef, where('userId', '==', userId), orderBy('createdAt', 'desc'), limit(limitCount));
      const querySnapshot = await getDocs(q);
      const docs: ClinicalDocument[] = [];
      querySnapshot.forEach((d) => docs.push(d.data() as ClinicalDocument));
      return docs;
    } catch (error) {
      console.error(`[DocumentRepository] Error fetching recent documents for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all documents created by a specific user
   */
  async getDocumentsByUser(userId: string): Promise<ClinicalDocument[]> {
    try {
      const docRef = collection(db, 'documents');
      const q = query(docRef, where('userId', '==', userId), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs: ClinicalDocument[] = [];
      querySnapshot.forEach((d) => docs.push(d.data() as ClinicalDocument));
      return docs;
    } catch (error) {
      console.error(`[DocumentRepository] Error fetching documents for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Updates document metadata
   */
  async updateDocument(documentId: string, data: Partial<ClinicalDocument>): Promise<ClinicalDocument> {
    try {
      const docRef = doc(db, 'documents', documentId);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        throw new Error(`Documento ${documentId} não encontrado.`);
      }
      const current = snap.data() as ClinicalDocument;
      const updatePayload = {
        ...data,
        version: (current.version || 1) + 1,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, updatePayload);
      const updatedSnap = await getDoc(docRef);
      return updatedSnap.data() as ClinicalDocument;
    } catch (error) {
      console.error(`[DocumentRepository] Error updating document ${documentId}:`, error);
      throw error;
    }
  }

  /**
   * Deletes document metadata after ownership check
   */
  async deleteDocument(documentId: string, userId: string): Promise<void> {
    try {
      const d = await this.getDocument(documentId);
      if (!d || d.userId !== userId) {
        throw new Error('Permissão negada para excluir este documento.');
      }
      const docRef = doc(db, 'documents', documentId);
      await deleteDoc(docRef);
    } catch (error) {
      console.error(`[DocumentRepository] Error deleting document ${documentId}:`, error);
      throw error;
    }
  }
}

export const documentRepository = new DocumentRepository();
