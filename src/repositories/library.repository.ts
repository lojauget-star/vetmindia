import { db } from '@/services/firebase.config';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { LibraryItem, LibraryCategory } from '@/types/library.types';

export class LibraryRepository {
  /**
   * Creates a new library item in libraryItems/{id}
   */
  async createItem(item: LibraryItem): Promise<LibraryItem> {
    try {
      const itemRef = doc(db, 'libraryItems', item.id);
      await setDoc(itemRef, item);
      return item;
    } catch (error) {
      console.error(`[LibraryRepository] Error creating item ${item.id}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all library items accessible to user (Global items + User items)
   */
  async getLibraryContent(userId: string): Promise<LibraryItem[]> {
    try {
      const libRef = collection(db, 'libraryItems');
      const querySnapshot = await getDocs(libRef);
      const items: LibraryItem[] = [];

      querySnapshot.forEach((d) => {
        const item = d.data() as LibraryItem;
        if (item.isGlobal || item.userId === userId) {
          items.push(item);
        }
      });

      return items;
    } catch (error) {
      console.error(`[LibraryRepository] Error fetching library content for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches library items by category
   */
  async getItemsByCategory(category: LibraryCategory, userId: string): Promise<LibraryItem[]> {
    try {
      const all = await this.getLibraryContent(userId);
      if (category === 'FAVORITES') {
        return all.filter((i) => i.isFavorite);
      }
      return all.filter((i) => i.category === category);
    } catch (error) {
      console.error(`[LibraryRepository] Error fetching category ${category}:`, error);
      throw error;
    }
  }

  /**
   * Toggles favorite status on a library item
   */
  async toggleFavorite(itemId: string, userId: string, isFavorite: boolean): Promise<LibraryItem> {
    try {
      const itemRef = doc(db, 'libraryItems', itemId);
      const snap = await getDoc(itemRef);
      if (!snap.exists()) {
        throw new Error('Item da biblioteca não encontrado.');
      }
      const item = snap.data() as LibraryItem;
      if (!item.isGlobal && item.userId !== userId) {
        throw new Error('Permissão negada para alterar este item.');
      }

      await updateDoc(itemRef, { isFavorite });
      return { ...item, isFavorite };
    } catch (error) {
      console.error(`[LibraryRepository] Error toggling favorite for ${itemId}:`, error);
      throw error;
    }
  }
}

export const libraryRepository = new LibraryRepository();
