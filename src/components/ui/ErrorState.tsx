import React from 'react';
import { cn } from '@/utils/cn';
import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

export interface ErrorStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  className,
  title = 'Ocorreu um erro',
  message,
  onRetry,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center rounded-xl border border-red-200 bg-red-50/50',
        className
      )}
      {...props}
    >
      <div className="p-2.5 bg-red-100 rounded-full text-red-600 mb-3">
        <AlertCircle className="w-6 h-6" />
      </div>
      <h4 className="text-sm font-semibold text-red-900">{title}</h4>
      <p className="text-xs text-red-700 max-w-sm mt-1 mb-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
          Tentar Novamente
        </Button>
      )}
    </div>
  );
};
