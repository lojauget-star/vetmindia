import React from 'react';
import { cn } from '@/utils/cn';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number; // 0 to 100
  variant?: 'clinical' | 'trusted' | 'warning' | 'critical';
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  value,
  variant = 'clinical',
  size = 'md',
  showValue = false,
  ...props
}) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  const variants = {
    clinical: 'bg-clinical-blue',
    trusted: 'bg-trusted-green',
    warning: 'bg-amber-500',
    critical: 'bg-red-600',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      {showValue && (
        <div className="flex justify-between items-center text-xs font-medium text-vet-secondary">
          <span>Progresso</span>
          <span>{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div
        className={cn('w-full bg-vet-border-subtle rounded-full overflow-hidden', sizes[size], className)}
        {...props}
      >
        <div
          className={cn('h-full transition-all duration-300 ease-out rounded-full', variants[variant])}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
};
