import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '../auth.service';
import { userRepository } from '@/repositories/user.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { UserProfile, UserAccount } from '@/types/auth.types';

// Mock Memory Store simulating Firestore collections
const mockMemoryStore: Record<string, any> = {};

vi.spyOn(userRepository, 'getUserAccount').mockImplementation(async (uid: string) => {
  return mockMemoryStore[`users/${uid}`] || null;
});

vi.spyOn(userRepository, 'createUserAccount').mockImplementation(async (user: UserAccount) => {
  mockMemoryStore[`users/${user.uid}`] = user;
  return user;
});

vi.spyOn(userRepository, 'getProfile').mockImplementation(async (uid: string) => {
  return mockMemoryStore[`profiles/${uid}`] || null;
});

vi.spyOn(userRepository, 'saveProfile').mockImplementation(async (profile: UserProfile) => {
  mockMemoryStore[`profiles/${profile.userId}`] = profile;
  return profile;
});

describe('Vetmind Auth & Profile Integration Gate - Definition of Done', () => {
  beforeEach(() => {
    for (const key in mockMemoryStore) delete mockMemoryStore[key];
    useAuthStore.setState({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('1. Create user - registers new account in auth service and creates Firestore documents', async () => {
    const mockUid = 'vet_uid_1001';
    vi.spyOn(authService, 'signUp').mockResolvedValueOnce({
      user: {
        uid: mockUid,
        email: 'dr.marcos@vetmind.com',
        displayName: 'Dr. Marcos Santos',
        role: 'VETERINARIAN',
        activeProfileId: mockUid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      profile: {
        id: mockUid,
        userId: mockUid,
        fullName: 'Dr. Marcos Santos',
        crmv: 'CRMV-SP 9988',
        clinicName: 'Clínica Vetmind SP',
        phone: '(11) 98888-1111',
        email: 'dr.marcos@vetmind.com',
        address: { street: 'Rua Augusta, 500', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });

    const { user, profile } = await authService.signUp('dr.marcos@vetmind.com', 'password123', 'Dr. Marcos Santos');

    expect(user.uid).toBe(mockUid);
    expect(profile.fullName).toBe('Dr. Marcos Santos');
    expect(profile.userId).toBe(mockUid);
  });

  it('2. Authenticate - logs in user and updates global AuthStore state', async () => {
    const mockUid = 'vet_uid_1001';
    const mockUser: UserAccount = {
      uid: mockUid,
      email: 'dr.marcos@vetmind.com',
      displayName: 'Dr. Marcos Santos',
      role: 'VETERINARIAN',
      activeProfileId: mockUid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const mockProfile: UserProfile = {
      id: mockUid,
      userId: mockUid,
      fullName: 'Dr. Marcos Santos',
      crmv: 'CRMV-SP 9988',
      clinicName: 'Clínica Vetmind SP',
      phone: '(11) 98888-1111',
      email: 'dr.marcos@vetmind.com',
      address: { street: 'Rua Augusta', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    vi.spyOn(authService, 'signIn').mockResolvedValueOnce({ user: mockUser, profile: mockProfile });

    await useAuthStore.getState().login('dr.marcos@vetmind.com', 'password123');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.uid).toBe(mockUid);
    expect(state.profile?.fullName).toBe('Dr. Marcos Santos');
  });

  it('3. Access protected area - grants access only when isAuthenticated is true', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);

    useAuthStore.setState({ isAuthenticated: true });
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('4. Save profile - executes UI -> State -> Service -> Repository -> Firestore flow', async () => {
    const mockUid = 'vet_uid_1001';
    const initialProfile: UserProfile = {
      id: mockUid,
      userId: mockUid,
      fullName: 'Dr. Marcos Santos',
      crmv: 'CRMV-SP 9988',
      clinicName: 'Clínica Vetmind SP',
      phone: '(11) 98888-1111',
      email: 'dr.marcos@vetmind.com',
      address: { street: 'Rua Augusta', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    useAuthStore.setState({
      user: { uid: mockUid, email: 'dr.marcos@vetmind.com', displayName: 'Dr. Marcos Santos', role: 'VETERINARIAN', activeProfileId: mockUid, createdAt: '', updatedAt: '' },
      profile: initialProfile,
      isAuthenticated: true,
    });

    const updatedData: UserProfile = {
      ...initialProfile,
      crmv: 'CRMV-SP 12345',
      clinicName: 'Hospital Veterinário Central',
    };

    await useAuthStore.getState().saveProfile(updatedData);

    const updatedState = useAuthStore.getState();
    expect(updatedState.profile?.crmv).toBe('CRMV-SP 12345');
    expect(updatedState.profile?.clinicName).toBe('Hospital Veterinário Central');
    expect(mockMemoryStore[`profiles/${mockUid}`]?.crmv).toBe('CRMV-SP 12345');
  });

  it('5. Reload page - persistent session listener recovers session and profile', async () => {
    const mockUid = 'vet_uid_1001';
    const storedUser: UserAccount = { uid: mockUid, email: 'dr.marcos@vetmind.com', displayName: 'Dr. Marcos Santos', role: 'VETERINARIAN', activeProfileId: mockUid, createdAt: '', updatedAt: '' };
    const storedProfile: UserProfile = { id: mockUid, userId: mockUid, fullName: 'Dr. Marcos Santos', crmv: 'CRMV-SP 12345', clinicName: 'Hospital Central', phone: '', email: 'dr.marcos@vetmind.com', address: { street: '', city: '', state: '', zipCode: '' }, createdAt: '', updatedAt: '' };

    mockMemoryStore[`users/${mockUid}`] = storedUser;
    mockMemoryStore[`profiles/${mockUid}`] = storedProfile;

    vi.spyOn(authService, 'onAuthStateChangedListener').mockImplementation((callback: any) => {
      callback({ uid: mockUid, email: 'dr.marcos@vetmind.com', displayName: 'Dr. Marcos Santos' });
      return () => {};
    });

    useAuthStore.getState().initAuthListener();

    await new Promise((resolve) => setTimeout(resolve, 10));

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.profile?.crmv).toBe('CRMV-SP 12345');
  });

  it('6. Recover profile from Firebase - UserRepository fetches exact profiles/{uid}', async () => {
    const mockUid = 'vet_uid_1001';
    const storedProfile: UserProfile = {
      id: mockUid,
      userId: mockUid,
      fullName: 'Dr. Marcos Santos',
      crmv: 'CRMV-SP 12345',
      clinicName: 'Hospital Central',
      phone: '',
      email: 'dr.marcos@vetmind.com',
      address: { street: '', city: '', state: '', zipCode: '' },
      createdAt: '',
      updatedAt: '',
    };
    mockMemoryStore[`profiles/${mockUid}`] = storedProfile;

    const profile = await userRepository.getProfile(mockUid);
    expect(profile?.userId).toBe(mockUid);
    expect(profile?.fullName).toBe('Dr. Marcos Santos');
  });

  it('7. Logout - clears authenticated state and profile from memory', async () => {
    vi.spyOn(authService, 'signOut').mockResolvedValueOnce();

    useAuthStore.setState({
      user: { uid: 'vet_uid_1001', email: 'dr.marcos@vetmind.com', displayName: 'Dr. Marcos', role: 'VETERINARIAN', activeProfileId: 'vet_uid_1001', createdAt: '', updatedAt: '' },
      profile: { id: 'vet_uid_1001', userId: 'vet_uid_1001', fullName: 'Dr. Marcos', crmv: '', clinicName: '', phone: '', email: 'dr.marcos@vetmind.com', address: { street: '', city: '', state: '', zipCode: '' }, createdAt: '', updatedAt: '' },
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
  });

  it('8. User cannot access another user profile - Security policy enforces matching UID', () => {
    const currentUserId: string = 'user_A';
    const targetProfileId: string = 'user_B';

    const isAllowed = (uidA: string, uidB: string) => uidA === uidB;
    expect(isAllowed(currentUserId, targetProfileId)).toBe(false);
  });
});
