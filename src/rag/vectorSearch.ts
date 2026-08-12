import { LiteratureChunk } from '@/types/rag.types';

export class VectorSearch {
  /**
   * Computes cosine similarity between two 768-dim float vectors.
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) {
      return 0;
    }
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dot += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Executes vector similarity search against candidate chunks.
   * Enforces Multi-Tenant Isolation: Ignores chunks where ownerId is set and does not match requesting userId.
   */
  search(
    queryEmbedding: number[],
    candidateChunks: LiteratureChunk[],
    userId: string,
    topK = 5
  ): { chunk: LiteratureChunk; score: number }[] {
    const scored = candidateChunks
      .filter((chunk) => {
        // Global literature is accessible to all
        if (chunk.sourceType === 'GLOBAL_LITERATURE') return true;
        // Private PDF is accessible ONLY to the document owner
        if (chunk.sourceType === 'PRIVATE_PDF') return chunk.ownerId === userId;
        return false;
      })
      .map((chunk) => {
        const score = this.cosineSimilarity(queryEmbedding, chunk.embedding || []);
        return { chunk, score };
      })
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }
}

export const vectorSearch = new VectorSearch();
