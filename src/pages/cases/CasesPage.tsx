import React, { useState, useEffect, useCallback } from 'react';
import { caseRepository } from '@/repositories/case.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { ClinicalCase, CaseStatus as StatusType } from '@/types/clinical.types';
import { CaseStatus } from '@/components/clinical/CaseStatus';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PlusCircle, Trash2, FolderKanban } from 'lucide-react';

export interface CasesPageProps {
  onSelectCase: (caseId: string) => void;
  onNewCase: () => void;
}

export const CasesPage: React.FC<CasesPageProps> = ({ onSelectCase, onNewCase }) => {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await caseRepository.getCasesByUser(user.uid);
      setCases(data);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar casos clínicos.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const handleDelete = async (caseId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !window.confirm('Tem certeza que deseja excluir este caso clínico?')) return;
    try {
      await caseRepository.deleteCase(caseId, user.uid);
      await fetchCases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredCases = cases.filter((c) => {
    const matchesFilter = activeFilter === 'ALL' || c.status === activeFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.chiefComplaint.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (isLoading) {
    return <LoadingState message="Carregando casos clínicos no Cloud Firestore..." size="lg" />;
  }

  if (error) {
    return <ErrorState title="Erro ao Carregar Casos" message={error} onRetry={fetchCases} />;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-vet-border">
        <div>
          <h1 className="text-2xl font-bold text-vet-text tracking-tight">Casos Clínicos</h1>
          <p className="text-xs text-vet-secondary">
            Acompanhe o status e a evolução de todos os seus atendimentos
          </p>
        </div>

        <Button variant="primary" onClick={onNewCase} leftIcon={<PlusCircle className="w-4 h-4" />}>
          Novo Caso Clínico
        </Button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="space-y-4">
        <Tabs
          tabs={[
            { id: 'ALL', label: 'Todos os Casos', count: cases.length },
            { id: 'ANAMNESIS_PENDING', label: 'Anamnese Pendente' },
            { id: 'ANALYZING', label: 'Em Análise (IA)' },
            { id: 'HYPOTHESES_GENERATED', label: 'Hipóteses Geradas' },
            { id: 'CONDUCT_SET', label: 'Conduta Definida' },
            { id: 'CLOSED', label: 'Encerrados' },
          ]}
          activeTab={activeFilter}
          onChange={setActiveFilter}
        />

        <div className="max-w-md">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder="Buscar por número do caso, título ou queixa..."
          />
        </div>
      </div>

      {/* Cases List */}
      {filteredCases.length === 0 ? (
        <EmptyState
          title={searchQuery || activeFilter !== 'ALL' ? 'Nenhum caso encontrado' : 'Nenhum caso clínico registrado'}
          description={
            searchQuery || activeFilter !== 'ALL'
              ? 'Tente alterar os filtros de busca.'
              : 'Abra um novo atendimento para registrar queixas e acionar o motor de inteligência.'
          }
          action={
            activeFilter === 'ALL' && !searchQuery && (
              <Button variant="primary" onClick={onNewCase} leftIcon={<PlusCircle className="w-4 h-4" />}>
                Criar Novo Caso
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredCases.map((c) => (
            <Card key={c.id} variant="interactive" padding="md" onClick={() => onSelectCase(c.id)}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-clinical-blue">{c.caseNumber}</span>
                    <h3 className="text-base font-bold text-vet-text">{c.title}</h3>
                    <span className="text-xs font-medium text-vet-tertiary bg-vet-border-subtle px-1.5 py-0.2 rounded">
                      v{c.currentVersion || 1}
                    </span>
                  </div>
                  <p className="text-xs text-vet-secondary leading-snug">{c.chiefComplaint}</p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <CaseStatus status={c.status} />
                  <button
                    onClick={(e) => handleDelete(c.id, e)}
                    className="p-1.5 text-vet-tertiary hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Excluir Caso"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
