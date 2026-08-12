/**
 * VETMIND AUTH & PROFILE TYPES
 */

export interface UserProfile {
  id: string; // Matches Firebase Auth UID
  userId: string; // Foreign Key / UID
  fullName: string;
  crmv: string;
  clinicName: string;
  phone: string;
  email: string;
  logoUrl?: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface UserAccount {
  uid: string;
  email: string;
  displayName: string;
  role: 'VETERINARIAN' | 'CLINIC_ADMIN' | 'SPECIALIST';
  activeProfileId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: UserAccount | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
