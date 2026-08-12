import { libraryRepository } from '@/repositories/library.repository';
import { documentRepository } from '@/repositories/document.repository';
import { caseRepository } from '@/repositories/case.repository';
import { LibraryItem, LibraryCategory } from '@/types/library.types';

export class LibraryService {
  /**
   * Fetches organized library items across all categories for user
   */
  async getFullLibrary(userId: string): Promise<Record<LibraryCategory, LibraryItem[]>> {
    let items = await libraryRepository.getLibraryContent(userId);

    // If initial load and empty, seed default peer-reviewed global literature and guidelines
    if (items.length === 0) {
      await this.seedDefaultGlobalLiterature();
      items = await libraryRepository.getLibraryContent(userId);
    }

    // Dynamic Section 1: User Documents
    const userDocs = await documentRepository.getDocumentsByUser(userId);
    const docItems: LibraryItem[] = userDocs.map((d) => ({
      id: `lib_doc_${d.id}`,
      userId,
      category: 'DOCUMENTS',
      title: d.title,
      authorOrSource: `Dr(a). ${d.metadata.vetName}`,
      year: new Date(d.createdAt).getFullYear(),
      url: d.pdfUrl,
      snippet: `Documento clínico oficial (${d.type}) do paciente ${d.metadata.patientName}.`,
      tags: [d.type.toLowerCase(), d.metadata.species.toLowerCase()],
      isFavorite: false,
      isGlobal: false,
      createdAt: d.createdAt,
    }));

    // Dynamic Section 2: Relevant Cases
    const userCases = await caseRepository.getCasesByUser(userId);
    const caseItems: LibraryItem[] = userCases.map((c) => ({
      id: `lib_case_${c.id}`,
      userId,
      category: 'RELEVANT_CASES',
      title: c.title || `Atendimento N.º ${c.caseNumber}`,
      authorOrSource: 'Prontuário Vetmind',
      year: new Date(c.createdAt).getFullYear(),
      snippet: `Queixa principal: ${c.chiefComplaint || 'Atendimento sob investigação'}. Status: ${c.status}`,
      tags: ['prontuário', c.status.toLowerCase()],
      isFavorite: false,
      isGlobal: false,
      createdAt: c.createdAt,
    }));

    const allCombined = [...items, ...docItems, ...caseItems];

    return {
      GLOBAL_LITERATURE: allCombined.filter((i) => i.category === 'GLOBAL_LITERATURE'),
      USER_PDFS: allCombined.filter((i) => i.category === 'USER_PDFS'),
      GUIDELINES: allCombined.filter((i) => i.category === 'GUIDELINES'),
      TEXTBOOKS: allCombined.filter((i) => i.category === 'TEXTBOOKS'),
      DOCUMENTS: allCombined.filter((i) => i.category === 'DOCUMENTS'),
      RELEVANT_CASES: allCombined.filter((i) => i.category === 'RELEVANT_CASES'),
      FAVORITES: allCombined.filter((i) => i.isFavorite),
    };
  }

  async toggleFavorite(itemId: string, userId: string, isFavorite: boolean): Promise<LibraryItem> {
    return await libraryRepository.toggleFavorite(itemId, userId, isFavorite);
  }

  private async seedDefaultGlobalLiterature(): Promise<void> {
    const defaults: LibraryItem[] = [
      {
        id: 'lit_global_1',
        category: 'GLOBAL_LITERATURE',
        title: 'WSAVA World Small Animal Veterinary Association Guidelines for Gastroenterology',
        authorOrSource: 'WSAVA GI Standardization Group',
        year: 2023,
        doi: '10.1111/jsap.13450',
        snippet: 'Consenso internacional de estadiamento e diagnóstico diferencial de gastroenteropatias felinas e caninas.',
        tags: ['wsava', 'gastroenterologia', 'guideline'],
        isFavorite: true,
        isGlobal: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lit_textbook_1',
        category: 'TEXTBOOKS',
        title: 'Ettinger Textbook of Veterinary Internal Medicine - 9th Edition',
        authorOrSource: 'Stephen J. Ettinger, Edward C. Feldman',
        year: 2024,
        snippet: 'Tratado de medicina interna veterinária com capítulos focados em condutas obstrutivas e fluidoterapia.',
        tags: ['ettinger', 'medicina interna', 'livro'],
        isFavorite: false,
        isGlobal: true,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'lit_guideline_1',
        category: 'GUIDELINES',
        title: 'AAHA Acute Abdomen Evaluation & Fluid Therapy Guidelines',
        authorOrSource: 'American Animal Hospital Association',
        year: 2024,
        doi: '10.5326/JAAHA-MS-7201',
        snippet: 'Diretrizes de emergência para fluidoterapia de reposição em pacientes hipotensos e desidratados.',
        tags: ['aaha', 'fluidoterapia', 'emergencia'],
        isFavorite: false,
        isGlobal: true,
        createdAt: new Date().toISOString(),
      },
    ];

    for (const d of defaults) {
      await libraryRepository.createItem(d);
    }
  }
}

export const libraryService = new LibraryService();
