import React from 'react';
import { cn } from '@/utils/cn';
import { Loader2 } from 'lucide-react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  ariaLabel: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      className,
      icon,
      ariaLabel,
      variant = 'ghost',
      size = 'md',
      isLoading = false,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-clinical-blue text-white hover:bg-clinical-blue-dark focus:ring-clinical-blue',
      secondary: 'bg-vet-surface text-vet-text border border-vet-border hover:bg-vet-surface-subtle focus:ring-vet-secondary',
      outline: 'border border-vet-border text-vet-text hover:bg-vet-surface-subtle focus:ring-vet-secondary',
      ghost: 'text-vet-secondary hover:text-vet-text hover:bg-vet-surface-subtle focus:ring-vet-secondary',
      danger: 'text-red-600 hover:bg-red-50 focus:ring-red-500',
    };

    const sizes = {
      sm: 'w-8 h-8 text-xs',
      md: 'w-9 h-9 text-sm',
      lg: 'w-11 h-11 text-base',
    };

    return (
      <button
        ref={ref}
        aria-label={ariaLabel}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
      </button>
    );
  }
);

IconButton.displayName = 'IconButton';
