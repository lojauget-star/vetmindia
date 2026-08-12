import React from 'react';
import { useDashboard } from '@/hooks/useDashboard';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { EmptyState } from '@/components/ui/EmptyState';
import { ErrorState } from '@/components/ui/ErrorState';
import { PatientHeader } from '@/components/clinical/PatientHeader';
import { CaseStatus } from '@/components/clinical/CaseStatus';
import { DocumentCard } from '@/components/clinical/DocumentCard';
import {
  PlusCircle,
  FolderKanban,
  Users,
  Sparkles,
  FileText,
  Clock,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

export interface DashboardPageProps {
  onNewCase: () => void;
  onNavigateToCases?: () => void;
  onNavigateToPatients?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNewCase,
  onNavigateToCases,
  onNavigateToPatients,
}) => {
  const { user, profile } = useAuthStore();
  const { data, isLoading, isError, isEmpty, error, refetch } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingState message="Carregando prontuários e inteligência clínica do Cloud Firestore..." size="lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <ErrorState
          title="Erro ao Sincronizar Prontuários"
          message={error || 'Não foi possível se comunicar com o Cloud Firestore.'}
          onRetry={refetch}
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header Banner & Quick Action */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-6 bg-paper-texture border border-vet-border rounded-2xl shadow-subtle">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-vet-text tracking-tight">
              Olá, {profile?.fullName || user?.displayName || 'Dr. Veterinário'}
            </h1>
            <Badge variant="clinical">CRM-V Verificado</Badge>
          </div>
          <p className="text-xs text-vet-secondary mt-1">
            {profile?.clinicName ? `${profile.clinicName} • ` : ''} Painel de Controle e Diagnóstico Clínico
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Atualizar
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={onNewCase}
            leftIcon={<PlusCircle className="w-4 h-4" />}
            className="flex-1 md:flex-none shadow-md"
          >
            Novo Caso Clínico
          </Button>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card variant="flat" padding="sm" className="bg-vet-surface border border-vet-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-clinical-blue-light text-clinical-blue rounded-xl">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-vet-text">{data.cases.length}</span>
              <p className="text-xs text-vet-secondary">Casos Ativos</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" padding="sm" className="bg-vet-surface border border-vet-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-trusted-green-light text-trusted-green rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-vet-text">{data.patients.length}</span>
              <p className="text-xs text-vet-secondary">Pacientes</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" padding="sm" className="bg-vet-surface border border-vet-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-vet-text">{data.analyses.length}</span>
              <p className="text-xs text-vet-secondary">Análises IA</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" padding="sm" className="bg-vet-surface border border-vet-border">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-2xl font-bold text-vet-text">{data.documents.length}</span>
              <p className="text-xs text-vet-secondary">Laudos Emitidos</p>
            </div>
          </div>
        </Card>
      </div>

      {isEmpty ? (
        <EmptyState
          title="Nenhum Registro Clínico no Firebase"
          description="Você ainda não cadastrou pacientes ou casos clínicos nesta conta. Inicie a primeira consulta para ativar o motor de inteligência Gemini."
          action={
            <Button variant="primary" onClick={onNewCase} leftIcon={<PlusCircle className="w-4 h-4" />}>
              Criar Primeiro Caso Clínico
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Casos Recentes & Análises */}
          <div className="lg:col-span-2 space-y-8">
            {/* Casos Recentes */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-vet-text flex items-center gap-2">
                  <FolderKanban className="w-4 h-4 text-clinical-blue" />
                  Casos Clínicos Recentes
                </h3>
                {onNavigateToCases && (
                  <button
                    onClick={onNavigateToCases}
                    className="text-xs font-semibold text-clinical-blue hover:underline flex items-center gap-1"
                  >
                    Ver todos ({data.cases.length}) <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {data.cases.length === 0 ? (
                <div className="p-4 bg-vet-surface border border-vet-border rounded-xl text-xs text-vet-secondary italic">
                  Nenhum caso recente cadastrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.cases.map((c) => (
                    <Card key={c.id} variant="interactive" padding="md">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-semibold text-clinical-blue">
                              {c.caseNumber}
                            </span>
                            <h4 className="text-sm font-bold text-vet-text">{c.title}</h4>
                          </div>
                          <p className="text-xs text-vet-secondary mt-1 line-clamp-1">
                            {c.chiefComplaint}
                          </p>
                        </div>
                        <CaseStatus status={c.status} />
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Análises IA Recentes */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-vet-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                Análises de Inteligência Clínica (Gemini)
              </h3>

              {data.analyses.length === 0 ? (
                <div className="p-4 bg-vet-surface border border-vet-border rounded-xl text-xs text-vet-secondary italic">
                  Nenhuma análise IA executada ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.analyses.map((a) => (
                    <Card key={a.id} variant="paper" padding="md">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                a.urgencyLevel === 'CRITICAL' || a.urgencyLevel === 'HIGH'
                                  ? 'critical'
                                  : 'clinical'
                              }
                              size="sm"
                            >
                              Urgência: {a.urgencyLevel}
                            </Badge>
                            <span className="text-[10px] text-vet-tertiary flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {new Date(a.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-vet-text font-medium mt-2 leading-relaxed">
                            {a.clinicalSummary}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* Side Column: Pacientes & Documentos */}
          <div className="space-y-8">
            {/* Pacientes Recentes */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-vet-text flex items-center gap-2">
                  <Users className="w-4 h-4 text-trusted-green" />
                  Pacientes Recentes
                </h3>
                {onNavigateToPatients && (
                  <button
                    onClick={onNavigateToPatients}
                    className="text-xs font-semibold text-trusted-green hover:underline"
                  >
                    Ver todos
                  </button>
                )}
              </div>

              {data.patients.length === 0 ? (
                <div className="p-4 bg-vet-surface border border-vet-border rounded-xl text-xs text-vet-secondary italic">
                  Nenhum paciente cadastrado.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.patients.map((p) => (
                    <PatientHeader key={p.id} patient={p} compact />
                  ))}
                </div>
              )}
            </section>

            {/* Documentos Emitidos */}
            <section className="space-y-4">
              <h3 className="text-base font-bold text-vet-text flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Documentos & Laudos PDF
              </h3>

              {data.documents.length === 0 ? (
                <div className="p-4 bg-vet-surface border border-vet-border rounded-xl text-xs text-vet-secondary italic">
                  Nenhum laudo emitido ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {data.documents.map((d) => (
                    <DocumentCard
                      key={d.id}
                      title={d.title}
                      typeLabel={d.type}
                      createdAt={new Date(d.createdAt).toLocaleDateString()}
                      downloadUrl={d.downloadUrl}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </div>
  );
};
