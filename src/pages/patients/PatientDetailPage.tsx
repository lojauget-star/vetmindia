import React, { useState, useEffect, useCallback } from 'react';
import { patientRepository } from '@/repositories/patient.repository';
import { caseRepository } from '@/repositories/case.repository';
import { Patient, ClinicalCase } from '@/types/clinical.types';
import { PatientHeader } from '@/components/clinical/PatientHeader';
import { CaseStatus } from '@/components/clinical/CaseStatus';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { LoadingState } from '@/components/ui/LoadingState';
import { ErrorState } from '@/components/ui/ErrorState';
import { ArrowLeft, PlusCircle, FolderKanban } from 'lucide-react';

export interface PatientDetailPageProps {
  patientId: string;
  onBack: () => void;
  onSelectCase: (caseId: string) => void;
  onCreateCaseForPatient: (patientId: string) => void;
}

export const PatientDetailPage: React.FC<PatientDetailPageProps> = ({
  patientId,
  onBack,
  onSelectCase,
  onCreateCaseForPatient,
}) => {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [pData, cData] = await Promise.all([
        patientRepository.getPatient(patientId),
        caseRepository.getCasesByPatient(patientId),
      ]);
      setPatient(pData);
      setCases(cData);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar prontuário do paciente.');
    } finally {
      setIsLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (isLoading) {
    return <LoadingState message="Carregando histórico do paciente no Firebase..." size="lg" />;
  }

  if (error || !patient) {
    return (
      <ErrorState
        title="Paciente não Encontrado"
        message={error || 'Não foi possível carregar os dados deste paciente.'}
        onRetry={fetchData}
      />
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-vet-secondary hover:text-vet-text transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Pacientes
      </button>

      {/* Patient Header */}
      <PatientHeader patient={patient} />

      {/* Cases Section Header */}
      <div className="flex items-center justify-between pt-4 border-t border-vet-border">
        <div>
          <h2 className="text-lg font-bold text-vet-text flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-clinical-blue" />
            Histórico de Casos Clínicos
          </h2>
          <p className="text-xs text-vet-secondary">
            Todos os atendimentos gravados para {patient.name}
          </p>
        </div>

        <Button
          variant="primary"
          onClick={() => onCreateCaseForPatient(patient.id)}
          leftIcon={<PlusCircle className="w-4 h-4" />}
        >
          Novo Caso Clínico
        </Button>
      </div>

      {/* Cases List */}
      {cases.length === 0 ? (
        <div className="p-8 text-center bg-vet-surface border border-vet-border rounded-xl space-y-3">
          <p className="text-sm font-medium text-vet-secondary">
            Nenhum caso clínico registrado para este paciente.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCreateCaseForPatient(patient.id)}
            leftIcon={<PlusCircle className="w-4 h-4" />}
          >
            Iniciar Primeiro Atendimento
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {cases.map((c) => (
            <Card key={c.id} variant="interactive" padding="md" onClick={() => onSelectCase(c.id)}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-semibold text-clinical-blue">{c.caseNumber}</span>
                    <h4 className="text-sm font-bold text-vet-text">{c.title}</h4>
                    <span className="text-xs text-vet-tertiary">v{c.currentVersion || 1}</span>
                  </div>
                  <p className="text-xs text-vet-secondary mt-1">{c.chiefComplaint}</p>
                </div>
                <CaseStatus status={c.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
