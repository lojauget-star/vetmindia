import React from 'react';
import { cn } from '@/utils/cn';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Patient } from '@/types/clinical.types';
import { User, Tag, Calendar, Weight } from 'lucide-react';

export interface PatientHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  patient: Patient;
  compact?: boolean;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  className,
  patient,
  compact = false,
  ...props
}) => {
  const speciesLabel = {
    CANINE: 'Cão',
    FELINE: 'Gato',
    EQUINE: 'Cavalo',
    EXOTIC: 'Exótico',
    OTHER: 'Outro',
  }[patient.species];

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 bg-paper-texture border border-vet-border rounded-xl shadow-subtle',
        compact && 'p-3',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-3.5">
        <Avatar name={patient.name} size={compact ? 'md' : 'lg'} />
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-vet-text leading-snug">{patient.name}</h3>
            <Badge variant="clinical" size="sm">
              {speciesLabel}
            </Badge>
          </div>
          <div className="flex items-center gap-3 text-xs text-vet-secondary mt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-vet-tertiary" />
              {patient.breed}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-vet-tertiary" />
              {patient.ageYears}a {patient.ageMonths}m
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Weight className="w-3.5 h-3.5 text-vet-tertiary" />
              {patient.weightKg} kg
            </span>
          </div>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end text-xs text-vet-secondary">
        <span className="flex items-center gap-1 font-medium text-vet-text">
          <User className="w-3.5 h-3.5 text-clinical-blue" />
          Tutor: {patient.tutorName}
        </span>
        <span className="mt-0.5">{patient.tutorContact}</span>
        {patient.microchipId && (
          <span className="text-[10px] text-vet-tertiary mt-0.5">Chip: {patient.microchipId}</span>
        )}
      </div>
    </div>
  );
};
