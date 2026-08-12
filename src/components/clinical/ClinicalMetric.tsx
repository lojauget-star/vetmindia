import React from 'react';
import { cn } from '@/utils/cn';
import { Activity } from 'lucide-react';

export interface ClinicalMetricProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  isOutRange?: boolean;
  icon?: React.ReactNode;
}

export const ClinicalMetric: React.FC<ClinicalMetricProps> = ({
  className,
  label,
  value,
  unit,
  referenceRange,
  isOutRange = false,
  icon,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col p-3 rounded-xl border bg-vet-surface shadow-subtle transition-all',
        isOutRange ? 'border-amber-300 bg-amber-50/30' : 'border-vet-border',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-between text-xs text-vet-secondary">
        <span className="font-medium">{label}</span>
        {icon || <Activity className="w-3.5 h-3.5 text-vet-tertiary" />}
      </div>
      <div className="flex items-baseline gap-1 mt-1.5">
        <span className={cn('text-lg font-bold tracking-tight', isOutRange ? 'text-amber-700' : 'text-vet-text')}>
          {value}
        </span>
        {unit && <span className="text-xs text-vet-secondary font-medium">{unit}</span>}
      </div>
      {referenceRange && (
        <span className="text-[10px] text-vet-tertiary mt-1">Ref: {referenceRange}</span>
      )}
    </div>
  );
};
