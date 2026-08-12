import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores/useAuthStore';
import { hypothesisWorkspaceService, DynamicHypothesisWorkspaceData } from '@/services/hypothesisWorkspace.service';
import {
  FileText,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Stethoscope,
  Clock,
  ShieldCheck,
  Pill,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export interface DynamicHypothesisWorkspaceProps {
  caseId: string;
  selectedHypothesisId: string;
}

export const DynamicHypothesisWorkspace: React.FC<DynamicHypothesisWorkspaceProps> = ({
  caseId,
  selectedHypothesisId,
}) => {
  const { user } = useAuthStore();
  const [data, setData] = useState<DynamicHypothesisWorkspaceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWorkspaceData() {
      if (!user || !selectedHypothesisId) return;
      setIsLoading(true);
      setError(null);
      try {
        const workspaceData = await hypothesisWorkspaceService.getFullHypothesisWorkspace(
          caseId,
          selectedHypothesisId,
          user.uid
        );
        setData(workspaceData);
      } catch (err: any) {
        console.error('Failed to load hypothesis workspace data:', err);
        setError(err.message || 'Erro ao carregar dados da hipótese selecionada.');
      } finally {
        setIsLoading(false);
      }
    }

    loadWorkspaceData();
  }, [caseId, selectedHypothesisId, user]);

  if (isLoading) {
    return <LoadingState message="Atualizando espaço de trabalho dinâmico para a hipótese selecionada..." />;
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs">
        {error || 'Não foi possível carregar os detalhes da hipótese selecionada.'}
      </div>
    );
  }

  const { hypothesis, evidence, supportingFindings, contradictingFindings, suggestedExams, nextSteps, suggestedConducts, prescriptionItems, tutorExplanation } = data;

  const getCompatibilityBadge = (score: number) => {
    if (score >= 0.7) return { label: 'Alta compatibilidade', variant: 'trusted' as const };
    if (score >= 0.4) return { label: 'Moderada compatibilidade', variant: 'warning' as const };
    return { label: 'Baixa compatibilidade', variant: 'neutral' as const };
  };

  const compat = getCompatibilityBadge(hypothesis.probabilityScore);

  return (
    <div className="space-y-6">
      {/* Context Banner */}
      <div className="p-4 bg-clinical-blue-light/20 border-2 border-clinical-blue rounded-xl flex items-center justify-between">
        <div>
          <span className="text-[11px] uppercase tracking-wider font-bold text-clinical-blue">
            Contexto Ativo da Hipótese Selecionada
          </span>
          <h2 className="text-lg font-bold text-vet-text mt-0.5">{hypothesis.diseaseName}</h2>
        </div>
        <Badge variant={compat.variant} size="md">
          {compat.label}
        </Badge>
      </div>

      {/* 9 Dynamic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CARD 1: Resumo */}
        <Card variant="paper" className="col-span-1 md:col-span-2">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <FileText className="w-5 h-5 text-clinical-blue" />
            <CardTitle>1. Resumo da Hipótese</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-xs text-vet-text leading-relaxed">{hypothesis.reasoning}</p>
            {hypothesis.icdVetCode && (
              <span className="inline-block text-[11px] font-mono bg-vet-border-subtle px-2 py-0.5 rounded text-vet-secondary">
                Código ICD-Vet: {hypothesis.icdVetCode}
              </span>
            )}
          </CardContent>
        </Card>

        {/* CARD 2: Evidências */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <BookOpen className="w-5 h-5 text-clinical-blue" />
            <CardTitle>2. Evidências Bibliográficas ({evidence.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {evidence.length === 0 ? (
              <p className="text-xs text-vet-secondary">Nenhuma citação específica registrada.</p>
            ) : (
              evidence.map((e) => (
                <div key={e.id} className="p-2 bg-vet-surface border border-vet-border-subtle rounded text-xs space-y-1">
                  <p className="font-bold text-vet-text">{e.paperTitle}</p>
                  <p className="text-vet-secondary text-[11px]">{(e.authors || []).join(', ')} ({e.publicationYear})</p>
                  {e.doi && <p className="font-mono text-clinical-blue text-[10px]">DOI: {e.doi}</p>}
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* CARD 3: O que favorece */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <CheckCircle2 className="w-5 h-5 text-trusted-green" />
            <CardTitle>3. Achados Favoráveis ({supportingFindings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {supportingFindings.length === 0 ? (
              <p className="text-xs text-vet-secondary">Nenhum achado específico catalogado.</p>
            ) : (
              <ul className="text-xs text-vet-text list-disc list-inside space-y-1">
                {supportingFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* CARD 4: O que contradiz */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <CardTitle>4. Achados Contrários / Ressalvas ({contradictingFindings.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {contradictingFindings.length === 0 ? (
              <p className="text-xs text-vet-secondary">Nenhuma ressalva contrária identificada.</p>
            ) : (
              <ul className="text-xs text-amber-900 list-disc list-inside space-y-1">
                {contradictingFindings.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* CARD 5: Exames */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Stethoscope className="w-5 h-5 text-clinical-blue" />
            <CardTitle>5. Exames Recomendados ({suggestedExams.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedExams.map((ex, i) => (
              <div key={i} className="p-2 bg-vet-surface border border-vet-border-subtle rounded text-xs">
                <div className="flex justify-between font-bold text-vet-text">
                  <span>{ex.examName}</span>
                  <Badge variant={ex.priority === 'HIGH' ? 'critical' : 'warning'} size="sm">{ex.priority}</Badge>
                </div>
                <p className="text-[11px] text-vet-secondary mt-0.5">{ex.rationale}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CARD 6: Próximos passos */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Clock className="w-5 h-5 text-clinical-blue" />
            <CardTitle>6. Próximos Passos ({nextSteps.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {nextSteps.map((step, i) => (
              <div key={i} className="p-2 bg-vet-surface border border-vet-border-subtle rounded text-xs space-y-0.5">
                <p className="font-bold text-vet-text">{step.step}</p>
                <p className="text-[11px] text-clinical-blue font-mono">Prazo: {step.timeframe}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CARD 7: Condutas */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <ShieldCheck className="w-5 h-5 text-trusted-green" />
            <CardTitle>7. Plano de Condutas ({suggestedConducts.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {suggestedConducts.map((c, i) => (
              <div key={i} className="p-2 bg-vet-surface border border-vet-border-subtle rounded text-xs space-y-0.5">
                <div className="flex justify-between font-bold text-vet-text">
                  <span>{c.action}</span>
                  <Badge variant="clinical" size="sm">{c.category}</Badge>
                </div>
                <p className="text-[11px] text-vet-secondary">{c.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CARD 8: Prescrição */}
        <Card variant="default">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <Pill className="w-5 h-5 text-clinical-blue" />
            <CardTitle>8. Prescrição Calculada ({prescriptionItems.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {prescriptionItems.map((p, i) => (
              <div key={i} className="p-2 bg-vet-surface border border-vet-border-subtle rounded text-xs space-y-0.5">
                <p className="font-bold text-vet-text">{p.medicationName} ({p.totalDosage})</p>
                <p className="text-[11px] text-vet-secondary">
                  Via: {p.route} • Frequência: {p.frequency} • Duração: {p.durationDays} dias
                </p>
                <p className="text-[11px] text-vet-text italic">{p.instructions}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* CARD 9: Explicação ao tutor */}
        <Card variant="paper" className="col-span-1 md:col-span-2">
          <CardHeader className="flex-row items-center gap-2 pb-2">
            <MessageSquare className="w-5 h-5 text-trusted-green" />
            <CardTitle>9. Explicação ao Tutor (Comunicação Clara)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-3 bg-trusted-green-light/20 border border-trusted-green rounded-lg text-xs text-vet-text leading-relaxed">
              {tutorExplanation}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
