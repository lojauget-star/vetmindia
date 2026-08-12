import { StructuredAnalysisResult, EvidenceItem } from '@/types/rag.types';

export class CitationResolver {
  /**
   * Resolves citations from grounded hypotheses into typed EvidenceItem objects for Firestore persistence
   */
  resolve(result: StructuredAnalysisResult): EvidenceItem[] {
    const evidenceItems: EvidenceItem[] = [];
    const now = new Date().toISOString();

    result.hypotheses.forEach((hyp) => {
      (hyp.citations || []).forEach((cit, index) => {
        evidenceItems.push({
          id: `ev_${Date.now()}_${hyp.id}_${index}`,
          hypothesisId: hyp.id,
          caseId: result.caseId,
          userId: result.userId,
          literatureChunkId: cit.chunkId,
          paperTitle: cit.title,
          authors: cit.authors || [],
          publicationYear: cit.publicationYear || new Date().getFullYear(),
          journal: cit.journal || 'Literatura Veterinária',
          doi: cit.doi,
          snippet: cit.snippet,
          relevanceScore: 0.95,
          createdAt: now,
        });
      });
    });

    return evidenceItems;
  }
}

export const citationResolver = new CitationResolver();
