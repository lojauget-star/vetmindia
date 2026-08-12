import React from 'react';
import { cn } from '@/utils/cn';
import { FolderOpen } from 'lucide-react';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  className,
  icon,
  title,
  description,
  action,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-vet-border bg-paper-texture',
        className
      )}
      {...props}
    >
      <div className="p-3 bg-vet-surface rounded-full text-vet-secondary border border-vet-border shadow-subtle mb-3">
        {icon || <FolderOpen className="w-6 h-6 text-vet-tertiary" />}
      </div>
      <h4 className="text-base font-semibold text-vet-text">{title}</h4>
      {description && <p className="text-xs text-vet-secondary max-w-sm mt-1 mb-4">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
};
