import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores/useAuthStore';
import { timelineService } from '@/services/timeline.service';
import { TimelineEvent, TimelineEventType } from '@/types/timeline.types';
import {
  Sparkles,
  FileText,
  Mic,
  Activity,
  ShieldCheck,
  CheckCircle2,
  Pill,
  Download,
  Clock,
} from 'lucide-react';

export interface TimelineModuleProps {
  caseId: string;
}

export const TimelineModule: React.FC<TimelineModuleProps> = ({ caseId }) => {
  const { user } = useAuthStore();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadTimeline() {
      if (!user) return;
      setIsLoading(true);
      try {
        const list = await timelineService.getTimelineForCase(caseId, user.uid);
        setEvents(list);
      } catch (err) {
        console.error('Failed to load timeline events:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadTimeline();
  }, [caseId, user]);

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'CASE_CREATED':
        return <Sparkles className="w-4 h-4 text-clinical-blue" />;
      case 'ANAMNESIS_UPDATED':
        return <FileText className="w-4 h-4 text-clinical-blue" />;
      case 'AUDIO_RECORDED':
        return <Mic className="w-4 h-4 text-trusted-green" />;
      case 'TRANSCRIPT_CREATED':
        return <FileText className="w-4 h-4 text-trusted-green" />;
      case 'ANALYSIS_STARTED':
        return <Activity className="w-4 h-4 text-amber-600" />;
      case 'ANALYSIS_COMPLETED':
        return <ShieldCheck className="w-4 h-4 text-trusted-green" />;
      case 'HYPOTHESIS_SELECTED':
        return <CheckCircle2 className="w-4 h-4 text-clinical-blue" />;
      case 'PRESCRIPTION_CREATED':
        return <Pill className="w-4 h-4 text-clinical-blue" />;
      case 'DOCUMENT_GENERATED':
        return <Download className="w-4 h-4 text-trusted-green" />;
      default:
        return <Clock className="w-4 h-4 text-vet-secondary" />;
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando linha do tempo do atendimento..." />;
  }

  return (
    <Card variant="paper">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-clinical-blue" />
          <CardTitle>Linha do Tempo de Eventos do Prontuário</CardTitle>
        </div>
        <Badge variant="neutral" size="sm">Histórico Registro Automático</Badge>
      </CardHeader>

      <CardContent>
        {events.length === 0 ? (
          <div className="p-6 text-center text-xs text-vet-secondary">
            Nenhum evento registrado na linha do tempo para este atendimento.
          </div>
        ) : (
          <div className="relative border-l-2 border-vet-border-subtle ml-4 pl-6 space-y-6">
            {events.map((evt) => (
              <div key={evt.id} className="relative">
                {/* Event Marker */}
                <div className="absolute -left-[31px] top-0 bg-vet-surface border-2 border-vet-border p-1 rounded-full shadow-sm">
                  {getEventIcon(evt.type)}
                </div>

                <div className="bg-vet-surface border border-vet-border-subtle p-3 rounded-lg shadow-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-vet-text">{evt.title}</h4>
                    <span className="text-[10px] font-mono text-vet-secondary">
                      {new Date(evt.timestamp).toLocaleString('pt-BR')}
                    </span>
                  </div>
                  <p className="text-xs text-vet-secondary mt-1">{evt.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
