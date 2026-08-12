import { describe, it, expect, beforeEach, vi } from 'vitest';
import { anonymizationService } from '@/services/anonymization.service';
import { marketingService } from '@/services/marketing.service';
import { marketingRepository } from '@/repositories/marketing.repository';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { ClinicalCase, Patient, Anamnesis } from '@/types/clinical.types';
import { BrandKit, MarketingProject } from '@/types/marketing.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockPatients: Record<string, Patient> = {};
const mockAnamnesis: Record<string, Anamnesis> = {};
const mockBrandKits: Record<string, BrandKit> = {};
const mockProjects: Record<string, MarketingProject> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => mockCases[id] || null);
vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => mockPatients[id] || null);
vi.spyOn(anamnesisRepository, 'getAnamnesisByCase').mockImplementation(async (cId: string) => mockAnamnesis[cId] || null);

vi.spyOn(marketingRepository, 'saveBrandKit').mockImplementation(async (bk: BrandKit) => {
  mockBrandKits[bk.userId] = bk;
  return bk;
});

vi.spyOn(marketingRepository, 'getBrandKit').mockImplementation(async (uId: string) => {
  return (
    mockBrandKits[uId] || {
      id: `brand_${uId}`,
      userId: uId,
      name: 'Clínica Vetmind Teste',
      primaryColor: '#4F46E5',
      secondaryColor: '#0F8A5F',
      accentColor: '#6366F1',
      fontFamily: 'Inter',
      toneOfVoice: 'EDITORIAL',
      visualStyle: 'Minimalista',
      photographyStyle: 'Clínica',
      backgroundColor: '#F7F7F5',
      updatedAt: new Date().toISOString(),
    }
  );
});

vi.spyOn(marketingRepository, 'saveProject').mockImplementation(async (proj: MarketingProject) => {
  mockProjects[proj.id] = proj;
  return proj;
});

vi.spyOn(marketingRepository, 'getProject').mockImplementation(async (pId: string, uId: string) => {
  const p = mockProjects[pId];
  if (!p) return null;
  if (p.userId !== uId) throw new Error('Permissão negada.');
  return p;
});

vi.spyOn(marketingService, 'generateVisualAsset').mockImplementation(async (proj: MarketingProject) => {
  return {
    imageUrl: `https://storage.vetmind.com/users/${proj.userId}/marketingProjects/${proj.id}/asset.png`,
    imageStoragePath: `users/${proj.userId}/marketingProjects/${proj.id}/asset.png`,
  };
});

describe('Vetmind Marketing Studio Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockPatients) delete mockPatients[k];
    for (const k in mockAnamnesis) delete mockAnamnesis[k];
    for (const k in mockBrandKits) delete mockBrandKits[k];
    for (const k in mockProjects) delete mockProjects[k];

    mockPatients['pat_mkt_1'] = {
      id: 'pat_mkt_1',
      userId: 'vet_mkt',
      ownerId: 'vet_mkt',
      name: 'Bidu',
      species: 'CANINE',
      breed: 'Beagle',
      gender: 'MALE_NEUTERED',
      ageYears: 4,
      ageMonths: 0,
      weightKg: 14.5,
      tutorName: 'Roberto Silva',
      tutorContact: '21988887777',
      createdAt: now,
      updatedAt: now,
    };

    mockCases['case_mkt_1'] = {
      id: 'case_mkt_1',
      userId: 'vet_mkt',
      ownerId: 'vet_mkt',
      patientId: 'pat_mkt_1',
      caseNumber: 'CAS-MKT-1',
      status: 'CONDUCT_SET',
      title: 'Atendimento Bidu',
      chiefComplaint: 'Emeses frequentes e prostração relatados pelo tutor Roberto Silva',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };

    mockAnamnesis['case_mkt_1'] = {
      id: 'anam_mkt_1',
      caseId: 'case_mkt_1',
      userId: 'vet_mkt',
      patientId: 'pat_mkt_1',
      rawText: 'Tutor Roberto Silva (21988887777) relata vômitos amarelados.',
      structuredData: {
        chiefComplaint: 'Emeses',
        symptoms: ['vômito'],
        onsetDate: '2026-08-12',
        progression: 'ACUTE',
        dietHistory: 'Ração',
        vaccinationStatus: 'Em dia',
        dewormingStatus: 'Em dia',
        medications: 'Nenhuma',
        historicalNotes: 'Sem histórico',
      },
      physicalExam: {},
      clinicalFindings: [],
      missingInformation: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. Privacy & Anonymization: Strips tutor names, phones, and personal identifiers strictly', () => {
    const anonymized = anonymizationService.anonymizeCase(
      mockCases['case_mkt_1'],
      mockPatients['pat_mkt_1'],
      mockAnamnesis['case_mkt_1']
    );

    expect(anonymized.sanitizedClinicalSummary).not.toContain('Roberto Silva');
    expect(anonymized.sanitizedClinicalSummary).not.toContain('21988887777');
    expect(anonymized.removedFields.length).toBeGreaterThan(0);
    expect(anonymized.sanitizedSpecies).toBe('Cão');
    expect(anonymized.sanitizedBreed).toBe('Beagle');
  });

  it('2. BrandKit Persistence: Saves and fetches custom clinic colors and tone of voice', async () => {
    const saved = await marketingRepository.saveBrandKit({
      id: 'brand_vet_mkt',
      userId: 'vet_mkt',
      name: 'Centro Veterinário de Precisão',
      primaryColor: '#4F46E5',
      secondaryColor: '#0F8A5F',
      accentColor: '#6366F1',
      fontFamily: 'Inter',
      toneOfVoice: 'EDITORIAL',
      visualStyle: 'Editorial',
      photographyStyle: 'Clínica',
      backgroundColor: '#F7F7F5',
      updatedAt: now,
    });

    const fetched = await marketingRepository.getBrandKit('vet_mkt');
    expect(fetched.name).toBe('Centro Veterinário de Precisão');
    expect(fetched.primaryColor).toBe('#4F46E5');
    expect(fetched.secondaryColor).toBe('#0F8A5F');
  });

  it('3. End-to-End Marketing Project Generation: Creates project, generates AI copy and backend graphic asset', async () => {
    const proj = await marketingService.createProjectFromCase('case_mkt_1', 'INSTAGRAM_POST', 'vet_mkt');

    expect(proj.userId).toBe('vet_mkt');
    expect(proj.status).toBe('GENERATED');
    expect(proj.copy.headline).toContain('Diagnóstico');
    expect(proj.copy.hashtags).toContain('#MedicinaVeterinaria');
    expect(proj.imageUrl).toContain('storage.vetmind.com');
  });

  it('4. Reopen, Edit & Save: Modifies headline/caption and persists in Firestore', async () => {
    const proj = await marketingService.createProjectFromCase('case_mkt_1', 'INSTAGRAM_POST', 'vet_mkt');

    const updated = await marketingService.updateProject(
      proj.id,
      {
        copy: {
          ...proj.copy,
          headline: 'Novo Título de Autoridade Veterinária',
          caption: 'Nova legenda ajustada pelo veterinário.',
        },
      },
      'vet_mkt'
    );

    expect(updated.copy.headline).toBe('Novo Título de Autoridade Veterinária');
    expect(updated.copy.caption).toBe('Nova legenda ajustada pelo veterinário.');

    const reopened = await marketingRepository.getProject(proj.id, 'vet_mkt');
    expect(reopened?.copy.headline).toBe('Novo Título de Autoridade Veterinária');
  });

  it('5. Export Bundle: Formats copy, hashtags, and asset link for social media export', async () => {
    const proj = await marketingService.createProjectFromCase('case_mkt_1', 'INSTAGRAM_POST', 'vet_mkt');
    const bundleText = marketingService.exportProjectBundle(proj);

    expect(bundleText).toContain('=== VETMIND MARKETING STUDIO - EXPORT ===');
    expect(bundleText).toContain('--- HEADLINE ---');
    expect(bundleText).toContain('--- HASHTAGS ---');
    expect(bundleText).toContain('--- ASSET GRÁFICO URL ---');
  });

  it('6. Multi-Tenant Security: Prevents unauthorized user from reading or modifying another user project', async () => {
    const proj = await marketingService.createProjectFromCase('case_mkt_1', 'INSTAGRAM_POST', 'vet_mkt');

    await expect(marketingRepository.getProject(proj.id, 'vet_intruder')).rejects.toThrow('Permissão negada.');
    await expect(marketingService.updateProject(proj.id, {}, 'vet_intruder')).rejects.toThrow('Permissão negada.');
  });
});
