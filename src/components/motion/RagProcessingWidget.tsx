import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { JobStatus } from '@/types/job.types';
import { Sparkles, CheckCircle2, AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface RagProcessingWidgetProps {
  status: JobStatus;
  stageName: string;
  progressPercentage: number;
  errorMessage?: string;
  onRetry?: () => void;
}

export const RagProcessingWidget: React.FC<RagProcessingWidgetProps> = ({
  status,
  stageName,
  progressPercentage,
  errorMessage,
  onRetry,
}) => {
  const isProcessing = status === 'PROCESSING' || status === 'QUEUED';
  const isCompleted = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  return (
    <div className="p-5 bg-vet-surface border border-vet-border rounded-xl shadow-subtle space-y-4">
      {/* Stage Header & Icon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-clinical-blue-light text-clinical-blue">
            {isProcessing ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-trusted-green" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            )}
          </div>
          <div>
            <h4 className="text-sm font-bold text-vet-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-clinical-blue" />
              Análise Clínico-Científica RAG (Gemini 1.5 Pro)
            </h4>
            <AnimatePresence mode="wait">
              <motion.p
                key={stageName}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-vet-secondary mt-0.5 font-medium"
              >
                {stageName}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isFailed && onRetry && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={onRetry}
            >
              Tentar novamente
            </Button>
          )}
          <span className="text-xs font-mono font-bold text-clinical-blue bg-clinical-blue-light/30 px-2.5 py-1 rounded-md">
            {progressPercentage}%
          </span>
        </div>
      </div>

      {/* Progress Bar with Motion */}
      <div className="w-full bg-vet-bg border border-vet-border-subtle h-2.5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className={`h-full rounded-full ${
            isFailed
              ? 'bg-red-500'
              : isCompleted
              ? 'bg-trusted-green'
              : 'bg-clinical-blue'
          }`}
        />
      </div>

      {/* Error Message if Failed */}
      {isFailed && errorMessage && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium"
        >
          {errorMessage}
        </motion.div>
      )}
    </div>
  );
};
