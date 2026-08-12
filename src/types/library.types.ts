export type LibraryCategory =
  | 'GLOBAL_LITERATURE'
  | 'USER_PDFS'
  | 'GUIDELINES'
  | 'TEXTBOOKS'
  | 'DOCUMENTS'
  | 'RELEVANT_CASES'
  | 'FAVORITES';

export interface LibraryItem {
  id: string;
  userId?: string; // Optional if global literature
  category: LibraryCategory;
  title: string;
  authorOrSource: string;
  year?: number;
  doi?: string;
  url?: string;
  snippet?: string;
  tags: string[];
  isFavorite: boolean;
  isGlobal: boolean;
  createdAt: string;
}
