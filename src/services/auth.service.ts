import { auth, googleProvider } from './firebase.config';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { userRepository } from '@/repositories/user.repository';
import { UserAccount, UserProfile } from '@/types/auth.types';

export class AuthService {
  /**
   * Registers a new user with Email and Password, creating UserAccount and UserProfile documents
   */
  async signUp(email: string, password: string, fullName: string): Promise<{ user: UserAccount; profile: UserProfile }> {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;
    const now = new Date().toISOString();

    const newAccount: UserAccount = {
      uid,
      email: credential.user.email || email,
      displayName: fullName,
      role: 'VETERINARIAN',
      activeProfileId: uid,
      createdAt: now,
      updatedAt: now,
    };

    const newProfile: UserProfile = {
      id: uid,
      userId: uid,
      fullName,
      crmv: '',
      clinicName: '',
      phone: '',
      email: credential.user.email || email,
      logoUrl: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
      },
      createdAt: now,
      updatedAt: now,
    };

    await userRepository.createUserAccount(newAccount);
    await userRepository.saveProfile(newProfile);

    return { user: newAccount, profile: newProfile };
  }

  /**
   * Authenticates user with Email and Password and loads profile
   */
  async signIn(email: string, password: string): Promise<{ user: UserAccount; profile: UserProfile }> {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const uid = credential.user.uid;

    let user = await userRepository.getUserAccount(uid);
    let profile = await userRepository.getProfile(uid);

    const now = new Date().toISOString();

    if (!user) {
      user = {
        uid,
        email: credential.user.email || email,
        displayName: credential.user.displayName || email.split('@')[0],
        role: 'VETERINARIAN',
        activeProfileId: uid,
        createdAt: now,
        updatedAt: now,
      };
      await userRepository.createUserAccount(user);
    }

    if (!profile) {
      profile = {
        id: uid,
        userId: uid,
        fullName: user.displayName || 'Veterinário',
        crmv: '',
        clinicName: '',
        phone: '',
        email: user.email,
        address: { street: '', city: '', state: '', zipCode: '' },
        createdAt: now,
        updatedAt: now,
      };
      await userRepository.saveProfile(profile);
    }

    return { user, profile };
  }

  /**
   * Authenticates user via Google OAuth Popup
   */
  async signInWithGoogle(): Promise<{ user: UserAccount; profile: UserProfile }> {
    const credential = await signInWithPopup(auth, googleProvider);
    const uid = credential.user.uid;
    const now = new Date().toISOString();

    let user = await userRepository.getUserAccount(uid);
    let profile = await userRepository.getProfile(uid);

    if (!user) {
      user = {
        uid,
        email: credential.user.email || '',
        displayName: credential.user.displayName || 'Veterinário',
        role: 'VETERINARIAN',
        activeProfileId: uid,
        createdAt: now,
        updatedAt: now,
      };
      await userRepository.createUserAccount(user);
    }

    if (!profile) {
      profile = {
        id: uid,
        userId: uid,
        fullName: credential.user.displayName || 'Veterinário',
        crmv: '',
        clinicName: '',
        phone: '',
        email: credential.user.email || '',
        logoUrl: credential.user.photoURL || '',
        address: { street: '', city: '', state: '', zipCode: '' },
        createdAt: now,
        updatedAt: now,
      };
      await userRepository.saveProfile(profile);
    }

    return { user, profile };
  }

  /**
   * Sends password reset email
   */
  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  /**
   * Signs out current user session
   */
  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  /**
   * Subscribes to persistent Firebase Auth state changes
   */
  onAuthStateChangedListener(callback: (firebaseUser: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export const authService = new AuthService();
