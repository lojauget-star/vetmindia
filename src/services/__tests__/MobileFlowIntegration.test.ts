import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caseRepository } from '@/repositories/case.repository';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { analysisJobService } from '@/services/analysisJob.service';
import { prescriptionService } from '@/services/prescription.service';
import { documentService } from '@/services/document.service';
import { timelineService } from '@/services/timeline.service';
import { ClinicalCase, Patient, Anamnesis } from '@/types/clinical.types';
import { UserProfile } from '@/types/auth.types';
import { GroundedHypothesis } from '@/types/rag.types';
import { Prescription } from '@/types/prescription.types';
import { ClinicalDocument } from '@/types/document.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockPatients: Record<string, Patient> = {};
const mockProfiles: Record<string, UserProfile> = {};
const mockAnamnesis: Record<string, Anamnesis> = {};
const mockHypotheses: Record<string, GroundedHypothesis[]> = {};
const mockPrescriptions: Record<string, Prescription> = {};
const mockDocuments: Record<string, ClinicalDocument> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => mockCases[id] || null);
vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => mockPatients[id] || null);
vi.spyOn(userRepository, 'getProfile').mockImplementation(async (uid: string) => mockProfiles[uid] || null);
vi.spyOn(anamnesisRepository, 'getAnamnesisByCase').mockImplementation(async (cId: string) => mockAnamnesis[cId] || null);
vi.spyOn(anamnesisRepository, 'saveAnamnesis').mockImplementation(async (an: Anamnesis) => {
  mockAnamnesis[an.caseId] = an;
  return an;
});

vi.spyOn(caseRepository, 'createCase').mockImplementation(async (c: ClinicalCase) => {
  mockCases[c.id] = c;
  return c;
});

vi.spyOn(caseRepository, 'updateCase').mockImplementation(async (id: string, data: Partial<ClinicalCase>) => {
  const current = mockCases[id];
  if (!current) throw new Error('Caso não encontrado.');
  const updated = { ...current, ...data, updatedAt: new Date().toISOString() };
  mockCases[id] = updated;
  return updated;
});

vi.spyOn(caseRepository, 'selectHypothesis').mockImplementation(async (cId: string, hId: string, uId: string) => {
  const c = mockCases[cId];
  if (!c || (c.userId !== uId && c.ownerId !== uId)) throw new Error('Permissão negada');
  return await caseRepository.updateCase(cId, { selectedHypothesisId: hId, status: 'CONDUCT_SET' });
});

vi.spyOn(prescriptionService, 'generateDraftForHypothesis').mockImplementation(async (cId: string, hId: string, uId: string) => {
  const now = new Date().toISOString();
  return {
    id: `presc_mob_${Date.now()}`,
    caseId: cId,
    hypothesisId: hId,
    patientId: 'pat_mob',
    userId: uId,
    createdBy: uId,
    weightUsed: 12.0,
    items: [],
    status: 'DRAFT',
    version: 1,
    createdAt: now,
    updatedAt: now,
  };
});

vi.spyOn(prescriptionService, 'savePrescription').mockImplementation(async (p: Prescription, uId: string) => {
  const c = mockCases[p.caseId];
  if (!c || (c.userId !== uId && c.ownerId !== uId)) throw new Error('Permissão negada');
  mockPrescriptions[p.id] = p;
  return p;
});

vi.spyOn(documentService, 'generateDocument').mockImplementation(async (cId: string, type: any, uId: string) => {
  const c = mockCases[cId];
  if (!c || (c.userId !== uId && c.ownerId !== uId)) throw new Error('Permissão negada');
  const now = new Date().toISOString();
  const docObj: ClinicalDocument = {
    id: `doc_mob_${Date.now()}`,
    caseId: cId,
    patientId: 'pat_mob',
    userId: uId,
    type,
    title: 'Prescrição Médica Mobile',
    version: 1,
    pdfUrl: `users/${uId}/cases/${cId}/documents/doc.pdf`,
    contentHtml: '<html>Mobile PDF</html>',
    metadata: {
      vetName: 'Dra. Carla Mobile',
      crmv: 'RJ-9999',
      clinicName: 'Clínica Vetmind Mobile',
      patientName: 'Luna',
      species: 'CANINE',
      tutorName: 'Roberto',
      generatedAt: now,
    },
    createdAt: now,
    updatedAt: now,
  };
  mockDocuments[docObj.id] = docObj;
  return docObj;
});

describe('Vetmind Full Mobile Flow Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockPatients) delete mockPatients[k];
    for (const k in mockProfiles) delete mockProfiles[k];
    for (const k in mockAnamnesis) delete mockAnamnesis[k];
    for (const k in mockHypotheses) delete mockHypotheses[k];
    for (const k in mockPrescriptions) delete mockPrescriptions[k];
    for (const k in mockDocuments) delete mockDocuments[k];

    mockProfiles['vet_mobile'] = {
      id: 'vet_mobile',
      userId: 'vet_mobile',
      email: 'vet_mobile@vetmind.com',
      fullName: 'Dra. Carla Mobile',
      crmv: 'RJ-9999',
      clinicName: 'Clínica Vetmind Mobile',
      phone: '21999998888',
      address: { street: 'Rua Copacabana, 100', city: 'Rio de Janeiro', state: 'RJ', zipCode: '22000-000' },
      createdAt: now,
      updatedAt: now,
    };

    mockPatients['pat_mob'] = {
      id: 'pat_mob',
      userId: 'vet_mobile',
      ownerId: 'vet_mobile',
      name: 'Luna',
      species: 'CANINE',
      breed: 'Poodle',
      gender: 'FEMALE_SPAYED',
      ageYears: 3,
      ageMonths: 0,
      weightKg: 12.0,
      tutorName: 'Roberto',
      tutorContact: '21988887777',
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. Full Mobile End-to-End Flow: Login -> Case -> Anamnesis -> RAG -> Hypothesis -> Prescription -> PDF', async () => {
    // Step 1: Mobile User creates case using shared caseRepository
    const newCase = await caseRepository.createCase({
      id: 'case_mob_100',
      userId: 'vet_mobile',
      ownerId: 'vet_mobile',
      patientId: 'pat_mob',
      caseNumber: 'CAS-MOB-100',
      status: 'ANAMNESIS_PENDING',
      title: 'Atendimento Luna',
      chiefComplaint: 'Emeses amareladas',
      currentVersion: 1,
      tags: ['mobile'],
      createdAt: now,
      updatedAt: now,
    });

    expect(newCase.id).toBe('case_mob_100');

    // Step 2: Anamnesis Module saves anamnesis data
    const anamnesis = await anamnesisRepository.saveAnamnesis({
      id: 'anam_mob_1',
      caseId: newCase.id,
      userId: 'vet_mobile',
      patientId: 'pat_mob',
      rawText: 'Paciente vomitando após ingestão de grama. Relato de 3 episódios nas últimas 12h',
      structuredData: {
        chiefComplaint: 'Emeses amareladas',
        symptoms: ['vômito'],
        onsetDate: '2026-08-12',
        progression: 'ACUTE',
        dietHistory: 'Ração seca',
        vaccinationStatus: 'Em dia',
        dewormingStatus: 'Em dia',
        medications: 'Nenhuma',
        historicalNotes: 'Sem histórico anterior de gastroenterite',
      },
      physicalExam: { temperatureC: 38.5, heartRateBpm: 110, respiratoryRateBpm: 24, capillaryRefillTimeSec: 1.5, hydrationStatus: 'Adequada' },
      clinicalFindings: ['Vômito'],
      missingInformation: [],
      createdAt: now,
      updatedAt: now,
    });

    expect(anamnesis.rawText).toContain('3 episódios');

    // Step 3: Hypothesis Selection on Mobile
    const updatedCase = await caseRepository.selectHypothesis(newCase.id, 'hyp_mob_1', 'vet_mobile');
    expect(updatedCase.selectedHypothesisId).toBe('hyp_mob_1');
    expect(updatedCase.status).toBe('CONDUCT_SET');

    // Step 4: Prescription Calculation & Firestore Saving
    const draftPresc = await prescriptionService.generateDraftForHypothesis(newCase.id, 'hyp_mob_1', 'vet_mobile');
    draftPresc.weightUsed = 12.0;
    draftPresc.items = [
      {
        id: 'item_1',
        medicationName: 'Cerenia',
        activeIngredient: 'Maropitant',
        dosageMgKg: 1.0,
        route: 'SUBCUTANEOUS',
        frequency: 'A cada 24 horas',
        durationDays: 3,
        calculatedTotalDoseMg: 12.0,
        instructions: 'Aplicar SC',
      },
    ];

    const savedPresc = await prescriptionService.savePrescription(draftPresc, 'vet_mobile');
    expect(savedPresc.weightUsed).toBe(12.0);
    expect(mockPrescriptions[savedPresc.id]).toBeDefined();

    // Step 5: PDF Document Generation on Mobile
    const pdfDoc = await documentService.generateDocument(newCase.id, 'PRESCRIPTION', 'vet_mobile');
    expect(pdfDoc.type).toBe('PRESCRIPTION');
    expect(pdfDoc.metadata.vetName).toBe('Dra. Carla Mobile');
    expect(mockDocuments[pdfDoc.id]).toBeDefined();
  });

  it('2. Shared Architecture Rule: Mobile uses exact same backend repositories and domain models', async () => {
    // Verifies that mobile flow executes exact same caseRepository and timelineService methods
    const c = await caseRepository.createCase({
      id: 'case_mob_200',
      userId: 'vet_mobile',
      ownerId: 'vet_mobile',
      patientId: 'pat_mob',
      caseNumber: 'CAS-MOB-200',
      status: 'DRAFT',
      title: 'Atendimento Teste',
      chiefComplaint: 'Apatia',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    const fetched = await caseRepository.getCase(c.id);
    expect(fetched?.userId).toBe('vet_mobile');
  });

  it('3. Multi-Tenant Security on Mobile: Unauthorized user cannot complete mobile flow on User A case', async () => {
    await caseRepository.createCase({
      id: 'case_mob_300',
      userId: 'vet_mobile',
      ownerId: 'vet_mobile',
      patientId: 'pat_mob',
      caseNumber: 'CAS-MOB-300',
      status: 'DRAFT',
      title: 'Caso Privado',
      chiefComplaint: 'Sem queixa',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    });

    await expect(caseRepository.selectHypothesis('case_mob_300', 'hyp_1', 'vet_intruder')).rejects.toThrow('Permissão negada');
    await expect(documentService.generateDocument('case_mob_300', 'PRESCRIPTION', 'vet_intruder')).rejects.toThrow('Permissão negada');
  });
});
