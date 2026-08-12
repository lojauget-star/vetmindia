import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Loader2 } from 'lucide-react';

export interface SaveConfirmationProps {
  isSaving: boolean;
  lastSavedAt?: string;
}

export const SaveConfirmation: React.FC<SaveConfirmationProps> = ({ isSaving, lastSavedAt }) => {
  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <AnimatePresence mode="wait">
        {isSaving ? (
          <motion.span
            key="saving"
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 4 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1 text-clinical-blue"
          >
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Salvando...</span>
          </motion.span>
        ) : (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1 text-trusted-green"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Salvo {lastSavedAt ? `às ${lastSavedAt}` : 'no Firestore'}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
};
