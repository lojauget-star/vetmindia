import React from 'react';
import { cn } from '@/utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'clinical' | 'trusted' | 'neutral' | 'warning' | 'critical';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 font-medium rounded-full select-none';

  const variants = {
    clinical: 'bg-clinical-blue-light text-clinical-blue border border-clinical-blue/20',
    trusted: 'bg-trusted-green-light text-trusted-green border border-trusted-green/20',
    neutral: 'bg-vet-surface-subtle text-vet-secondary border border-vet-border',
    warning: 'bg-amber-50 text-amber-700 border border-amber-200',
    critical: 'bg-red-50 text-red-700 border border-red-200',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {icon && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
    </span>
  );
};
