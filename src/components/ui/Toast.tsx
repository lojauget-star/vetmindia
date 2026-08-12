import React from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { IconButton } from './IconButton';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastProps {
  id?: string;
  type?: ToastType;
  title: string;
  message?: string;
  isVisible: boolean;
  onDismiss: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  type = 'info',
  title,
  message,
  isVisible,
  onDismiss,
}) => {
  const icons = {
    info: <Info className="w-5 h-5 text-clinical-blue shrink-0" />,
    success: <CheckCircle2 className="w-5 h-5 text-trusted-green shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />,
  };

  const borders = {
    info: 'border-clinical-blue/20 bg-clinical-blue-light/50',
    success: 'border-trusted-green/20 bg-trusted-green-light/50',
    warning: 'border-amber-200 bg-amber-50/50',
    error: 'border-red-200 bg-red-50/50',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className={cn(
            'fixed bottom-5 right-5 z-50 flex items-start gap-3 p-4 rounded-xl border bg-vet-surface shadow-card max-w-sm w-full',
            borders[type]
          )}
        >
          {icons[type]}
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-vet-text leading-snug">{title}</h4>
            {message && <p className="text-xs text-vet-secondary mt-0.5">{message}</p>}
          </div>
          <IconButton icon={<X className="w-3.5 h-3.5" />} ariaLabel="Fechar notificação" onClick={onDismiss} variant="ghost" size="sm" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
