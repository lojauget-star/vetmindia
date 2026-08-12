import React from 'react';
import { Card, CardHeader, CardTitle } from '../ui/Card';
import { Button } from '../ui/Button';
import { FileText, Download, Printer } from 'lucide-react';

export interface DocumentCardProps {
  title: string;
  typeLabel: string;
  createdAt: string;
  downloadUrl?: string;
  onDownload?: () => void;
  onPrint?: () => void;
  className?: string;
}

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title,
  typeLabel,
  createdAt,
  downloadUrl,
  onDownload,
  onPrint,
  className,
}) => {
  return (
    <Card variant="default" padding="sm" className={className}>
      <CardHeader className="flex-row items-center justify-between pb-0 border-b-0 mb-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-clinical-blue-light text-clinical-blue rounded-lg">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <CardTitle className="text-sm">{title}</CardTitle>
            <p className="text-xs text-vet-secondary">
              {typeLabel} • {createdAt}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onPrint && (
            <Button variant="ghost" size="sm" onClick={onPrint} leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Imprimir
            </Button>
          )}
          {(onDownload || downloadUrl) && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDownload || (() => window.open(downloadUrl, '_blank'))}
              leftIcon={<Download className="w-3.5 h-3.5" />}
            >
              Baixar PDF
            </Button>
          )}
        </div>
      </CardHeader>
    </Card>
  );
};
