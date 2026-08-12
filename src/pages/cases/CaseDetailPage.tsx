import React, { useState, useEffect, useCallback } from 'react';
import { caseRepository } from '@/repositories/case.repository';
import { patientRepository } from '@/repositories/patient.repository';
import { analysisJobService } from '@/services/analysisJob.service';
import { ClinicalCase, Patient } from '@/types/clinical.types';
import { AnalysisJob } from '@/types/job.types';
import { PatientHeader } from '@/components/clinical/PatientHeader';
import { CaseStatus } from '@/components/clinical/CaseStatus';
import { AnamnesisForm } from '@/components/clinical/AnamnesisForm';
import { AnalysisJobStatusWidget } from '@/components/clinical/AnalysisJobStatusWidget';
import { AnalysisResultsView } from '@/components/clinical/AnalysisResultsView';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { useAuthStore } from '@/stores/useAuthStore';
import { ArrowLeft, Sparkles, FileText, Activity } from 'lucide-react';

export interface CaseDetailPageProps {
  caseId: string;
  onBack: () => void;
}

export const CaseDetailPage: React.FC<CaseDetailPageProps> = ({ caseId, onBack }) => {
  const { user } = useAuthStore();
  const [clinicalCase, setClinicalCase] = useState<ClinicalCase | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState('anamnesis');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real AnalysisJob State
  const [currentJob, setCurrentJob] = useState<AnalysisJob | null>(null);
  const [isStartingJob, setIsStartingJob] = useState(false);

  const fetchCaseData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const cData = await caseRepository.getCase(caseId);
      if (!cData) throw new Error('Caso clínico não encontrado.');
      setClinicalCase(cData);

      const pData = await patientRepository.getPatient(cData.patientId);
      setPatient(pData);

      // Page reload persistence: Recover active/completed job from Firestore
      const activeJob = await analysisJobService.getActiveJobForCase(caseId);
      if (activeJob) {
        setCurrentJob(activeJob);
        if (activeJob.status === 'COMPLETED' || cData.status === 'HYPOTHESES_GENERATED') {
          setActiveTab('analysis');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar prontuário.');
    } finally {
      setIsLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    fetchCaseData();
  }, [fetchCaseData]);

  // Real-time listener for current job updates
  useEffect(() => {
    if (!currentJob?.jobId) return;
    const unsubscribe = analysisJobService.subscribeToJob(currentJob.jobId, (updatedJob) => {
      if (updatedJob) {
        setCurrentJob(updatedJob);
        if (updatedJob.status === 'COMPLETED') {
          fetchCaseData();
        }
      }
    });
    return () => unsubscribe();
  }, [currentJob?.jobId, fetchCaseData]);

  const handleStartRealAnalysis = async () => {
    if (!user || !clinicalCase) return;
    setIsStartingJob(true);
    try {
      setActiveTab('analysis');
      const { jobId } = await analysisJobService.startAnalysis(clinicalCase.id, user.uid);
      const initialJob = await analysisJobService.getActiveJobForCase(clinicalCase.id);
      if (initialJob) setCurrentJob(initialJob);
    } catch (err: any) {
      alert(`Falha ao iniciar análise: ${err.message}`);
    } finally {
      setIsStartingJob(false);
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando caso clínico no Cloud Firestore..." size="lg" />;
  }

  if (error || !clinicalCase) {
    return (
      <ErrorState
        title="Caso Clínico não Encontrado"
        message={error || 'Não foi possível carregar os dados deste atendimento.'}
        onRetry={fetchCaseData}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Action & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-vet-secondary hover:text-vet-text transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para Casos
        </button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleStartRealAnalysis}
          isLoading={isStartingJob || currentJob?.status === 'PROCESSING'}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          Analisar com Gemini IA
        </Button>
      </div>

      {/* Case Header Card */}
      <Card variant="paper" padding="lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-vet-border-subtle pb-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-mono font-bold text-clinical-blue bg-clinical-blue-light px-2 py-0.5 rounded">
                {clinicalCase.caseNumber}
              </span>
              <h1 className="text-xl font-bold text-vet-text">{clinicalCase.title}</h1>
            </div>
            <p className="text-xs text-vet-secondary mt-1">
              Criado em: {new Date(clinicalCase.createdAt).toLocaleString()} • Versão do Prontuário: v
              {clinicalCase.currentVersion || 1}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <CaseStatus status={clinicalCase.status} />
          </div>
        </div>

        {/* Patient Header Component */}
        {patient && <PatientHeader patient={patient} compact />}
      </Card>

      {/* Tab Navigation */}
      <Tabs
        tabs={[
          { id: 'anamnesis', label: 'Anamnese & Exame Físico', icon: <FileText className="w-4 h-4" /> },
          { id: 'analysis', label: 'Área da IA (RAG & Hipóteses)', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'timeline', label: 'Linha do Tempo', icon: <Activity className="w-4 h-4" /> },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* View Content */}
      {activeTab === 'anamnesis' && (
        <AnamnesisForm caseId={clinicalCase.id} patientId={clinicalCase.patientId} />
      )}

      {activeTab === 'analysis' && (
        <div className="space-y-6">
          {/* Active Job Progress Widget */}
          {currentJob && (
            <AnalysisJobStatusWidget
              job={currentJob}
              onRetry={handleStartRealAnalysis}
            />
          )}

          {/* Real Structured RAG Results View */}
          <AnalysisResultsView caseId={clinicalCase.id} />
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="p-8 text-center bg-vet-surface border border-vet-border rounded-xl">
          <p className="text-sm font-medium text-vet-secondary">
            Linha do tempo dos eventos clínicos do caso {clinicalCase.caseNumber}.
          </p>
        </div>
      )}
    </div>
  );
};
