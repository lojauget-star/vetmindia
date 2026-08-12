import { describe, it, expect, beforeEach, vi } from 'vitest';
import { timelineService } from '@/services/timeline.service';
import { timelineRepository } from '@/repositories/timeline.repository';
import { libraryService } from '@/services/library.service';
import { libraryRepository } from '@/repositories/library.repository';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { documentRepository } from '@/repositories/document.repository';
import { TimelineEvent } from '@/types/timeline.types';
import { LibraryItem } from '@/types/library.types';
import { ClinicalCase, Patient } from '@/types/clinical.types';
import { UserProfile } from '@/types/auth.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockPatients: Record<string, Patient> = {};
const mockProfiles: Record<string, UserProfile> = {};
const mockEvents: Record<string, TimelineEvent> = {};
const mockLibrary: Record<string, LibraryItem> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockCases[id] || null;
});

vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => {
  return mockPatients[id] || null;
});

vi.spyOn(userRepository, 'getProfile').mockImplementation(async (uid: string) => {
  return mockProfiles[uid] || null;
});

vi.spyOn(timelineRepository, 'createEvent').mockImplementation(async (evt: TimelineEvent) => {
  mockEvents[evt.id] = evt;
  return evt;
});

vi.spyOn(timelineRepository, 'getEventsByCase').mockImplementation(async (caseId: string) => {
  return Object.values(mockEvents)
    .filter((e) => e.caseId === caseId)
    .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
});

vi.spyOn(libraryRepository, 'createItem').mockImplementation(async (item: LibraryItem) => {
  mockLibrary[item.id] = item;
  return item;
});

vi.spyOn(libraryRepository, 'getLibraryContent').mockImplementation(async (userId: string) => {
  return Object.values(mockLibrary).filter((i) => i.isGlobal || i.userId === userId);
});

vi.spyOn(libraryRepository, 'toggleFavorite').mockImplementation(async (itemId: string, userId: string, isFav: boolean) => {
  const item = mockLibrary[itemId];
  if (!item) throw new Error('Item não encontrado.');
  const updated = { ...item, isFavorite: isFav };
  mockLibrary[itemId] = updated;
  return updated;
});

vi.spyOn(documentRepository, 'getDocumentsByUser').mockImplementation(async () => []);
vi.spyOn(caseRepository, 'getCasesByUser').mockImplementation(async () => []);

describe('Vetmind Timeline & Library Domain Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockPatients) delete mockPatients[k];
    for (const k in mockProfiles) delete mockProfiles[k];
    for (const k in mockEvents) delete mockEvents[k];
    for (const k in mockLibrary) delete mockLibrary[k];

    mockProfiles['vet_A'] = {
      id: 'vet_A',
      userId: 'vet_A',
      email: 'vet_a@vetmind.com',
      fullName: 'Dr. Lucas Silva',
      crmv: 'SP-99999',
      clinicName: 'Clínica Vetmind SP',
      phone: '11977775555',
      address: { street: 'Rua Augusta, 500', city: 'São Paulo', state: 'SP', zipCode: '01305-000' },
      createdAt: now,
      updatedAt: now,
    };

    mockPatients['pat_500'] = {
      id: 'pat_500',
      userId: 'vet_A',
      ownerId: 'vet_A',
      name: 'Max',
      species: 'CANINE',
      breed: 'Beagle',
      gender: 'MALE_INTACT',
      ageYears: 2,
      ageMonths: 5,
      weightKg: 12.0,
      tutorName: 'Fernanda Lima',
      tutorContact: '11966665555',
      createdAt: now,
      updatedAt: now,
    };

    mockCases['case_500'] = {
      id: 'case_500',
      userId: 'vet_A',
      ownerId: 'vet_A',
      patientId: 'pat_500',
      caseNumber: 'CAS-500',
      status: 'DRAFT',
      title: 'Atendimento Max',
      chiefComplaint: 'Apatia e inapetência',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. Domain actions automatically record real timeline events in chronological order', async () => {
    // 1. Log Case Created
    await timelineService.logCaseCreated('case_500', 'vet_A', 'CAS-500', 'Max');

    // 2. Log Anamnesis Updated
    await timelineService.logAnamnesisUpdated('case_500', 'vet_A');

    // 3. Log Hypothesis Selected
    await timelineService.logHypothesisSelected('case_500', 'vet_A', 'Gastroenterite Aguda');

    // 4. Log Document Generated
    await timelineService.logDocumentGenerated('case_500', 'vet_A', 'Prescrição Médica Veterinária');

    const timeline = await timelineService.getTimelineForCase('case_500', 'vet_A');

    expect(timeline.length).toBe(4);
    expect(timeline[0].type).toBe('CASE_CREATED');
    expect(timeline[1].type).toBe('ANAMNESIS_UPDATED');
    expect(timeline[2].type).toBe('HYPOTHESIS_SELECTED');
    expect(timeline[3].type).toBe('DOCUMENT_GENERATED');
  });

  it('2. Library queries Firebase and returns categorized peer-reviewed items and favorites', async () => {
    const lib = await libraryService.getFullLibrary('vet_A');

    expect(lib.GLOBAL_LITERATURE).toBeDefined();
    expect(lib.GLOBAL_LITERATURE.length).toBeGreaterThan(0);
    expect(lib.GLOBAL_LITERATURE[0].title).toContain('WSAVA');

    // Toggle favorite
    const itemToFav = lib.GLOBAL_LITERATURE[0];
    const favResult = await libraryService.toggleFavorite(itemToFav.id, 'vet_A', true);
    expect(favResult.isFavorite).toBe(true);
  });

  it('3. Multi-Tenant Security: User B cannot fetch User A timeline events', async () => {
    await timelineService.logCaseCreated('case_500', 'vet_A', 'CAS-500', 'Max');

    await expect(timelineService.getTimelineForCase('case_500', 'vet_B')).rejects.toThrow('Permissão negada');
  });
});
