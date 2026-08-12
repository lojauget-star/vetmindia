import React from 'react';
import { Badge } from '../ui/Badge';
import { BookOpen } from 'lucide-react';

export interface EvidenceBadgeProps {
  score: number; // 0.0 to 1.0
  className?: string;
}

export const EvidenceBadge: React.FC<EvidenceBadgeProps> = ({ score, className }) => {
  const percentage = Math.round(score * 100);

  const getVariant = (s: number) => {
    if (s >= 0.85) return 'trusted';
    if (s >= 0.70) return 'clinical';
    return 'warning';
  };

  return (
    <Badge
      variant={getVariant(score)}
      icon={<BookOpen className="w-3 h-3" />}
      className={className}
    >
      Evidência RAG: {percentage}%
    </Badge>
  );
};
