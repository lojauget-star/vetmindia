import React from 'react';
import { cn } from '@/utils/cn';
import { Search, X } from 'lucide-react';

export interface SearchInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = 'Buscar...', disabled, ...props }, ref) => {
    const hasValue = value !== undefined && value !== '';

    return (
      <div className="relative flex items-center w-full">
        <Search className="absolute left-3 w-4 h-4 text-vet-secondary pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={cn(
            'w-full bg-vet-surface border border-vet-border rounded-lg pl-9 pr-9 py-2 text-sm text-vet-text placeholder:text-vet-tertiary transition-all duration-150',
            'focus:outline-none focus:border-clinical-blue focus:ring-2 focus:ring-clinical-blue/20',
            'disabled:bg-vet-surface-subtle disabled:text-vet-tertiary disabled:cursor-not-allowed',
            className
          )}
          {...props}
        />
        {hasValue && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 rounded-full text-vet-secondary hover:text-vet-text hover:bg-vet-surface-subtle"
            aria-label="Limpar busca"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = 'SearchInput';
