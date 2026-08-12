import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Hypothesis } from '@/types/clinical.types';
import { CheckCircle2, Stethoscope, AlertCircle } from 'lucide-react';

export interface HypothesisCardProps {
  hypothesis: Hypothesis;
  onSelect?: (id: string) => void;
  isSelected?: boolean;
  className?: string;
}

export const HypothesisCard: React.FC<HypothesisCardProps> = ({
  hypothesis,
  onSelect,
  isSelected = false,
  className,
}) => {
  const percentage = Math.round(hypothesis.probabilityScore * 100);

  return (
    <Card
      variant={isSelected ? 'interactive' : 'default'}
      className={className}
    >
      <CardHeader className="flex-row items-start justify-between pb-3">
        <div>
          <div className="flex items-center gap-2">
            <CardTitle>{hypothesis.diseaseName}</CardTitle>
            {hypothesis.icdVetCode && (
              <span className="text-xs font-mono bg-vet-border-subtle px-1.5 py-0.5 rounded text-vet-secondary">
                {hypothesis.icdVetCode}
              </span>
            )}
          </div>
          <p className="text-xs text-vet-secondary mt-1">{hypothesis.reasoning}</p>
        </div>
        <Badge
          variant={percentage >= 70 ? 'clinical' : percentage >= 40 ? 'warning' : 'neutral'}
        >
          {percentage}% Probabilidade
        </Badge>
      </CardHeader>

      <CardContent className="space-y-3">
        {hypothesis.supportingFindings.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-trusted-green flex items-center gap-1 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> Achados Compatíveis
            </h5>
            <ul className="text-xs text-vet-text list-disc list-inside space-y-0.5">
              {hypothesis.supportingFindings.map((finding, idx) => (
                <li key={idx}>{finding}</li>
              ))}
            </ul>
          </div>
        )}

        {hypothesis.recommendedExams.length > 0 && (
          <div>
            <h5 className="text-xs font-semibold text-clinical-blue flex items-center gap-1 mb-1">
              <Stethoscope className="w-3.5 h-3.5" /> Exames Recomendados
            </h5>
            <div className="flex flex-wrap gap-1.5">
              {hypothesis.recommendedExams.map((exam, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-clinical-blue-light text-clinical-blue px-2 py-0.5 rounded-full font-medium"
                >
                  {exam}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>

      {onSelect && (
        <CardFooter className="pt-3">
          <Button
            variant={isSelected ? 'success' : 'outline'}
            size="sm"
            onClick={() => onSelect(hypothesis.id)}
            leftIcon={isSelected ? <CheckCircle2 className="w-4 h-4" /> : undefined}
          >
            {isSelected ? 'Hipótese Selecionada' : 'Selecionar Conduta'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
