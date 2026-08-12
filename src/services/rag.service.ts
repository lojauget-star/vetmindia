import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { analysisRepository } from '@/repositories/analysis.repository';
import { retriever } from '@/rag/retriever';
import { reranker } from '@/rag/reranker';
import { evidenceSynthesizer } from '@/rag/evidenceSynthesizer';
import { hypothesisGenerator } from '@/rag/hypothesisGenerator';
import { validator } from '@/rag/validator';
import { citationResolver } from '@/rag/citationResolver';
import { geminiService } from '@/services/gemini.service';
import { StructuredAnalysisResult } from '@/types/rag.types';

export class RagService {
  /**
   * Executes the full 13-step RAG pipeline for a ClinicalCase:
   * ClinicalCase -> normalize -> extract facts -> findings -> missing info -> queries ->
   * keyword & vector retrieval -> metadata filtering -> reranking -> evidence synthesis ->
   * hypothesis generation -> validation -> structured output -> Firestore persistence.
   */
  async runAnalysisPipeline(caseId: string, userId: string): Promise<StructuredAnalysisResult> {
    // 1. Fetch ClinicalCase & Patient
    const clinicalCase = await caseRepository.getCase(caseId);
    if (!clinicalCase) throw new Error(`Caso clínico ${caseId} não encontrado.`);

    const patient = await patientRepository.getPatient(clinicalCase.patientId);
    if (!patient) throw new Error(`Paciente ${clinicalCase.patientId} não encontrado.`);

    // 2. Fetch Anamnesis
    let anamnesis = await anamnesisRepository.getAnamnesisByCase(caseId);
    if (!anamnesis) {
      // Fallback empty anamnesis if not yet created
      const now = new Date().toISOString();
      anamnesis = {
        id: `anam_fallback_${Date.now()}`,
        caseId,
        userId,
        patientId: patient.id,
        rawText: clinicalCase.chiefComplaint,
        structuredData: {
          chiefComplaint: clinicalCase.chiefComplaint,
          symptoms: [clinicalCase.chiefComplaint],
          onsetDate: now.split('T')[0],
          progression: 'ACUTE',
          dietHistory: '',
          vaccinationStatus: '',
          dewormingStatus: '',
          medications: '',
          historicalNotes: '',
        },
        physicalExam: {},
        clinicalFindings: [clinicalCase.chiefComplaint],
        missingInformation: ['Anamnesis detalhada pendente'],
        createdAt: now,
        updatedAt: now,
      };
    }

    // 3. Normalize & Extract Queries
    const species = patient.species;
    const symptoms = anamnesis.structuredData?.symptoms || [];
    const chiefComplaint = anamnesis.structuredData?.chiefComplaint || clinicalCase.chiefComplaint;

    const queryKeywords = [species, chiefComplaint, ...symptoms];
    // Generate 768-dim query embedding using Gemini text-embedding-004
    const queryText = `${species} ${chiefComplaint} ${symptoms.join(' ')}`;
    const queryEmbedding = await geminiService.generateEmbedding(queryText);

    // 4. Multi-source Retrieval (Keyword + Vector + Metadata Filtering)
    const retrievedChunks = await retriever.retrieve(queryEmbedding, queryKeywords, userId, 5);

    // 5. Reranking
    const rerankedChunks = reranker.rerank(retrievedChunks, species, chiefComplaint, symptoms);

    // 6. Evidence Synthesis with Prompt Injection Protection
    const evidenceXml = evidenceSynthesizer.synthesize(rerankedChunks);

    // 7. Grounded Hypothesis Generation
    const rawResult = await hypothesisGenerator.generate(
      clinicalCase,
      patient,
      anamnesis,
      rerankedChunks,
      evidenceXml
    );

    // 8. Validation (Zero Hallucinated Citations Rule)
    const validatedResult = validator.validate(rawResult, rerankedChunks);

    // 9. Citation Resolution into EvidenceItem records
    const resolvedEvidence = citationResolver.resolve(validatedResult);
    const finalResult: StructuredAnalysisResult = {
      ...validatedResult,
      evidence: resolvedEvidence,
    };

    // 10. Persist complete structured result in Firestore (analyses, hypotheses, evidence)
    await analysisRepository.saveAnalysisResult(finalResult);

    // 11. Update ClinicalCase status in Firestore
    await caseRepository.updateCase(caseId, {
      status: 'HYPOTHESES_GENERATED',
      latestAnalysisId: finalResult.analysisId,
    });

    return finalResult;
  }
}

export const ragService = new RagService();
