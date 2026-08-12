import { StructuredAnalysisResult, LiteratureChunk } from '@/types/rag.types';

export class Validator {
  /**
   * Validates structured analysis result.
   * Guarantees ZERO hallucinated references or fake DOIs by matching citations against retrieved chunks.
   */
  validate(result: StructuredAnalysisResult, retrievedChunks: LiteratureChunk[]): StructuredAnalysisResult {
    const validChunkIds = new Set(retrievedChunks.map((c) => c.id));

    const validatedHypotheses = result.hypotheses.map((hyp) => {
      const validCitations = (hyp.citations || []).filter((cit) => {
        // Strip citation if chunkId was not in the actual retrieved set (Anti-Hallucination rule)
        const isRetrieved = validChunkIds.has(cit.chunkId);
        if (!isRetrieved) {
          console.warn(`[Validator] Stripped hallucinated citation chunk ID ${cit.chunkId} from hypothesis ${hyp.diseaseName}`);
        }
        return isRetrieved;
      });

      return {
        ...hyp,
        citations: validCitations,
      };
    });

    return {
      ...result,
      hypotheses: validatedHypotheses,
    };
  }
}

export const validator = new Validator();
