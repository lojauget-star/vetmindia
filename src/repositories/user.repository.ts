import { db } from '@/services/firebase.config';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { UserAccount, UserProfile } from '@/types/auth.types';

export class UserRepository {
  /**
   * Retrieves user account document from users/{uid}
   */
  async getUserAccount(uid: string): Promise<UserAccount | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        return snap.data() as UserAccount;
      }
      return null;
    } catch (error) {
      console.error(`[UserRepository] Error fetching user ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Creates or initializes user account document at users/{uid}
   */
  async createUserAccount(user: UserAccount): Promise<UserAccount> {
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, user, { merge: true });
      return user;
    } catch (error) {
      console.error(`[UserRepository] Error creating user ${user.uid}:`, error);
      throw error;
    }
  }

  /**
   * Retrieves veterinarian profile document from profiles/{uid}
   */
  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const profileRef = doc(db, 'profiles', uid);
      const snap = await getDoc(profileRef);
      if (snap.exists()) {
        return snap.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error(`[UserRepository] Error fetching profile ${uid}:`, error);
      throw error;
    }
  }

  /**
   * Saves or updates veterinarian profile document at profiles/{uid}
   */
  async saveProfile(profile: UserProfile): Promise<UserProfile> {
    try {
      const profileRef = doc(db, 'profiles', profile.userId);
      await setDoc(profileRef, profile, { merge: true });
      return profile;
    } catch (error) {
      console.error(`[UserRepository] Error saving profile ${profile.userId}:`, error);
      throw error;
    }
  }

  /**
   * Partial update of veterinarian profile document at profiles/{uid}
   */
  async updateProfile(uid: string, data: Partial<UserProfile>): Promise<void> {
    try {
      const profileRef = doc(db, 'profiles', uid);
      const updatePayload = {
        ...data,
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(profileRef, updatePayload);
    } catch (error) {
      console.error(`[UserRepository] Error updating profile ${uid}:`, error);
      throw error;
    }
  }
}

export const userRepository = new UserRepository();
