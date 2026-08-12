import React from 'react';
import { AnalysisJob } from '@/types/job.types';
import { RagProcessingWidget } from '@/components/motion/RagProcessingWidget';

export interface AnalysisJobStatusWidgetProps {
  job: AnalysisJob | null;
  onRetry?: () => void;
}

export const AnalysisJobStatusWidget: React.FC<AnalysisJobStatusWidgetProps> = ({ job, onRetry }) => {
  if (!job) return null;

  return (
    <RagProcessingWidget
      status={job.status}
      stageName={job.currentStage || 'Processando análise...'}
      progressPercentage={job.progress || 0}
      errorMessage={job.error}
      onRetry={onRetry}
    />
  );
};
