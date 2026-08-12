import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState } from '@/components/ui/LoadingState';
import { useAuthStore } from '@/stores/useAuthStore';
import { documentService } from '@/services/document.service';
import { ClinicalDocument, DocumentType } from '@/types/document.types';
import {
  FileText,
  Plus,
  Download,
  Eye,
  Share2,
  CheckCircle2,
  Stethoscope,
  Pill,
  BookOpen,
  Calendar,
  UserCheck,
} from 'lucide-react';

export interface ClinicalDocumentsModuleProps {
  caseId: string;
}

export const ClinicalDocumentsModule: React.FC<ClinicalDocumentsModuleProps> = ({ caseId }) => {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<ClinicalDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState<DocumentType | null>(null);
  const [selectedPreviewDoc, setSelectedPreviewDoc] = useState<ClinicalDocument | null>(null);

  const docTypesList: { type: DocumentType; label: string; icon: React.ReactNode; desc: string }[] = [
    { type: 'PRESCRIPTION', label: 'Prescrição Médica', icon: <Pill className="w-4 h-4" />, desc: 'Receita médica veterinária oficial com dosagens' },
    { type: 'EXAM_REQUEST', label: 'Solicitação de Exames', icon: <Stethoscope className="w-4 h-4" />, desc: 'Pedido formal de exames laboratoriais e imagem' },
    { type: 'TUTOR_INSTRUCTIONS', label: 'Orientação ao Tutor', icon: <UserCheck className="w-4 h-4" />, desc: 'Guia de cuidados e recomendações pós-atendimento' },
    { type: 'CLINICAL_SUMMARY', label: 'Resumo Clínico', icon: <FileText className="w-4 h-4" />, desc: 'Síntese rápida da queixa, evolução e diagnósticos' },
    { type: 'CLINICAL_REPORT', label: 'Relatório Clínico', icon: <BookOpen className="w-4 h-4" />, desc: 'Laudo e parecer clínico detalhado do prontuário' },
    { type: 'FOLLOWUP_PLAN', label: 'Plano de Acompanhamento', icon: <Calendar className="w-4 h-4" />, desc: 'Cronograma de retornos, exames e reavaliações' },
  ];

  useEffect(() => {
    async function loadDocs() {
      if (!user) return;
      setIsLoading(true);
      try {
        const docs = await documentService.getDocumentsForCase(caseId, user.uid);
        setDocuments(docs);
      } catch (err) {
        console.error('Failed to load clinical documents:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadDocs();
  }, [caseId, user]);

  const handleGenerate = async (type: DocumentType) => {
    if (!user) return;
    setIsGenerating(type);
    try {
      const createdDoc = await documentService.generateDocument(caseId, type, user.uid);
      setDocuments([createdDoc, ...documents]);
    } catch (err: any) {
      alert(`Falha ao gerar documento: ${err.message}`);
    } finally {
      setIsGenerating(null);
    }
  };

  const handleDownload = (docItem: ClinicalDocument) => {
    const blob = new Blob([docItem.contentHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docItem.type.toLowerCase()}_${docItem.caseId}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShare = (docItem: ClinicalDocument) => {
    if (navigator.share) {
      navigator.share({
        title: docItem.title,
        text: `Documento clínico oficial Vetmind: ${docItem.title}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link do documento copiado para a área de transferência!');
    }
  };

  if (isLoading) {
    return <LoadingState message="Carregando documentos clínicos do caso no Cloud Firestore..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-4 bg-vet-surface border border-vet-border rounded-xl flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-vet-text">Documentos Clínicos Oficiais</h3>
          <p className="text-xs text-vet-secondary">
            Geração de PDFs derivados diretamente dos dados do atendimento e perfil do veterinário.
          </p>
        </div>
        <Badge variant="trusted" size="sm">PDFs Protegidos & Armazenados</Badge>
      </div>

      {/* 6 Document Type Generators Grid */}
      <div>
        <h4 className="text-sm font-bold text-vet-text mb-3">Gerar Novo Documento Clínico</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {docTypesList.map((item) => (
            <div
              key={item.type}
              className="p-3 bg-vet-surface border border-vet-border-subtle hover:border-clinical-blue rounded-xl flex flex-col justify-between transition-colors"
            >
              <div>
                <div className="flex items-center gap-2 font-bold text-xs text-vet-text mb-1">
                  <span className="p-1 bg-clinical-blue-light text-clinical-blue rounded">{item.icon}</span>
                  {item.label}
                </div>
                <p className="text-[11px] text-vet-secondary leading-tight">{item.desc}</p>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="mt-3 w-full"
                onClick={() => handleGenerate(item.type)}
                isLoading={isGenerating === item.type}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
              >
                Gerar PDF
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Generated Documents List */}
      <div>
        <h4 className="text-sm font-bold text-vet-text mb-3">Documentos Emitidos ({documents.length})</h4>
        {documents.length === 0 ? (
          <div className="p-8 text-center bg-vet-surface border border-vet-border rounded-xl">
            <FileText className="w-8 h-8 text-vet-secondary mx-auto mb-2" />
            <p className="text-xs font-semibold text-vet-text">Nenhum documento emitido para este atendimento ainda.</p>
            <p className="text-[11px] text-vet-secondary mt-1">Utilize os botões acima para gerar um PDF oficial.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((docItem) => (
              <Card key={docItem.id} variant="default" className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-trusted-green-light text-trusted-green rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-vet-text">{docItem.title}</h5>
                    <p className="text-xs text-vet-secondary mt-0.5">
                      Emitido por <strong>{docItem.metadata.vetName}</strong> (CRMV: {docItem.metadata.crmv}) •{' '}
                      {new Date(docItem.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPreviewDoc(docItem)}
                    leftIcon={<Eye className="w-4 h-4" />}
                  >
                    Visualizar
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownload(docItem)}
                    leftIcon={<Download className="w-4 h-4" />}
                  >
                    Baixar
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleShare(docItem)}
                    leftIcon={<Share2 className="w-4 h-4" />}
                  >
                    Compartilhar
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* PDF Modal Preview */}
      {selectedPreviewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 bg-vet-surface border-b border-vet-border flex items-center justify-between">
              <h3 className="text-sm font-bold text-vet-text">{selectedPreviewDoc.title} - Pré-visualização PDF</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPreviewDoc(null)}>
                Fechar
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-gray-100">
              <iframe
                title="Document Preview"
                srcDoc={selectedPreviewDoc.contentHtml}
                className="w-full h-[600px] border border-gray-300 rounded shadow-sm bg-white"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
