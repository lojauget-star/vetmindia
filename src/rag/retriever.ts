import { LiteratureChunk } from '@/types/rag.types';
import { literatureRepository } from '@/repositories/literature.repository';
import { vectorSearch } from './vectorSearch';
import { keywordSearch } from './keywordSearch';

export class Retriever {
  /**
   * Retrieves relevant literature and private PDF chunks using hybrid Search (Vector + Keyword)
   * Enforces strict multi-tenant isolation: Private PDFs are ONLY returned if chunk.ownerId == userId.
   */
  async retrieve(
    queryEmbedding: number[],
    queryKeywords: string[],
    userId: string,
    topK = 5
  ): Promise<LiteratureChunk[]> {
    const candidateChunks = await literatureRepository.getAccessibleChunks(userId);

    const vectorResults = vectorSearch.search(queryEmbedding, candidateChunks, userId, topK * 2);
    const keywordResults = keywordSearch.search(queryKeywords, candidateChunks, userId, topK * 2);

    // Reciprocal Rank Fusion (RRF) / Hybrid merge
    const scoreMap = new Map<string, { chunk: LiteratureChunk; combinedScore: number }>();

    vectorResults.forEach(({ chunk, score }) => {
      scoreMap.set(chunk.id, { chunk, combinedScore: score * 0.7 });
    });

    keywordResults.forEach(({ chunk, score }) => {
      const existing = scoreMap.get(chunk.id);
      if (existing) {
        existing.combinedScore += score * 0.3;
      } else {
        scoreMap.set(chunk.id, { chunk, combinedScore: score * 0.3 });
      }
    });

    const merged = Array.from(scoreMap.values())
      .sort((a, b) => b.combinedScore - a.combinedScore)
      .slice(0, topK)
      .map((item) => item.chunk);

    return merged;
  }
}

export const retriever = new Retriever();
