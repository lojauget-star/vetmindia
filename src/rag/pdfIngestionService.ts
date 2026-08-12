import { literatureRepository } from '@/repositories/literature.repository';
import { LiteratureChunk } from '@/types/rag.types';

export interface PdfIngestionResult {
  literatureId: string;
  filename: string;
  chunksCreated: number;
  ownerId: string;
}

export class PdfIngestionService {
  /**
   * Ingests a user PDF document:
   * upload -> extract text -> metadata -> chunk -> embedding -> indexing -> retrieval
   * Associated strictly with ownerId for private PDFs.
   */
  async ingestPdf(
    ownerId: string,
    fileBuffer: ArrayBuffer | string,
    filename: string,
    title?: string,
    authors: string[] = ['Autor Desconhecido']
  ): Promise<PdfIngestionResult> {
    const literatureId = `pdf_${Date.now()}`;
    const docTitle = title || filename.replace('.pdf', '');

    // 1. Text Extraction
    const extractedText = typeof fileBuffer === 'string'
      ? fileBuffer
      : `Conteúdo extraído do documento PDF ${filename}. Tratado como texto de dados clínicos sem privilégios de instrução.`;

    // 2. Chunking (approx 500 characters per chunk)
    const chunkSize = 500;
    const textChunks: string[] = [];
    for (let i = 0; i < extractedText.length; i += chunkSize) {
      textChunks.push(extractedText.substring(i, i + chunkSize));
    }
    if (textChunks.length === 0) textChunks.push(extractedText);

    // 3. Generate Embeddings & Index in Firestore
    for (let index = 0; index < textChunks.length; index++) {
      const chunkText = textChunks[index];
      const chunkId = `chk_${literatureId}_${index}`;

      // Mock 768-dim embedding generation for text-embedding-004
      const mockEmbedding = new Array(768).fill(0).map((_, i) => Math.sin(index + i) * 0.1);

      const chunkObj: LiteratureChunk = {
        id: chunkId,
        literatureId,
        chunkIndex: index,
        text: chunkText,
        embedding: mockEmbedding,
        keywords: [filename.toLowerCase(), docTitle.toLowerCase(), 'pdf'],
        sourceType: 'PRIVATE_PDF',
        ownerId, // Strict Tenant Owner Assignment
        title: docTitle,
        authors,
        publicationYear: new Date().getFullYear(),
      };

      await literatureRepository.saveChunk(chunkObj);
    }

    return {
      literatureId,
      filename,
      chunksCreated: textChunks.length,
      ownerId,
    };
  }
}

export const pdfIngestionService = new PdfIngestionService();
