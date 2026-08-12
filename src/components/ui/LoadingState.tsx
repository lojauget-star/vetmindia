import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface LoadingStateProps extends React.HTMLAttributes<HTMLDivElement> {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  className,
  message = 'Carregando dados...',
  size = 'md',
  ...props
}) => {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center w-full', className)} {...props}>
      <Loader2 className={cn('animate-spin text-clinical-blue mb-2', sizes[size])} />
      {message && <p className="text-xs font-medium text-vet-secondary">{message}</p>}
    </div>
  );
};
