import React, { useState, useEffect } from 'react';
import { ClinicalCase } from '@/types/clinical.types';
import { MarketingProject, MarketingFormat } from '@/types/marketing.types';
import { marketingService } from '@/services/marketing.service';
import { caseRepository } from '@/repositories/case.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { Button } from '@/components/ui/Button';
import {
  Sparkles,
  ShieldCheck,
  Share2,
  Copy,
  Download,
  Image as ImageIcon,
  CheckCircle2,
  Edit3,
} from 'lucide-react';

export interface MarketingStudioModuleProps {
  initialCaseId?: string;
}

export const MarketingStudioModule: React.FC<MarketingStudioModuleProps> = ({ initialCaseId }) => {
  const { user } = useAuthStore();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(initialCaseId || '');
  const [format, setFormat] = useState<MarketingFormat>('INSTAGRAM_POST');
  const [project, setProject] = useState<MarketingProject | null>(null);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Editable copy fields
  const [editHeadline, setEditHeadline] = useState<string>('');
  const [editCaption, setEditCaption] = useState<string>('');
  const [editHashtags, setEditHashtags] = useState<string>('');

  useEffect(() => {
    if (!user) return;
    caseRepository.getCasesByUser(user.uid).then((res: ClinicalCase[]) => {
      setCases(res);
      if (!selectedCaseId && res.length > 0) {
        setSelectedCaseId(res[0].id);
      }
    });
  }, [user]);

  const handleGenerateContent = async () => {
    if (!user || !selectedCaseId) return;
    setIsGenerating(true);
    setErrorMessage(null);
    try {
      const newProj = await marketingService.createProjectFromCase(selectedCaseId, format, user.uid);
      setProject(newProj);
      setEditHeadline(newProj.copy.headline);
      setEditCaption(newProj.copy.caption);
      setEditHashtags(newProj.copy.hashtags.join(' '));
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao gerar conteúdo de marketing.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveEdits = async () => {
    if (!project || !user) return;
    setIsSaving(true);
    try {
      const hashtagsArray = editHashtags.split(' ').filter((h) => h.trim().length > 0);
      const updatedProj = await marketingService.updateProject(
        project.id,
        {
          copy: {
            ...project.copy,
            headline: editHeadline,
            caption: editCaption,
            hashtags: hashtagsArray,
          },
        },
        user.uid
      );
      setProject(updatedProj);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyBundle = () => {
    if (!project) return;
    const bundleText = `${editHeadline}\n\n${editCaption}\n\n${editHashtags}`;
    navigator.clipboard.writeText(bundleText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2500);
  };

  const handleExportFull = () => {
    if (!project) return;
    const exportText = marketingService.exportProjectBundle(project);
    const blob = new Blob([exportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vetmind_marketing_${project.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-clinical-blue/10 via-trusted-green/10 to-transparent border border-vet-border rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="px-3 py-1 bg-clinical-blue-light text-clinical-blue text-xs font-bold rounded-full uppercase tracking-wider inline-block mb-2">
            Estúdio de Marketing Institucional
          </span>
          <h2 className="text-xl font-bold text-vet-text">Transforme Casos Clínicos em Conteúdo de Autoridade</h2>
          <p className="text-xs text-vet-secondary mt-1">
            Geração de posts, copywriting e artes gráficas com anonimização automática anti-vazamento de dados do tutor.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-trusted-green bg-trusted-green-light/40 px-3.5 py-2 rounded-lg">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>Privacidade Garantida LGPD/CRMV</span>
        </div>
      </div>

      {/* Main Grid: Controls & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Form & Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-5 bg-vet-surface border border-vet-border rounded-xl space-y-5 shadow-subtle">
            <h3 className="text-sm font-bold text-vet-text">1. Selecionar Caso Clínico</h3>

            <div>
              <label className="block text-xs font-medium text-vet-secondary mb-1.5">Caso Prontuário</label>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-vet-surface-subtle border border-vet-border rounded-lg text-sm text-vet-text focus:outline-none focus:ring-2 focus:ring-clinical-blue"
              >
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.caseNumber} - {c.title} ({c.chiefComplaint})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-vet-secondary mb-1.5">Formato de Saída</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'INSTAGRAM_POST', label: 'Post Instagram (1:1)' },
                  { id: 'INSTAGRAM_STORIES', label: 'Story Instagram (9:16)' },
                  { id: 'LINKEDIN_ARTICLE', label: 'Artigo LinkedIn' },
                  { id: 'PATIENT_CASE_STUDY', label: 'Estudo Clínico' },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFormat(f.id as MarketingFormat)}
                    className={`px-3 py-2 text-xs font-medium rounded-lg border text-left transition-all ${
                      format === f.id
                        ? 'border-clinical-blue bg-clinical-blue-light/30 text-clinical-blue font-bold'
                        : 'border-vet-border text-vet-text hover:bg-vet-surface-subtle'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <Button
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isGenerating}
              leftIcon={<Sparkles className="w-4 h-4" />}
              onClick={handleGenerateContent}
              disabled={!selectedCaseId}
            >
              Gerar Conteúdo com IA
            </Button>

            {errorMessage && (
              <p className="text-xs text-red-600 font-medium p-2.5 bg-red-50 rounded-lg">{errorMessage}</p>
            )}
          </div>

          {/* Anonymization Audit Card */}
          {project && (
            <div className="p-5 bg-vet-surface border border-vet-border rounded-xl space-y-3 shadow-subtle">
              <h4 className="text-xs font-bold text-vet-text flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-trusted-green" />
                Auditoria de Anonimização Aplicada
              </h4>
              <ul className="text-xs text-vet-secondary space-y-1.5 list-disc pl-4">
                <li>Espécie: {project.anonymizedContent.sanitizedSpecies} ({project.anonymizedContent.sanitizedBreed})</li>
                <li>Queixa Sanitizada: "{project.anonymizedContent.sanitizedChiefComplaint}"</li>
                {project.anonymizedContent.removedFields.map((field, idx) => (
                  <li key={idx} className="text-trusted-green font-medium">
                    Campos removidos: {field}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Live Post Preview & Copy Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {project ? (
            <div className="p-6 bg-vet-surface border border-vet-border rounded-xl space-y-6 shadow-subtle">
              <div className="flex items-center justify-between border-b border-vet-border-subtle pb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-trusted-green"></span>
                  <h3 className="text-sm font-bold text-vet-text">Preview do Post de Autoridade</h3>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={copiedNotification ? <CheckCircle2 className="w-3.5 h-3.5 text-trusted-green" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={handleCopyBundle}
                  >
                    {copiedNotification ? 'Copiado!' : 'Copiar Texto'}
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                    onClick={handleExportFull}
                  >
                    Exportar Pacote
                  </Button>
                </div>
              </div>

              {/* Graphic Asset Card */}
              {project.imageUrl && (
                <div className="rounded-xl border border-vet-border overflow-hidden bg-vet-bg flex items-center justify-center p-4">
                  <img
                    src={project.imageUrl}
                    alt={project.copy.altText}
                    className="max-h-96 object-contain rounded-lg shadow-sm"
                  />
                </div>
              )}

              {/* Editable Copy Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-vet-text mb-1">Headline (Título do Post)</label>
                  <input
                    type="text"
                    value={editHeadline}
                    onChange={(e) => setEditHeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-vet-surface-subtle border border-vet-border rounded-lg text-sm text-vet-text font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-vet-text mb-1">Legenda Principal (Caption)</label>
                  <textarea
                    rows={5}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full px-3 py-2 bg-vet-surface-subtle border border-vet-border rounded-lg text-xs text-vet-text leading-relaxed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-vet-text mb-1">Hashtags Estratégicas</label>
                  <input
                    type="text"
                    value={editHashtags}
                    onChange={(e) => setEditHashtags(e.target.value)}
                    className="w-full px-3 py-2 bg-vet-surface-subtle border border-vet-border rounded-lg text-xs font-mono text-clinical-blue"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    isLoading={isSaving}
                    leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                    onClick={handleSaveEdits}
                  >
                    Salvar Alterações
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-vet-surface border border-vet-border rounded-xl space-y-3">
              <ImageIcon className="w-10 h-10 text-vet-tertiary mx-auto" />
              <h4 className="text-sm font-bold text-vet-text">Nenhum projeto gerado ainda</h4>
              <p className="text-xs text-vet-secondary max-w-sm mx-auto">
                Selecione um prontuário ao lado e clique em "Gerar Conteúdo com IA" para compilar postagens e artes personalizadas.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
