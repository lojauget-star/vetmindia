import { LiteratureChunk } from '@/types/rag.types';

export class KeywordSearch {
  /**
   * Performs keyword / BM25 fallback matching against literature text and metadata keywords.
   */
  search(
    keywords: string[],
    candidateChunks: LiteratureChunk[],
    userId: string,
    topK = 5
  ): { chunk: LiteratureChunk; score: number }[] {
    // Tokenize multi-word phrases into individual search terms
    const normalizedKeywords = keywords
      .flatMap((k) => k.toLowerCase().split(/\s+/))
      .map((k) => k.trim())
      .filter((k) => k.length > 2); // Ignore short prepositions

    if (normalizedKeywords.length === 0) return [];

    const scored = candidateChunks
      .filter((chunk) => {
        if (chunk.sourceType === 'GLOBAL_LITERATURE') return true;
        if (chunk.sourceType === 'PRIVATE_PDF') return chunk.ownerId === userId;
        return false;
      })
      .map((chunk) => {
        const text = (chunk.text + ' ' + (chunk.keywords || []).join(' ') + ' ' + chunk.title).toLowerCase();
        let matches = 0;
        for (const kw of normalizedKeywords) {
          if (text.includes(kw)) {
            matches += 1;
          }
        }
        const score = matches / normalizedKeywords.length;
        return { chunk, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score);

    return scored.slice(0, topK);
  }
}

export const keywordSearch = new KeywordSearch();
