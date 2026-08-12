import { create } from 'zustand';
import { authService } from '@/services/auth.service';
import { userRepository } from '@/repositories/user.repository';
import { UserAccount, UserProfile, AuthState } from '@/types/auth.types';

interface AuthStoreActions {
  initAuthListener: () => () => void;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  saveProfile: (profileData: UserProfile) => Promise<void>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthStoreActions;

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  profile: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  initAuthListener: () => {
    set({ isLoading: true });
    const unsubscribe = authService.onAuthStateChangedListener(async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const uid = firebaseUser.uid;
          let user = await userRepository.getUserAccount(uid);
          let profile = await userRepository.getProfile(uid);

          const now = new Date().toISOString();
          if (!user) {
            user = {
              uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'Veterinário',
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
              fullName: firebaseUser.displayName || 'Veterinário',
              crmv: '',
              clinicName: '',
              phone: '',
              email: firebaseUser.email || '',
              logoUrl: firebaseUser.photoURL || '',
              address: { street: '', city: '', state: '', zipCode: '' },
              createdAt: now,
              updatedAt: now,
            };
            await userRepository.saveProfile(profile);
          }

          set({ user, profile, isAuthenticated: true, isLoading: false, error: null });
        } catch (err: any) {
          console.error('[AuthStore] Error loading user context:', err);
          set({ user: null, profile: null, isAuthenticated: false, isLoading: false, error: err.message });
        }
      } else {
        set({ user: null, profile: null, isAuthenticated: false, isLoading: false, error: null });
      }
    });

    return unsubscribe;
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { user, profile } = await authService.signIn(email, password);
      set({ user, profile, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const errorMsg = err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
        ? 'E-mail ou senha incorretos.'
        : err.message || 'Falha ao realizar login.';
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  register: async (email, password, fullName) => {
    set({ isLoading: true, error: null });
    try {
      const { user, profile } = await authService.signUp(email, password, fullName);
      set({ user, profile, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      const errorMsg = err.code === 'auth/email-already-in-use'
        ? 'Este e-mail já está cadastrado.'
        : err.message || 'Falha ao cadastrar usuário.';
      set({ isLoading: false, error: errorMsg });
      throw err;
    }
  },

  loginWithGoogle: async () => {
    set({ isLoading: true, error: null });
    try {
      const { user, profile } = await authService.signInWithGoogle();
      set({ user, profile, isAuthenticated: true, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Falha na autenticação via Google.' });
      throw err;
    }
  },

  sendPasswordReset: async (email) => {
    set({ isLoading: true, error: null });
    try {
      await authService.resetPassword(email);
      set({ isLoading: false });
    } catch (err: any) {
      set({ isLoading: false, error: err.message || 'Falha ao enviar e-mail de recuperação.' });
      throw err;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.signOut();
      set({ user: null, profile: null, isAuthenticated: false, isLoading: false, error: null });
    } catch (err: any) {
      set({ isLoading: false, error: err.message });
    }
  },

  saveProfile: async (profileData) => {
    const currentProfile = get().profile;
    if (!currentProfile) throw new Error('Nenhum usuário autenticado para atualizar perfil.');

    set({ isLoading: true, error: null });
    try {
      const updatedProfile: UserProfile = {
        ...currentProfile,
        ...profileData,
        updatedAt: new Date().toISOString(),
      };

      // Flow: UI -> State -> Service -> Repository -> Firestore -> Response -> State -> UI
      const savedProfile = await userRepository.saveProfile(updatedProfile);

      set({ profile: savedProfile, isLoading: false, error: null });
    } catch (err: any) {
      console.error('[AuthStore] Failed to save profile:', err);
      set({ isLoading: false, error: err.message || 'Falha ao salvar dados do perfil.' });
      throw err;
    }
  },

  clearError: () => set({ error: null }),
}));
