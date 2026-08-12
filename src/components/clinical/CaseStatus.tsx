import React from 'react';
import { Badge } from '../ui/Badge';
import { CaseStatus as StatusType } from '@/types/clinical.types';

export interface CaseStatusProps {
  status: StatusType;
  className?: string;
}

export const CaseStatus: React.FC<CaseStatusProps> = ({ status, className }) => {
  const statusConfig: Record<StatusType, { label: string; variant: 'neutral' | 'warning' | 'clinical' | 'trusted' }> = {
    DRAFT: { label: 'Rascunho', variant: 'neutral' },
    ANAMNESIS_PENDING: { label: 'Anamnese Pendente', variant: 'warning' },
    ANALYZING: { label: 'Em Análise (IA)', variant: 'clinical' },
    HYPOTHESES_GENERATED: { label: 'Hipóteses Geradas', variant: 'clinical' },
    CONDUCT_SET: { label: 'Conduta Definida', variant: 'trusted' },
    CLOSED: { label: 'Caso Encerrado', variant: 'trusted' },
  };

  const config = statusConfig[status] || { label: status, variant: 'neutral' };

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
};
