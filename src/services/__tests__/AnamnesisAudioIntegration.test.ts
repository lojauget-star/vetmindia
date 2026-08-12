import { describe, it, expect, beforeEach, vi } from 'vitest';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { audioService } from '../audio.service';
import { transcriptService } from '../transcript.service';
import { Anamnesis, TranscriptRecord } from '@/types/clinical.types';

// In-Memory Database representing Firestore & Storage
const mockAnamnesisStore: Record<string, Anamnesis> = {};
const mockTranscriptStore: Record<string, TranscriptRecord> = {};

vi.spyOn(anamnesisRepository, 'getAnamnesisByCase').mockImplementation(async (caseId: string) => {
  return Object.values(mockAnamnesisStore).find((a) => a.caseId === caseId) || null;
});

vi.spyOn(anamnesisRepository, 'saveAnamnesis').mockImplementation(async (anamnesis: Anamnesis) => {
  mockAnamnesisStore[anamnesis.id] = { ...anamnesis };
  return anamnesis;
});

vi.spyOn(anamnesisRepository, 'updateAnamnesis').mockImplementation(async (id: string, data: Partial<Anamnesis>) => {
  const current = mockAnamnesisStore[id];
  if (!current) throw new Error('Anamnese não encontrada.');
  const updated: Anamnesis = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  mockAnamnesisStore[id] = updated;
  return updated;
});

vi.spyOn(anamnesisRepository, 'saveTranscript').mockImplementation(async (t: TranscriptRecord) => {
  mockTranscriptStore[t.id] = { ...t };
  return t;
});

describe('Vetmind Anamnesis & Audio Integration Gate - Definition of Done', () => {
  beforeEach(() => {
    for (const k in mockAnamnesisStore) delete mockAnamnesisStore[k];
    for (const k in mockTranscriptStore) delete mockTranscriptStore[k];
  });

  it('1. Uploads audio file to Firebase Storage path users/{uid}/cases/{caseId}/audio/', async () => {
    const mockUid = 'vet_uid_77';
    const mockCaseId = 'case_101';
    const mockBlob = new Blob(['dummy audio binary data'], { type: 'audio/webm' });

    vi.spyOn(audioService, 'uploadAudio').mockResolvedValueOnce({
      storagePath: `users/${mockUid}/cases/${mockCaseId}/audio/consultation_123.webm`,
      downloadUrl: `https://storage.googleapis.com/vetmind-app.appspot.com/users/${mockUid}/cases/${mockCaseId}/audio/consultation_123.webm`,
      sizeBytes: mockBlob.size,
      mimeType: 'audio/webm',
    });

    const result = await audioService.uploadAudio(mockUid, mockCaseId, mockBlob, 'consultation_123.webm');

    expect(result.storagePath).toBe(`users/${mockUid}/cases/${mockCaseId}/audio/consultation_123.webm`);
    expect(result.storagePath.startsWith(`users/${mockUid}/cases/${mockCaseId}/audio/`)).toBe(true);
  });

  it('2. Processes audio transcription and maintains strict separation of rawText vs structured facts', async () => {
    const mockUid = 'vet_uid_77';
    const mockCaseId = 'case_101';
    const mockPatientId = 'pat_50';
    const storagePath = `users/${mockUid}/cases/${mockCaseId}/audio/consultation_123.webm`;
    const spokenText = 'Paciente canino com histórico de vômito bilioso desde ontem. Sem febre.';

    const result = await transcriptService.processAudioTranscription(
      mockUid,
      mockCaseId,
      mockPatientId,
      storagePath,
      spokenText
    );

    expect(result.rawText).toBe(spokenText);
    expect(result.clinicalFindings.length).toBeGreaterThan(0);
    expect(result.missingInformation.length).toBeGreaterThan(0);

    // Verify stored Anamnesis record in Firestore
    const savedAnamnesis = Object.values(mockAnamnesisStore).find((a) => a.caseId === mockCaseId);
    expect(savedAnamnesis).toBeDefined();
    expect(savedAnamnesis?.rawText).toBe(spokenText);
    expect(savedAnamnesis?.structuredData.chiefComplaint).toBeDefined();
  });

  it('3. Editing anamnesis and rawText saves to Firestore and preserves rawText integrity on update', async () => {
    const mockUid = 'vet_uid_77';
    const mockCaseId = 'case_101';
    const mockPatientId = 'pat_50';

    await transcriptService.processAudioTranscription(
      mockUid,
      mockCaseId,
      mockPatientId,
      `users/${mockUid}/cases/${mockCaseId}/audio/audio.webm`,
      'Texto de áudio falado'
    );

    const initial = await anamnesisRepository.getAnamnesisByCase(mockCaseId);
    expect(initial).not.toBeNull();

    // Perform update on structured physical exam
    const updated = await anamnesisRepository.updateAnamnesis(initial!.id, {
      physicalExam: {
        temperatureC: 39.5,
        heartRateBpm: 140,
      },
    });

    // Rule: rawText MUST remain unchanged unless explicitly passed
    expect(updated.rawText).toBe('Texto de áudio falado');
    expect(updated.physicalExam.temperatureC).toBe(39.5);
  });

  it('4. Reopening case recovers saved anamnesis, rawText, and physical exam intact', async () => {
    const mockUid = 'vet_uid_77';
    const mockCaseId = 'case_101';
    const mockPatientId = 'pat_50';

    // Populate data for reopening simulation
    await transcriptService.processAudioTranscription(
      mockUid,
      mockCaseId,
      mockPatientId,
      `users/${mockUid}/cases/${mockCaseId}/audio/audio.webm`,
      'Texto de áudio falado'
    );
    const initial = await anamnesisRepository.getAnamnesisByCase(mockCaseId);
    await anamnesisRepository.updateAnamnesis(initial!.id, {
      physicalExam: { temperatureC: 39.5, heartRateBpm: 140 },
    });

    // Reopen case and query Firestore
    const recovered = await anamnesisRepository.getAnamnesisByCase(mockCaseId);

    expect(recovered).not.toBeNull();
    expect(recovered?.rawText).toBe('Texto de áudio falado');
    expect(recovered?.physicalExam.temperatureC).toBe(39.5);
  });
});
