import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ClinicalMetric } from '@/components/clinical/ClinicalMetric';
import { AudioRecorderWidget } from '@/components/clinical/AudioRecorderWidget';
import { anamnesisRepository } from '@/repositories/anamnesis.repository';
import { Anamnesis, PhysicalExam, AnamnesisStructuredData } from '@/types/clinical.types';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAutosave } from '@/hooks/useAutosave';
import { Stethoscope, CheckCircle2, AlertTriangle, Clock, FileText, Activity } from 'lucide-react';

export interface AnamnesisFormProps {
  caseId: string;
  patientId: string;
  onSaved?: (anamnesis: Anamnesis) => void;
}

export const AnamnesisForm: React.FC<AnamnesisFormProps> = ({ caseId, patientId, onSaved }) => {
  const { user } = useAuthStore();
  const [anamnesisId, setAnamnesisId] = useState<string>(`anam_${Date.now()}`);

  // Raw Text State (Original Spoken Transcription - NEVER modified automatically)
  const [rawText, setRawText] = useState('');

  // Structured Data Form State
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string>('');
  const [onsetDate, setOnsetDate] = useState('');
  const [progression, setProgression] = useState<'ACUTE' | 'SUBACUTE' | 'CHRONIC' | 'EPISODIC'>('ACUTE');
  const [dietHistory, setDietHistory] = useState('');
  const [vaccinationStatus, setVaccinationStatus] = useState('Em dia');
  const [dewormingStatus, setDewormingStatus] = useState('');
  const [medications, setMedications] = useState('');
  const [historicalNotes, setHistoricalNotes] = useState('');

  // Physical Exam Metrics
  const [physicalExam, setPhysicalExam] = useState<PhysicalExam>({
    temperatureC: 38.5,
    heartRateBpm: 110,
    respiratoryRateBpm: 24,
    mucousMembranes: 'Normocoradas',
    capillaryRefillTimeSec: 2,
    hydrationStatus: 'Normal (0%)',
    bodyConditionScore: 5,
    notes: '',
  });

  // Clinical Facts & Missing Info
  const [clinicalFindings, setClinicalFindings] = useState<string[]>([]);
  const [missingInformation, setMissingInformation] = useState<string[]>([]);

  // Load Existing Anamnesis from Firestore
  useEffect(() => {
    async function loadData() {
      const existing = await anamnesisRepository.getAnamnesisByCase(caseId);
      if (existing) {
        setAnamnesisId(existing.id);
        setRawText(existing.rawText || '');
        setChiefComplaint(existing.structuredData?.chiefComplaint || '');
        setSymptoms(existing.structuredData?.symptoms?.join(', ') || '');
        setOnsetDate(existing.structuredData?.onsetDate || '');
        setProgression(existing.structuredData?.progression || 'ACUTE');
        setDietHistory(existing.structuredData?.dietHistory || '');
        setVaccinationStatus(existing.structuredData?.vaccinationStatus || '');
        setDewormingStatus(existing.structuredData?.dewormingStatus || '');
        setMedications(existing.structuredData?.medications || '');
        setHistoricalNotes(existing.structuredData?.historicalNotes || '');
        if (existing.physicalExam) setPhysicalExam(existing.physicalExam);
        setClinicalFindings(existing.clinicalFindings || []);
        setMissingInformation(existing.missingInformation || []);
      }
    }
    loadData();
  }, [caseId]);

  // Consolidated Payload for Autosave
  const getCurrentPayload = useCallback((): Anamnesis => {
    const now = new Date().toISOString();
    const structured: AnamnesisStructuredData = {
      chiefComplaint,
      symptoms: symptoms.split(',').map((s) => s.trim()).filter(Boolean),
      onsetDate,
      progression,
      dietHistory,
      vaccinationStatus,
      dewormingStatus,
      medications,
      historicalNotes,
    };

    return {
      id: anamnesisId,
      caseId,
      userId: user?.uid || '',
      patientId,
      rawText, // Unaltered original transcription
      structuredData: structured,
      physicalExam,
      clinicalFindings,
      missingInformation,
      createdAt: now,
      updatedAt: now,
    };
  }, [
    anamnesisId,
    caseId,
    user?.uid,
    patientId,
    rawText,
    chiefComplaint,
    symptoms,
    onsetDate,
    progression,
    dietHistory,
    vaccinationStatus,
    dewormingStatus,
    medications,
    historicalNotes,
    physicalExam,
    clinicalFindings,
    missingInformation,
  ]);

  // Autosave setup
  const handleAutosave = useCallback(async () => {
    if (!user) return;
    const payload = getCurrentPayload();
    const saved = await anamnesisRepository.saveAnamnesis(payload);
    onSaved?.(saved);
  }, [user, getCurrentPayload, onSaved]);

  const { isSaving, lastSavedAt, hasUnsavedChanges, triggerManualSave } = useAutosave({
    data: getCurrentPayload(),
    onSave: handleAutosave,
    delayMs: 1500,
    enabled: !!user,
  });

  const handleTranscriptionComplete = (transcribedRawText: string, findings: string[], missing: string[]) => {
    setRawText(transcribedRawText);
    setClinicalFindings(findings);
    setMissingInformation(missing);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Autosave Indicator */}
      <div className="flex items-center justify-between pb-3 border-b border-vet-border">
        <div>
          <h2 className="text-xl font-bold text-vet-text flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-clinical-blue" />
            Anamnese & Exame Físico
          </h2>
          <p className="text-xs text-vet-secondary">
            Registro dos sintomas, histórico clínico e exame físico do paciente
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="text-xs text-vet-tertiary flex items-center gap-1.5 select-none">
            {isSaving ? (
              <span className="text-clinical-blue font-semibold animate-pulse flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" /> Salvando...
              </span>
            ) : hasUnsavedChanges ? (
              <span className="text-amber-600 font-medium">Alterações pendentes</span>
            ) : lastSavedAt ? (
              <span className="text-trusted-green font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Salvo. ({lastSavedAt})
              </span>
            ) : null}
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={triggerManualSave}
            isLoading={isSaving}
            disabled={!hasUnsavedChanges}
          >
            Salvar Anamnese
          </Button>
        </div>
      </div>

      {/* Audio Recorder & Speech-to-Text Widget */}
      <AudioRecorderWidget
        caseId={caseId}
        patientId={patientId}
        onTranscriptionComplete={handleTranscriptionComplete}
      />

      {/* Raw Transcription Editor (Intact Raw Text) */}
      <Card variant="paper">
        <CardHeader className="flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-clinical-blue" />
              Transcrição Bruta (rawText)
            </CardTitle>
            <p className="text-[11px] text-vet-secondary">
              Texto bruto original da consulta. Este campo nunca é alterado automaticamente pelo sistema.
            </p>
          </div>
          <Badge variant="neutral">Fonte Primária</Badge>
        </CardHeader>
        <CardContent>
          <Textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="A transcrição por voz ou notas brutas da consulta aparecerão aqui..."
            rows={4}
            className="font-mono text-xs bg-vet-surface"
          />
        </CardContent>
      </Card>

      {/* Clinical Findings & Missing Info Gaps */}
      {(clinicalFindings.length > 0 || missingInformation.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Findings */}
          <Card variant="default">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-trusted-green flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Fatos Clínicos Extraídos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-vet-text space-y-1.5 list-disc list-inside">
                {clinicalFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Gaps */}
          <Card variant="default" className="border-amber-200 bg-amber-50/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" /> Lacunas de Informação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                {missingInformation.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Structured Anamnesis Form */}
      <Card variant="default">
        <CardHeader>
          <CardTitle>Histórico Clínico & Anamnese Estruturada</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Queixa Principal *"
            value={chiefComplaint}
            onChange={(e) => setChiefComplaint(e.target.value)}
            placeholder="Ex: Vômito bilioso e prostração aguda há 48h"
            required
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Sintomas Relatados (separados por vírgula)"
              value={symptoms}
              onChange={(e) => setSymptoms(e.target.value)}
              placeholder="Ex: Vômito, letargia, anorexia, dor abdominal"
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="Data de Início"
                type="date"
                value={onsetDate}
                onChange={(e) => setOnsetDate(e.target.value)}
              />
              <Select
                label="Progressão"
                value={progression}
                onChange={(e) => setProgression(e.target.value as any)}
                options={[
                  { value: 'ACUTE', label: 'Aguda' },
                  { value: 'SUBACUTE', label: 'Subaguda' },
                  { value: 'CHRONIC', label: 'Crônica' },
                  { value: 'EPISODIC', label: 'Episódica' },
                ]}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Alimentação / Dieta"
              value={dietHistory}
              onChange={(e) => setDietHistory(e.target.value)}
              placeholder="Ex: Ração seca super premium"
            />
            <Input
              label="Status Vacinal"
              value={vaccinationStatus}
              onChange={(e) => setVaccinationStatus(e.target.value)}
              placeholder="Ex: V10 + Raiva em dia"
            />
            <Input
              label="Desverminação"
              value={dewormingStatus}
              onChange={(e) => setDewormingStatus(e.target.value)}
              placeholder="Ex: Administrado há 2 meses"
            />
          </div>

          <Textarea
            label="Medicações em Uso"
            value={medications}
            onChange={(e) => setMedications(e.target.value)}
            placeholder="Descreva medicamentos contínuos, dosagens e horários..."
            rows={2}
          />

          <Textarea
            label="Observações Clínicas & Histórico Pregresso"
            value={historicalNotes}
            onChange={(e) => setHistoricalNotes(e.target.value)}
            placeholder="Histórico cirúrgico, alergias medicamentosas ou doenças prévias..."
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Physical Exam Metrics Form */}
      <Card variant="default">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-trusted-green" />
            Exame Físico & Sinais Vitais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <ClinicalMetric
              label="Temperatura"
              value={physicalExam.temperatureC || 38.5}
              unit="°C"
              referenceRange="37.5 - 39.2 °C"
              isOutRange={(physicalExam.temperatureC || 38.5) > 39.2}
            />
            <ClinicalMetric
              label="Frequência Cardíaca"
              value={physicalExam.heartRateBpm || 110}
              unit="bpm"
              referenceRange="70 - 140 bpm"
            />
            <ClinicalMetric
              label="Freq. Respiratória"
              value={physicalExam.respiratoryRateBpm || 24}
              unit="mpm"
              referenceRange="18 - 34 mpm"
            />
            <ClinicalMetric
              label="TPC"
              value={physicalExam.capillaryRefillTimeSec || 2}
              unit="seg"
              referenceRange="< 2 seg"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <Input
              label="Temperatura (°C)"
              type="number"
              step="0.1"
              value={physicalExam.temperatureC || ''}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, temperatureC: Number(e.target.value) }))
              }
            />
            <Input
              label="Frequência Cardíaca (bpm)"
              type="number"
              value={physicalExam.heartRateBpm || ''}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, heartRateBpm: Number(e.target.value) }))
              }
            />
            <Input
              label="Frequência Respiratória (mpm)"
              type="number"
              value={physicalExam.respiratoryRateBpm || ''}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, respiratoryRateBpm: Number(e.target.value) }))
              }
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Mucosas"
              value={physicalExam.mucousMembranes || ''}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, mucousMembranes: e.target.value }))
              }
              placeholder="Normocoradas, pálidas, icotéricas"
            />
            <Input
              label="Hidratação"
              value={physicalExam.hydrationStatus || ''}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, hydrationStatus: e.target.value }))
              }
              placeholder="Normal, 5% desidratação"
            />
            <Input
              label="Escore Corporal (1-9)"
              type="number"
              min={1}
              max={9}
              value={physicalExam.bodyConditionScore || 5}
              onChange={(e) =>
                setPhysicalExam((prev) => ({ ...prev, bodyConditionScore: Number(e.target.value) }))
              }
            />
          </div>

          <Textarea
            label="Notas do Exame Físico (Palpação, auscultação, lesões)"
            value={physicalExam.notes || ''}
            onChange={(e) => setPhysicalExam((prev) => ({ ...prev, notes: e.target.value }))}
            placeholder="Descreva sensibilidade abdominal, presença de sopros, linfonodos..."
            rows={3}
          />
        </CardContent>
      </Card>
    </div>
  );
};
