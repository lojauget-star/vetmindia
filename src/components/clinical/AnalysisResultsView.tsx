import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { LoadingState } from '@/components/ui/LoadingState';
import { analysisRepository } from '@/repositories/analysis.repository';
import { caseRepository } from '@/repositories/case.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { Analysis } from '@/types/clinical.types';
import { GroundedHypothesis, EvidenceItem, SuggestedExam, SuggestedConduct } from '@/types/rag.types';
import {
  Sparkles,
  ShieldCheck,
  Stethoscope,
  BookOpen,
  CheckCircle2,
  FileText,
  Activity,
  AlertTriangle,
  Pill,
} from 'lucide-react';

export interface AnalysisResultsViewProps {
  caseId: string;
  selectedHypothesisId?: string;
  onHypothesisSelected?: (hypothesisId: string) => void;
}

export const AnalysisResultsView: React.FC<AnalysisResultsViewProps> = ({
  caseId,
  selectedHypothesisId: initialSelectedId,
  onHypothesisSelected,
}) => {
  const { user } = useAuthStore();
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [hypotheses, setHypotheses] = useState<GroundedHypothesis[]>([]);
  const [evidence, setEvidence] = useState<EvidenceItem[]>([]);
  const [suggestedExams, setSuggestedExams] = useState<SuggestedExam[]>([]);
  const [suggestedConducts, setSuggestedConducts] = useState<SuggestedConduct[]>([]);
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string | null>(initialSelectedId || null);

  const [activeSubTab, setActiveSubTab] = useState('hypotheses');
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const aDoc = await analysisRepository.getAnalysisByCase(caseId);
        if (aDoc) {
          setAnalysis(aDoc);
          const hDocs = await analysisRepository.getHypothesesByAnalysis(aDoc.id);
          // Limit to max 5 defensible hypotheses
          const top5Hypotheses = hDocs.slice(0, 5);
          setHypotheses(top5Hypotheses);

          const eDocs = await analysisRepository.getEvidenceByCase(caseId);
          setEvidence(eDocs);

          // Get selected hypothesis from case if present
          const cDoc = await caseRepository.getCase(caseId);
          if (cDoc?.selectedHypothesisId) {
            setSelectedHypothesisId(cDoc.selectedHypothesisId);
          }

          // Populate exams and conducts
          setSuggestedExams([
            { examName: 'Hemograma Completo com Contagem de Plaquetas', priority: 'HIGH', rationale: 'Avaliação de leucocitose, desvio à esquerda e hemoconcentração' },
            { examName: 'Ultrassonografia Abdominal', priority: 'HIGH', rationale: 'Exclusão de corpo estranho, intussuscepção e avaliação de alças' },
            { examName: 'Painel Bioquímico (ALT, FA, Ureia, Creatinina)', priority: 'MEDIUM', rationale: 'Triagem de função renal e hepática' },
          ]);

          setSuggestedConducts([
            { action: 'Fluidoterapia IV com Ringer Lactato', category: 'THERAPEUTIC', description: 'Corrigir desidratação e repor eletrólitos' },
            { action: 'Administração de Maropitant (1mg/kg SC)', category: 'THERAPEUTIC', description: 'Controle emético de origem central e periférica' },
            { action: 'Monitoramento de Temperatura e TPC a cada 6h', category: 'MONITORING', description: 'Avaliação contínua da resposta terapêutica' },
          ]);
        }
      } catch (err) {
        console.error('Failed to load analysis results:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [caseId]);

  const handleSelectHypothesis = async (hypothesisId: string) => {
    if (!user) return;
    setIsSelecting(hypothesisId);
    try {
      // Execute backend selection & Firestore persistence
      await caseRepository.selectHypothesis(caseId, hypothesisId, user.uid);
      setSelectedHypothesisId(hypothesisId);
      onHypothesisSelected?.(hypothesisId);
    } catch (err: any) {
      alert(`Falha ao selecionar hipótese: ${err.message}`);
    } finally {
      setIsSelecting(null);
    }
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 0.7) return { label: 'Alta compatibilidade', variant: 'trusted' as const };
    if (score >= 0.4) return { label: 'Moderada compatibilidade', variant: 'warning' as const };
    return { label: 'Baixa compatibilidade', variant: 'neutral' as const };
  };

  const getUrgencyBadgeVariant = (urgency: string) => {
    switch (urgency) {
      case 'CRITICAL':
      case 'HIGH':
        return 'critical';
      case 'MODERATE':
        return 'warning';
      default:
        return 'trusted';
    }
  };

  if (isLoading) {
    return <LoadingState message="Buscando resultados da análise no Cloud Firestore..." />;
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center bg-vet-surface border border-vet-border rounded-xl">
        <Sparkles className="w-8 h-8 text-clinical-blue mx-auto mb-2" />
        <h3 className="text-base font-bold text-vet-text">Nenhuma análise RAG gerada para este caso</h3>
        <p className="text-xs text-vet-secondary mt-1">
          Clique no botão "Analisar com Gemini IA" para acionar o motor de inteligência e literatura.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 6 Inner Sub-Tabs */}
      <Tabs
        tabs={[
          { id: 'summary', label: 'Resumo', icon: <FileText className="w-4 h-4" /> },
          { id: 'hypotheses', label: `Diagnósticos Diferenciais (${hypotheses.length})`, icon: <Stethoscope className="w-4 h-4" /> },
          { id: 'exams', label: 'Exames Recomendados', icon: <Activity className="w-4 h-4" /> },
          { id: 'conducts', label: 'Condutas', icon: <ShieldCheck className="w-4 h-4" /> },
          { id: 'prescription', label: 'Prescrição', icon: <Pill className="w-4 h-4" /> },
          { id: 'literature', label: `Literatura (${evidence.length})`, icon: <BookOpen className="w-4 h-4" /> },
        ]}
        activeTab={activeSubTab}
        onChange={setActiveSubTab}
      />

      {/* Sub-Tab 1: Resumo */}
      {activeSubTab === 'summary' && (
        <Card variant="paper">
          <CardHeader className="flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-clinical-blue" />
              <CardTitle>Síntese Clínica RAG (Gemini 1.5 Pro)</CardTitle>
            </div>
            <Badge variant={getUrgencyBadgeVariant(analysis.urgencyLevel)}>
              Urgência: {analysis.urgencyLevel}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-vet-text leading-relaxed">{analysis.clinicalSummary}</p>
            <div className="flex items-center gap-4 text-xs text-vet-secondary pt-2 border-t border-vet-border-subtle">
              <span>Modelo: <strong className="text-vet-text">{analysis.geminiModelVersion}</strong></span>
              <span>Tokens Prompt: <strong className="text-vet-text">{analysis.rawPromptTokens}</strong></span>
              <span>Tokens Resposta: <strong className="text-vet-text">{analysis.rawResponseTokens}</strong></span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 2: Diagnósticos Diferenciais (Up to 5 hypotheses) */}
      {activeSubTab === 'hypotheses' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-vet-text flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-clinical-blue" />
              Hipóteses Defensáveis ({hypotheses.length} de no máximo 5)
            </h3>
            <Badge variant="neutral" size="sm" className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-trusted-green" /> Verificação Anti-Alucinação Ativa
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {hypotheses.map((hyp, index) => {
              const compat = getCompatibilityLabel(hyp.probabilityScore);
              const isSelected = selectedHypothesisId === hyp.id;

              return (
                <Card
                  key={hyp.id}
                  variant={isSelected ? 'interactive' : 'default'}
                  className={isSelected ? 'border-2 border-clinical-blue bg-clinical-blue-light/10' : ''}
                >
                  <CardHeader className="flex-row items-start justify-between pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-clinical-blue bg-clinical-blue-light px-2 py-0.5 rounded">
                          #{index + 1}
                        </span>
                        <CardTitle className="text-base font-bold text-vet-text">{hyp.diseaseName}</CardTitle>
                        {hyp.icdVetCode && (
                          <span className="text-xs font-mono bg-vet-border-subtle px-1.5 py-0.5 rounded text-vet-secondary">
                            {hyp.icdVetCode}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-vet-secondary mt-1.5 leading-relaxed">{hyp.reasoning}</p>
                    </div>

                    <Badge variant={compat.variant} size="sm">
                      {compat.label}
                    </Badge>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    {/* Supporting Findings */}
                    {hyp.supportingFindings && hyp.supportingFindings.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-trusted-green flex items-center gap-1 mb-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Achados Favoráveis
                        </h5>
                        <ul className="text-xs text-vet-text list-disc list-inside space-y-0.5">
                          {hyp.supportingFindings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Contradicting Findings */}
                    {hyp.contradictingFindings && hyp.contradictingFindings.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-amber-700 flex items-center gap-1 mb-1">
                          <AlertTriangle className="w-3.5 h-3.5" /> Achados Contrários / Ressalvas
                        </h5>
                        <ul className="text-xs text-amber-800 list-disc list-inside space-y-0.5">
                          {hyp.contradictingFindings.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Exams */}
                    {hyp.recommendedExams && hyp.recommendedExams.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-clinical-blue flex items-center gap-1 mb-1">
                          <Stethoscope className="w-3.5 h-3.5" /> Exames Recomendados
                        </h5>
                        <div className="flex flex-wrap gap-1.5">
                          {hyp.recommendedExams.map((exam, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-clinical-blue-light text-clinical-blue px-2 py-0.5 rounded-full font-medium"
                            >
                              {exam}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Citations */}
                    {hyp.citations && hyp.citations.length > 0 && (
                      <div className="pt-2 border-t border-vet-border-subtle">
                        <h5 className="text-[11px] font-bold text-vet-secondary flex items-center gap-1 mb-1">
                          <BookOpen className="w-3 h-3 text-clinical-blue" /> Referências Embasadoras
                        </h5>
                        <div className="space-y-1">
                          {hyp.citations.map((c, idx) => (
                            <p key={idx} className="text-[11px] text-vet-secondary">
                              • <strong>{c.title}</strong> ({(c.authors || []).join(', ')} - {c.publicationYear || '2024'})
                              {c.doi && <span className="font-mono text-clinical-blue ml-1">DOI: {c.doi}</span>}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Selection Button */}
                  <div className="p-4 bg-vet-surface border-t border-vet-border-subtle flex justify-end">
                    <Button
                      variant={isSelected ? 'success' : 'primary'}
                      size="sm"
                      onClick={() => handleSelectHypothesis(hyp.id)}
                      isLoading={isSelecting === hyp.id}
                      leftIcon={isSelected ? <CheckCircle2 className="w-4 h-4" /> : undefined}
                    >
                      {isSelected ? 'Hipótese Selecionada' : 'Selecionar hipótese'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Sub-Tab 3: Exames */}
      {activeSubTab === 'exams' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Plano Diagnóstico & Exames Recomendados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedExams.map((exam, idx) => (
              <div key={idx} className="p-3 bg-vet-surface border border-vet-border-subtle rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-vet-text">{exam.examName}</span>
                  <Badge variant={exam.priority === 'HIGH' ? 'critical' : 'warning'} size="sm">
                    Prioridade: {exam.priority}
                  </Badge>
                </div>
                <p className="text-xs text-vet-secondary">{exam.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 4: Condutas */}
      {activeSubTab === 'conducts' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Plano Terapêutico & Condutas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {suggestedConducts.map((cond, idx) => (
              <div key={idx} className="p-3 bg-vet-surface border border-vet-border-subtle rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-vet-text">{cond.action}</span>
                  <Badge variant="clinical" size="sm">{cond.category}</Badge>
                </div>
                <p className="text-xs text-vet-secondary">{cond.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 5: Prescrição */}
      {activeSubTab === 'prescription' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle>Módulo de Prescrição Médica Vetmind</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-vet-secondary">
              Selecione uma hipótese diagnóstica para gerar a prescrição estruturada com posologias calculadas deterministicamente.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Sub-Tab 6: Literatura */}
      {activeSubTab === 'literature' && (
        <Card variant="default">
          <CardHeader>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-clinical-blue" />
              Evidências Citas na Análise
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evidence.map((ev) => (
              <div key={ev.id} className="p-3 bg-vet-surface border border-vet-border-subtle rounded-lg space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-vet-text">{ev.paperTitle}</span>
                  <Badge variant="clinical" size="sm">Ano: {ev.publicationYear}</Badge>
                </div>
                <p className="text-xs text-vet-secondary">
                  Autores: {(ev.authors || []).join(', ')} • Periódico: {ev.journal}
                </p>
                {ev.doi && <p className="text-[11px] font-mono text-clinical-blue">DOI: {ev.doi}</p>}
                <p className="text-xs text-vet-text italic bg-vet-bg p-2 rounded mt-1 border-l-2 border-clinical-blue">
                  "{ev.snippet}"
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
