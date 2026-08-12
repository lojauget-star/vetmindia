import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores/useAuthStore';
import { libraryService } from '@/services/library.service';
import { LibraryItem, LibraryCategory } from '@/types/library.types';
import { BookOpen, Search, Star, FileText, Bookmark, Folder, ExternalLink } from 'lucide-react';

export const LibraryPage: React.FC = () => {
  const { user } = useAuthStore();
  const [libraryData, setLibraryData] = useState<Record<LibraryCategory, LibraryItem[]> | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('GLOBAL_LITERATURE');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadLibrary() {
      if (!user) return;
      setIsLoading(true);
      try {
        const full = await libraryService.getFullLibrary(user.uid);
        setLibraryData(full);
      } catch (err) {
        console.error('Failed to load library:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadLibrary();
  }, [user]);

  const handleToggleFavorite = async (item: LibraryItem) => {
    if (!user || !libraryData) return;
    try {
      const updated = await libraryService.toggleFavorite(item.id, user.uid, !item.isFavorite);
      const reloaded = await libraryService.getFullLibrary(user.uid);
      setLibraryData(reloaded);
    } catch (err: any) {
      alert(`Erro ao atualizar favoritos: ${err.message}`);
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando biblioteca de literatura veterinária e acervo..." />;
  }

  const currentCategoryKey = activeCategory as LibraryCategory;
  const currentItems = libraryData ? libraryData[currentCategoryKey] || [] : [];
  const filteredItems = currentItems.filter((i) =>
    searchQuery === '' ||
    i.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.authorOrSource.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (i.snippet && i.snippet.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-vet-text flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-clinical-blue" />
            Biblioteca Veterinária & Acervo Científico
          </h1>
          <p className="text-xs text-vet-secondary mt-1">
            Consulte literatura global, livros, diretrizes, PDFs próprios e prontuários históricos.
          </p>
        </div>

        <div className="w-full md:w-72">
          <Input
            placeholder="Buscar por título, autor, DOI..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-vet-secondary" />}
          />
        </div>
      </div>

      {/* Category Tabs */}
      <Tabs
        tabs={[
          { id: 'GLOBAL_LITERATURE', label: `Literatura Global (${libraryData?.GLOBAL_LITERATURE?.length || 0})`, icon: <BookOpen className="w-4 h-4" /> },
          { id: 'USER_PDFS', label: `PDFs Próprios (${libraryData?.USER_PDFS?.length || 0})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'GUIDELINES', label: `Guidelines (${libraryData?.GUIDELINES?.length || 0})`, icon: <Bookmark className="w-4 h-4" /> },
          { id: 'TEXTBOOKS', label: `Livros (${libraryData?.TEXTBOOKS?.length || 0})`, icon: <Folder className="w-4 h-4" /> },
          { id: 'DOCUMENTS', label: `Documentos (${libraryData?.DOCUMENTS?.length || 0})`, icon: <FileText className="w-4 h-4" /> },
          { id: 'RELEVANT_CASES', label: `Casos Relevantes (${libraryData?.RELEVANT_CASES?.length || 0})`, icon: <Folder className="w-4 h-4" /> },
          { id: 'FAVORITES', label: `Favoritos (${libraryData?.FAVORITES?.length || 0})`, icon: <Star className="w-4 h-4 text-amber-500" /> },
        ]}
        activeTab={activeCategory}
        onChange={setActiveCategory}
      />

      {/* Content Grid */}
      {filteredItems.length === 0 ? (
        <Card variant="paper" className="p-8 text-center">
          <BookOpen className="w-8 h-8 text-vet-secondary mx-auto mb-2" />
          <h3 className="text-sm font-bold text-vet-text">Nenhum item encontrado nesta categoria</h3>
          <p className="text-xs text-vet-secondary mt-1">Tente ajustar a busca por palavra-chave ou selecionar outra categoria.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} variant="default" className="flex flex-col justify-between p-4 space-y-3">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-bold text-vet-text leading-snug">{item.title}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleFavorite(item)}
                    className="text-amber-500 hover:text-amber-600 p-1"
                  >
                    <Star className={`w-4 h-4 ${item.isFavorite ? 'fill-amber-400' : ''}`} />
                  </Button>
                </div>

                <p className="text-xs text-vet-secondary mt-1">
                  <strong>Fonte / Autores:</strong> {item.authorOrSource} {item.year ? `(${item.year})` : ''}
                </p>

                {item.doi && (
                  <p className="text-[11px] font-mono text-clinical-blue mt-0.5">DOI: {item.doi}</p>
                )}

                {item.snippet && (
                  <p className="text-xs text-vet-text italic bg-vet-bg p-2 rounded mt-2 border-l-2 border-clinical-blue leading-relaxed">
                    "{item.snippet}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-vet-border-subtle text-xs">
                <div className="flex flex-wrap gap-1">
                  {item.tags.map((tag, idx) => (
                    <Badge key={idx} variant="neutral" size="sm">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                {item.url && (
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-clinical-blue font-bold hover:underline"
                  >
                    Acessar <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
