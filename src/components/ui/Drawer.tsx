import React, { useEffect } from 'react';
import { cn } from '@/utils/cn';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { IconButton } from './IconButton';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  position?: 'left' | 'right';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  position = 'right',
  children,
  footer,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const slideVariants = {
    right: { initial: { x: '100%' }, animate: { x: 0 }, exit: { x: '100%' } },
    left: { initial: { x: '-100%' }, animate: { x: 0 }, exit: { x: '-100%' } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-vet-text/40 backdrop-blur-xs"
          />

          {/* Drawer Panel */}
          <motion.div
            initial={slideVariants[position].initial}
            animate={slideVariants[position].animate}
            exit={slideVariants[position].exit}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={cn(
              'relative z-10 w-full max-w-md bg-vet-surface h-full shadow-2xl flex flex-col',
              position === 'right' ? 'ml-auto border-l border-vet-border' : 'mr-auto border-r border-vet-border'
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-vet-border-subtle">
              <h3 className="text-base font-semibold text-vet-text">{title}</h3>
              <IconButton icon={<X className="w-4 h-4" />} ariaLabel="Fechar painel" onClick={onClose} variant="ghost" size="sm" />
            </div>

            {/* Body */}
            <div className="flex-1 p-5 overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 bg-vet-surface-subtle border-t border-vet-border-subtle flex justify-end gap-2">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
