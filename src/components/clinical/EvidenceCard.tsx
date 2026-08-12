import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { EvidenceBadge } from './EvidenceBadge';
import { Evidence } from '@/types/clinical.types';
import { ExternalLink, BookMarked } from 'lucide-react';

export interface EvidenceCardProps {
  evidence: Evidence;
  className?: string;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence, className }) => {
  return (
    <Card variant="paper" className={className}>
      <CardHeader className="flex-row items-start justify-between pb-2">
        <div className="flex items-start gap-2">
          <BookMarked className="w-4 h-4 text-clinical-blue shrink-0 mt-1" />
          <div>
            <CardTitle className="text-sm font-semibold">{evidence.paperTitle}</CardTitle>
            <p className="text-xs text-vet-secondary mt-0.5">
              {evidence.authors.join(', ')} ({evidence.publicationYear}) — <span className="italic">{evidence.journal}</span>
            </p>
          </div>
        </div>
        <EvidenceBadge score={evidence.relevanceScore} />
      </CardHeader>

      <CardContent>
        <div className="p-3 bg-vet-surface rounded-lg border border-vet-border-subtle text-xs text-vet-text italic leading-relaxed">
          "{evidence.snippet}"
        </div>
        {evidence.doi && (
          <a
            href={`https://doi.org/${evidence.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-clinical-blue font-medium mt-2 hover:underline"
          >
            Ver artigo original (DOI: {evidence.doi})
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
};
