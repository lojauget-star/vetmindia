import { LiteratureChunk } from '@/types/rag.types';

export class Reranker {
  /**
   * Reranks candidate chunks by evaluating clinical relevance to the patient species and symptoms.
   */
  rerank(
    chunks: LiteratureChunk[],
    species: string,
    chiefComplaint: string,
    symptoms: string[]
  ): LiteratureChunk[] {
    const normSpecies = species.toLowerCase();
    const normComplaint = chiefComplaint.toLowerCase();

    return chunks
      .map((chunk) => {
        let score = 1.0;
        const text = chunk.text.toLowerCase();

        // Species match boost
        if (text.includes(normSpecies) || (chunk.keywords && chunk.keywords.includes(normSpecies))) {
          score += 0.5;
        }

        // Chief complaint match boost
        if (text.includes(normComplaint)) {
          score += 0.4;
        }

        // Symptoms overlap boost
        for (const s of symptoms) {
          if (text.includes(s.toLowerCase())) {
            score += 0.2;
          }
        }

        // Prefer peer-reviewed global literature or verified guidelines
        if (chunk.sourceType === 'GLOBAL_LITERATURE') {
          score += 0.1;
        }

        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((item) => item.chunk);
  }
}

export const reranker = new Reranker();
