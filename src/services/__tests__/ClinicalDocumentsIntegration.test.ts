import { describe, it, expect, beforeEach, vi } from 'vitest';
import { documentService } from '@/services/document.service';
import { documentRepository } from '@/repositories/document.repository';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { pdfService } from '@/services/pdf.service';
import { ClinicalDocument, DocumentType } from '@/types/document.types';
import { ClinicalCase, Patient } from '@/types/clinical.types';
import { UserProfile } from '@/types/auth.types';

const mockCases: Record<string, ClinicalCase> = {};
const mockPatients: Record<string, Patient> = {};
const mockProfiles: Record<string, UserProfile> = {};
const mockDocuments: Record<string, ClinicalDocument> = {};

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => {
  return mockCases[id] || null;
});

vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => {
  return mockPatients[id] || null;
});

vi.spyOn(userRepository, 'getProfile').mockImplementation(async (uid: string) => {
  return mockProfiles[uid] || null;
});

vi.spyOn(documentRepository, 'createDocument').mockImplementation(async (docObj: ClinicalDocument) => {
  mockDocuments[docObj.id] = docObj;
  return docObj;
});

vi.spyOn(documentRepository, 'getDocument').mockImplementation(async (id: string) => {
  return mockDocuments[id] || null;
});

vi.spyOn(documentRepository, 'getDocumentsByCase').mockImplementation(async (caseId: string) => {
  return Object.values(mockDocuments).filter((d) => d.caseId === caseId);
});

vi.spyOn(pdfService, 'uploadPdfToStorage').mockImplementation(async (userId: string, caseId: string, docId: string) => {
  return `https://storage.firebase.com/users/${userId}/cases/${caseId}/documents/${docId}.pdf`;
});

describe('Vetmind Clinical Documents & PDF Generation Integration Gate', () => {
  const now = new Date().toISOString();

  beforeEach(() => {
    for (const k in mockCases) delete mockCases[k];
    for (const k in mockPatients) delete mockPatients[k];
    for (const k in mockProfiles) delete mockProfiles[k];
    for (const k in mockDocuments) delete mockDocuments[k];

    mockProfiles['vet_A'] = {
      id: 'vet_A',
      userId: 'vet_A',
      email: 'vet_a@vetmind.com',
      fullName: 'Dra. Ana Costa',
      crmv: 'SP-12345',
      clinicName: 'Hospital Veterinário Central',
      phone: '11988887777',
      address: {
        street: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
      },
      createdAt: now,
      updatedAt: now,
    };

    mockPatients['pat_400'] = {
      id: 'pat_400',
      userId: 'vet_A',
      ownerId: 'vet_A',
      name: 'Thor',
      species: 'CANINE',
      breed: 'Boxer',
      gender: 'MALE_NEUTERED',
      ageYears: 4,
      ageMonths: 2,
      weightKg: 25.0,
      tutorName: 'Carlos Eduardo',
      tutorContact: '11977776666',
      createdAt: now,
      updatedAt: now,
    };

    mockCases['case_400'] = {
      id: 'case_400',
      userId: 'vet_A',
      ownerId: 'vet_A',
      patientId: 'pat_400',
      caseNumber: 'CAS-400',
      status: 'CONDUCT_SET',
      title: 'Atendimento Thor',
      chiefComplaint: 'Emeses e diarreia',
      currentVersion: 1,
      tags: [],
      createdAt: now,
      updatedAt: now,
    };
  });

  it('1. Generates real Clinical Document derived from case and vet profile data', async () => {
    const docObj = await documentService.generateDocument('case_400', 'PRESCRIPTION', 'vet_A');

    expect(docObj).toBeDefined();
    expect(docObj.type).toBe('PRESCRIPTION');
    expect(docObj.metadata.vetName).toBe('Dra. Ana Costa');
    expect(docObj.metadata.crmv).toBe('SP-12345');
    expect(docObj.metadata.clinicName).toBe('Hospital Veterinário Central');
    expect(docObj.metadata.patientName).toBe('Thor');
    expect(docObj.pdfUrl).toContain('users/vet_A/cases/case_400/documents');
    expect(mockDocuments[docObj.id]).toBeDefined();
  });

  it('2. Generates all 6 Clinical Document types successfully', async () => {
    const types: DocumentType[] = [
      'PRESCRIPTION',
      'EXAM_REQUEST',
      'TUTOR_INSTRUCTIONS',
      'CLINICAL_SUMMARY',
      'CLINICAL_REPORT',
      'FOLLOWUP_PLAN',
    ];

    for (const t of types) {
      const generated = await documentService.generateDocument('case_400', t, 'vet_A');
      expect(generated.type).toBe(t);
      expect(generated.contentHtml).toContain('Dra. Ana Costa');
    }

    const allCaseDocs = await documentService.getDocumentsForCase('case_400', 'vet_A');
    expect(allCaseDocs.length).toBe(6);
  });

  it('3. Reopening Case: persisted document metadata remains available from Firestore', async () => {
    const created = await documentService.generateDocument('case_400', 'TUTOR_INSTRUCTIONS', 'vet_A');

    // Simulate page reload / case reopening
    const docs = await documentService.getDocumentsForCase('case_400', 'vet_A');
    expect(docs.some((d) => d.id === created.id)).toBe(true);
  });

  it('4. Multi-Tenant Security: User B cannot generate or fetch User A clinical documents', async () => {
    await expect(documentService.generateDocument('case_400', 'CLINICAL_REPORT', 'vet_B')).rejects.toThrow('Permissão negada');

    await expect(documentService.getDocumentsForCase('case_400', 'vet_B')).rejects.toThrow('Permissão negada');
  });
});
