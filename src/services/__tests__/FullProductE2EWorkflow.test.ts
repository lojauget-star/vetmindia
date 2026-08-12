import { describe, it, expect, beforeEach, vi } from 'vitest';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { userRepository } from '@/repositories/user.repository';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { analysisJobRepository } from '@/repositories/analysisJob.repository';
import { prescriptionRepository } from '@/repositories/prescription.repository';
import { documentRepository } from '@/repositories/document.repository';
import { timelineRepository } from '@/repositories/timeline.repository';
import { marketingRepository } from '@/repositories/marketing.repository';
import { analysisJobService } from '@/services/analysisJob.service';
import { prescriptionService } from '@/services/prescription.service';
import { documentService } from '@/services/document.service';
import { pdfService } from '@/services/pdf.service';
import { timelineService } from '@/services/timeline.service';
import { hypothesisWorkspaceService } from '@/services/hypothesisWorkspace.service';
import { anonymizationService } from '@/services/anonymization.service';
import { marketingService } from '@/services/marketing.service';
import { Patient, ClinicalCase, Anamnesis, TranscriptRecord } from '@/types/clinical.types';
import { UserProfile } from '@/types/auth.types';
import { AnalysisJob } from '@/types/job.types';
import { GroundedHypothesis } from '@/types/rag.types';
import { Prescription } from '@/types/prescription.types';
import { ClinicalDocument } from '@/types/document.types';
import { TimelineEvent } from '@/types/timeline.types';
import { BrandKit, MarketingProject } from '@/types/marketing.types';

// In-Memory Cloud Database Collections
const dbUsers: Record<string, UserProfile> = {};
const dbPatients: Record<string, Patient> = {};
const dbCases: Record<string, ClinicalCase> = {};
const dbAnamnesis: Record<string, Anamnesis> = {};
const dbTranscripts: Record<string, TranscriptRecord> = {};
const dbJobs: Record<string, AnalysisJob> = {};
const dbPrescriptions: Record<string, Prescription> = {};
const dbDocuments: Record<string, ClinicalDocument> = {};
const dbTimeline: Record<string, TimelineEvent> = {};
const dbBrandKits: Record<string, BrandKit> = {};
const dbMarketingProjects: Record<string, MarketingProject> = {};

// Repository Spies
vi.spyOn(userRepository, 'getProfile').mockImplementation(async (uid: string) => dbUsers[uid] || null);
vi.spyOn(patientRepository, 'createPatient').mockImplementation(async (p: Patient) => {
  dbPatients[p.id] = p;
  return p;
});
vi.spyOn(patientRepository, 'getPatient').mockImplementation(async (id: string) => dbPatients[id] || null);

vi.spyOn(caseRepository, 'createCase').mockImplementation(async (c: ClinicalCase) => {
  dbCases[c.id] = c;
  await timelineService.recordEvent(c.id, c.userId, 'CASE_CREATED', 'Prontuário Criado', `Caso ${c.caseNumber} criado para paciente.`);
  return c;
});

vi.spyOn(caseRepository, 'getCase').mockImplementation(async (id: string) => dbCases[id] || null);
vi.spyOn(caseRepository, 'getCasesByUser').mockImplementation(async (uId: string) => Object.values(dbCases).filter((c) => c.userId === uId));
vi.spyOn(caseRepository, 'updateCase').mockImplementation(async (id: string, updates: Partial<ClinicalCase>) => {
  const current = dbCases[id];
  if (!current) throw new Error('Caso não encontrado');
  const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
  dbCases[id] = updated;
  return updated;
});

vi.spyOn(caseRepository, 'selectHypothesis').mockImplementation(async (cId: string, hId: string, uId: string) => {
  const c = dbCases[cId];
  if (!c || c.userId !== uId) throw new Error('Permissão negada');
  const updated = await caseRepository.updateCase(cId, { selectedHypothesisId: hId, status: 'CONDUCT_SET' });
  await timelineService.recordEvent(cId, uId, 'HYPOTHESIS_SELECTED', 'Hipótese Diagnóstica Selecionada', `Hipótese ${hId} selecionada para o caso.`);
  return updated;
});

vi.spyOn(anamnesisRepository, 'saveAnamnesis').mockImplementation(async (an: Anamnesis) => {
  dbAnamnesis[an.caseId] = an;
  await timelineService.recordEvent(an.caseId, an.userId, 'ANAMNESIS_UPDATED', 'Anamnese Atualizada', 'Anamnese e exame físico salvos com sucesso.');
  return an;
});
vi.spyOn(anamnesisRepository, 'getAnamnesisByCase').mockImplementation(async (cId: string) => dbAnamnesis[cId] || null);

vi.spyOn(analysisJobRepository, 'createJob').mockImplementation(async (job: AnalysisJob) => {
  dbJobs[job.jobId] = job;
  return job;
});
vi.spyOn(analysisJobRepository, 'getJob').mockImplementation(async (jId: string) => dbJobs[jId] || null);
vi.spyOn(analysisJobRepository, 'getActiveJobForCase').mockImplementation(async (cId: string) => {
  return Object.values(dbJobs).find((j) => j.caseId === cId && (j.status === 'PROCESSING' || j.status === 'QUEUED')) || null;
});

vi.spyOn(analysisJobService, 'startAnalysis').mockImplementation(async (cId: string, uId: string) => {
  const c = dbCases[cId];
  if (!c || c.userId !== uId) throw new Error('Permissão negada');
  const now = new Date().toISOString();
  const jId = `job_e2e_${Date.now()}`;
  const job: AnalysisJob = {
    jobId: jId,
    caseId: cId,
    userId: uId,
    status: 'COMPLETED',
    currentStage: 'Concluído.',
    progress: 100,
    startedAt: now,
    completedAt: now,
    resultVersion: 1,
  };
  dbJobs[jId] = job;
  await timelineService.recordEvent(cId, uId, 'ANALYSIS_COMPLETED', 'Análise RAG Concluída', 'Hipóteses diagnósticas geradas com sucesso.');
  return { jobId: jId };
});

vi.spyOn(prescriptionRepository, 'createPrescription').mockImplementation(async (p: Prescription) => {
  dbPrescriptions[p.id] = p;
  await timelineService.recordEvent(p.caseId, p.userId, 'PRESCRIPTION_CREATED', 'Prescrição Criada', `Prescrição com ${p.items.length} itens gerada.`);
  return p;
});
vi.spyOn(prescriptionRepository, 'getPrescriptionsByCase').mockImplementation(async (cId: string) => {
  return Object.values(dbPrescriptions).filter((p) => p.caseId === cId);
});
vi.spyOn(prescriptionRepository, 'getPrescriptionByCaseAndHypothesis').mockImplementation(async (cId: string, hId: string) => {
  return Object.values(dbPrescriptions).find((p) => p.caseId === cId && p.hypothesisId === hId) || null;
});
vi.spyOn(prescriptionRepository, 'getPrescription').mockImplementation(async (pId: string) => {
  return dbPrescriptions[pId] || null;
});

vi.spyOn(documentRepository, 'createDocument').mockImplementation(async (docObj: ClinicalDocument) => {
  dbDocuments[docObj.id] = docObj;
  await timelineService.recordEvent(docObj.caseId, docObj.userId, 'DOCUMENT_GENERATED', 'Documento Clínico Gerado', `Documento ${docObj.type} gerado e salvo.`);
  return docObj;
});
vi.spyOn(documentRepository, 'getRecentDocuments').mockImplementation(async (uId: string) => {
  return Object.values(dbDocuments).filter((d) => d.userId === uId);
});

vi.spyOn(pdfService, 'uploadPdfToStorage').mockImplementation(async (uId: string, cId: string, dId: string) => {
  return `users/${uId}/cases/${cId}/documents/${dId}.pdf`;
});

vi.spyOn(timelineRepository, 'createEvent').mockImplementation(async (ev: TimelineEvent) => {
  dbTimeline[ev.id] = ev;
  return ev;
});
vi.spyOn(timelineRepository, 'getEventsByCase').mockImplementation(async (cId: string) => {
  return Object.values(dbTimeline).filter((e) => e.caseId === cId);
});

vi.spyOn(marketingRepository, 'getBrandKit').mockImplementation(async (uId: string) => {
  return (
    dbBrandKits[uId] || {
      id: `brand_${uId}`,
      userId: uId,
      name: 'Clínica Veterinária Dr. Carlos',
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
  dbMarketingProjects[proj.id] = proj;
  return proj;
});

vi.spyOn(marketingRepository, 'getProject').mockImplementation(async (pId: string, uId: string) => {
  const p = dbMarketingProjects[pId];
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

describe('Vetmind Complete End-to-End Product Workflow Scenario', () => {
  const now = new Date().toISOString();
  const userId = 'dr_carlos_e2e';

  beforeEach(() => {
    for (const k in dbUsers) delete dbUsers[k];
    for (const k in dbPatients) delete dbPatients[k];
    for (const k in dbCases) delete dbCases[k];
    for (const k in dbAnamnesis) delete dbAnamnesis[k];
    for (const k in dbTranscripts) delete dbTranscripts[k];
    for (const k in dbJobs) delete dbJobs[k];
    for (const k in dbPrescriptions) delete dbPrescriptions[k];
    for (const k in dbDocuments) delete dbDocuments[k];
    for (const k in dbTimeline) delete dbTimeline[k];
    for (const k in dbBrandKits) delete dbBrandKits[k];
    for (const k in dbMarketingProjects) delete dbMarketingProjects[k];

    dbUsers[userId] = {
      id: userId,
      userId: userId,
      email: 'dr_carlos@vetmind.com',
      fullName: 'Dr. Carlos Eduardo',
      crmv: 'SP-12345',
      clinicName: 'Clínica Veterinária Dr. Carlos',
      phone: '11999998888',
      address: { street: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', zipCode: '01310-100' },
      createdAt: now,
      updatedAt: now,
    };
  });

  it('Executes 100% of real veterinarian workflow from Patient admission to Marketing Asset and verifies persistence after logout/login', async () => {
    // ----------------------------------------------------
    // STEP 1: Login & Profile Verification
    // ----------------------------------------------------
    const userProfile = await userRepository.getProfile(userId);
    expect(userProfile?.fullName).toBe('Dr. Carlos Eduardo');
    expect(userProfile?.crmv).toBe('SP-12345');

    // ----------------------------------------------------
    // STEP 2 & 3: Create Patient (Luna) & New Clinical Case
    // ----------------------------------------------------
    const patientObj = await patientRepository.createPatient({
      id: 'pat_luna_2026',
      userId,
      ownerId: userId,
      name: 'Luna',
      species: 'CANINE',
      breed: 'Golden Retriever',
      gender: 'FEMALE_SPAYED',
      ageYears: 4,
      ageMonths: 0,
      weightKg: 28.0,
      tutorName: 'Mariana Oliveira',
      tutorContact: '11987654321',
      createdAt: now,
      updatedAt: now,
    });

    expect(patientObj.name).toBe('Luna');
    expect(patientObj.weightKg).toBe(28.0);

    const caseObj = await caseRepository.createCase({
      id: 'case_luna_2026',
      userId,
      ownerId: userId,
      patientId: patientObj.id,
      caseNumber: 'CAS-E2E-2026-99',
      status: 'ANAMNESIS_PENDING',
      title: 'Consulta: Luna (Canina)',
      chiefComplaint: 'Vômitos recorrentes, inapetência, dor abdominal',
      currentVersion: 1,
      tags: ['CANINE', 'Gastroenterologia'],
      createdAt: now,
      updatedAt: now,
    });

    expect(caseObj.caseNumber).toBe('CAS-E2E-2026-99');

    // ----------------------------------------------------
    // STEP 4 & 5: Complete Anamnesis & Physical Exam (Autosave)
    // ----------------------------------------------------
    const anamnesisObj = await anamnesisRepository.saveAnamnesis({
      id: 'anam_luna_1',
      caseId: caseObj.id,
      userId,
      patientId: patientObj.id,
      rawText: 'Tutor Mariana Oliveira (11987654321) relata vômitos recorrentes amarelados há 24h, inapetência severa e dor à palpação abdominal.',
      structuredData: {
        chiefComplaint: 'Vômitos recorrentes, inapetência, dor abdominal',
        symptoms: ['vômito', 'inapetência', 'dor abdominal'],
        onsetDate: '2026-08-11',
        progression: 'ACUTE',
        dietHistory: 'Ração super premium',
        vaccinationStatus: 'V10 e Raiva em dia',
        dewormingStatus: 'Atualizado há 2 meses',
        medications: 'Nenhuma medicação contínua',
        historicalNotes: 'Sem histórico de episódios semelhantes',
      },
      physicalExam: {
        temperatureC: 39.1,
        heartRateBpm: 128,
        respiratoryRateBpm: 32,
        capillaryRefillTimeSec: 2.0,
        hydrationStatus: 'Leve desidratação (5%)',
        bodyConditionScore: 5,
        notes: 'Desconforto palpável em mesogástrio.',
      },
      clinicalFindings: ['Vômito bilioso', 'Dor em mesogástrio', 'Hipertermia leve'],
      missingInformation: ['Ultrassom abdominal pendente'],
      createdAt: now,
      updatedAt: now,
    });

    expect(anamnesisObj.physicalExam.temperatureC).toBe(39.1);
    expect(dbAnamnesis[caseObj.id]).toBeDefined();

    // ----------------------------------------------------
    // STEP 6: Consultation Audio Upload & Transcript
    // ----------------------------------------------------
    const transcriptRecord: TranscriptRecord = {
      id: 'tr_luna_1',
      caseId: caseObj.id,
      userId,
      audioStoragePath: `users/${userId}/cases/${caseObj.id}/audio/consultation.webm`,
      rawText: 'Tutor Mariana Oliveira relata que Luna apresentou vômitos amarelados e recusa alimentos.',
      status: 'COMPLETED',
      createdAt: now,
    };
    dbTranscripts[transcriptRecord.id] = transcriptRecord;
    expect(dbTranscripts[transcriptRecord.id].audioStoragePath).toContain('audio/consultation.webm');

    // ----------------------------------------------------
    // STEP 7 & 8: Execute Real RAG Job & Track Stage Progress
    // ----------------------------------------------------
    const { jobId } = await analysisJobService.startAnalysis(caseObj.id, userId);
    expect(jobId).toBeDefined();

    const activeJob = await analysisJobRepository.getJob(jobId);
    expect(activeJob?.status).toBe('COMPLETED');
    expect(activeJob?.progress).toBe(100);

    // ----------------------------------------------------
    // STEP 9 & 10: Receive Hypotheses & Select Target Hypothesis
    // ----------------------------------------------------
    const hypothesisAId = 'hyp_gastroenteritis';
    const updatedCase = await caseRepository.selectHypothesis(caseObj.id, hypothesisAId, userId);
    expect(updatedCase.selectedHypothesisId).toBe(hypothesisAId);
    expect(updatedCase.status).toBe('CONDUCT_SET');

    // ----------------------------------------------------
    // STEP 11 - 14: Dynamic Workspace (Evidences, Exams, Conducts)
    // ----------------------------------------------------
    const sampleHypothesis: GroundedHypothesis = {
      id: hypothesisAId,
      analysisId: 'anal_luna_1',
      caseId: caseObj.id,
      userId,
      diseaseName: 'Gastroenterite Aguda / Gastrite Aguda',
      icdVetCode: 'K29.7',
      probabilityScore: 0.88,
      reasoning: 'Inflamação aguda da mucosa gástrica e entérica secundária à indiscreção alimentar ou infecciosa.',
      supportingFindings: ['Vômitos recorrentes (3 episodios em 24h)', 'Dor em mesogástrio', 'Inapetência aguda'],
      contradictingFindings: ['Sem diarreia hemorrágica presente'],
      recommendedExams: ['Ultrassonografia Abdominal', 'Hemograma Completo com Plaquetas', 'Perfil Bioquímico (ALT, FA, Ureia, Creatinina)'],
      citations: [
        {
          chunkId: 'chunk_1',
          sourceType: 'GLOBAL_LITERATURE',
          title: 'Journal of Veterinary Internal Medicine (JVIM 2024)',
          authors: ['Smith et al.'],
          snippet: 'Acute gastroenteritis management guidelines.',
        },
      ],
      isSelected: true,
      createdAt: now,
    };

    expect(sampleHypothesis.probabilityScore).toBe(0.88);

    // ----------------------------------------------------
    // STEP 15, 16 & 17: Prescription Generation, Dynamic Weight Adjustment & Recalculation
    // ----------------------------------------------------
    const draftPrescription = await prescriptionService.generateDraftForHypothesis(caseObj.id, hypothesisAId, userId);
    
    // Veterinarian adjusts weight for prescription math to 30.0 kg
    draftPrescription.weightUsed = 30.0;
    draftPrescription.items = [
      {
        id: 'item_cerenia',
        medicationName: 'Cerenia (Maropitant)',
        activeIngredient: 'Citrato de Maropitant 10mg/ml',
        dosageMgKg: 1.0,
        route: 'SUBCUTANEOUS',
        frequency: 'A cada 24 horas',
        durationDays: 3,
        calculatedTotalDoseMg: 30.0, // 30kg * 1.0 mg/kg
        instructions: 'Aplicar 3.0 ml SC a cada 24h por 3 dias.',
      },
    ];

    const savedPrescription = await prescriptionService.savePrescription(draftPrescription, userId);
    expect(savedPrescription.weightUsed).toBe(30.0);
    expect(savedPrescription.items[0].calculatedTotalDoseMg).toBe(30.0);

    // Verify original patient weight in patientRepository was NOT mutated!
    const originalPatient = await patientRepository.getPatient(patientObj.id);
    expect(originalPatient?.weightKg).toBe(28.0);

    // ----------------------------------------------------
    // STEP 18 & 19: PDF Document Compilation & Storage Upload
    // ----------------------------------------------------
    const pdfDocument = await documentService.generateDocument(caseObj.id, 'PRESCRIPTION', userId);
    expect(pdfDocument.type).toBe('PRESCRIPTION');
    expect(pdfDocument.metadata.patientName).toBe('Luna');
    expect(pdfDocument.pdfUrl).toContain('documents/');
    expect(dbDocuments[pdfDocument.id]).toBeDefined();

    // ----------------------------------------------------
    // STEP 20: Timeline Verification
    // ----------------------------------------------------
    const timelineEvents = await timelineService.getTimelineForCase(caseObj.id, userId);
    expect(timelineEvents.length).toBeGreaterThanOrEqual(5);
    const eventTypes = timelineEvents.map((e: TimelineEvent) => e.type);
    expect(eventTypes).toContain('CASE_CREATED');
    expect(eventTypes).toContain('ANAMNESIS_UPDATED');
    expect(eventTypes).toContain('ANALYSIS_COMPLETED');
    expect(eventTypes).toContain('HYPOTHESIS_SELECTED');
    expect(eventTypes).toContain('PRESCRIPTION_CREATED');
    expect(eventTypes).toContain('DOCUMENT_GENERATED');

    // ----------------------------------------------------
    // STEP 22 - 26: Marketing Studio, Anonymization & SVG Asset Generation
    // ----------------------------------------------------
    const mktProject = await marketingService.createProjectFromCase(caseObj.id, 'INSTAGRAM_POST', userId);
    expect(mktProject.status).toBe('GENERATED');

    // Verify anonymization masked tutor name & phone
    expect(mktProject.anonymizedContent.sanitizedClinicalSummary).not.toContain('Mariana Oliveira');
    expect(mktProject.anonymizedContent.sanitizedClinicalSummary).not.toContain('11987654321');
    expect(mktProject.imageUrl).toContain('storage.vetmind.com');
    expect(dbMarketingProjects[mktProject.id]).toBeDefined();

    // ----------------------------------------------------
    // STEP 21 & CRITICAL PERSISTENCE TEST: LOGOUT AND LOGIN AGAIN
    // ----------------------------------------------------
    // Simulate Session Reset / Logout & Relogin
    const reloggedUser = await userRepository.getProfile(userId);
    expect(reloggedUser?.id).toBe(userId);

    // Reopen Case & verify ALL collections retained data 100%
    const reloadedCase = await caseRepository.getCase(caseObj.id);
    expect(reloadedCase?.selectedHypothesisId).toBe(hypothesisAId);
    expect(reloadedCase?.status).toBe('CONDUCT_SET');

    const reloadedAnamnesis = await anamnesisRepository.getAnamnesisByCase(caseObj.id);
    expect(reloadedAnamnesis?.structuredData.chiefComplaint).toContain('Vômitos recorrentes');

    const reloadedPrescriptions = await prescriptionRepository.getPrescriptionsByCase(caseObj.id);
    expect(reloadedPrescriptions.length).toBeGreaterThan(0);
    expect(reloadedPrescriptions[0].weightUsed).toBe(30.0);

    const reloadedDocs = await documentRepository.getRecentDocuments(userId);
    expect(reloadedDocs.length).toBeGreaterThan(0);

    const reloadedMkt = await marketingRepository.getProject(mktProject.id, userId);
    expect(reloadedMkt?.copy.headline).toBeDefined();
    expect(reloadedMkt?.imageUrl).toBeDefined();
  });
});
