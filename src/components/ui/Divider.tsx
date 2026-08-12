import React from 'react';
import { cn } from '@/utils/cn';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
}

export const Divider: React.FC<DividerProps> = ({
  className,
  orientation = 'horizontal',
  label,
  ...props
}) => {
  if (orientation === 'vertical') {
    return <div className={cn('w-px bg-vet-border self-stretch my-1', className)} {...props} />;
  }

  if (label) {
    return (
      <div className={cn('flex items-center w-full my-4', className)} {...props}>
        <div className="flex-1 border-t border-vet-border" />
        <span className="px-3 text-xs font-medium text-vet-tertiary uppercase tracking-wider select-none">
          {label}
        </span>
        <div className="flex-1 border-t border-vet-border" />
      </div>
    );
  }

  return <hr className={cn('w-full border-t border-vet-border my-4', className)} {...props} />;
};
