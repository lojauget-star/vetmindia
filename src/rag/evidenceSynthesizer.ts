import { LiteratureChunk } from '@/types/rag.types';

export class EvidenceSynthesizer {
  /**
   * Sanitizes text against prompt injection.
   * Strips out XML tag escapes or instruction overrides, treating document text purely as DATA.
   */
  private sanitizeDocumentContent(text: string): string {
    if (!text) return '';
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/System:/gi, 'DocContent:')
      .replace(/Ignore previous instructions/gi, '[Texto ignorado do documento]');
  }

  /**
   * Synthesizes reranked chunks into safe XML context blocks.
   * Enforces prompt injection protection: PDF content is treated as DATA, never instructions.
   */
  synthesize(chunks: LiteratureChunk[]): string {
    if (chunks.length === 0) {
      return '<retrieved_evidence_data>\nNenhuma literatura externa encontrada. Realizar raciocínio clínico baseado exclusivamente nos dados do caso.\n</retrieved_evidence_data>';
    }

    const blocks = chunks.map((chunk) => {
      const safeText = this.sanitizeDocumentContent(chunk.text);
      return `
<evidence_chunk chunk_id="${chunk.id}" source_type="${chunk.sourceType}" title="${chunk.title}">
  <authors>${(chunk.authors || []).join(', ')}</authors>
  <year>${chunk.publicationYear || 'N/A'}</year>
  <journal>${chunk.journal || 'N/A'}</journal>
  <doi>${chunk.doi || 'N/A'}</doi>
  <text_content>
${safeText}
  </text_content>
</evidence_chunk>`;
    });

    return `<retrieved_evidence_data>\n${blocks.join('\n')}\n</retrieved_evidence_data>`;
  }
}

export const evidenceSynthesizer = new EvidenceSynthesizer();
