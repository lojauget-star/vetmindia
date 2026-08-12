import React, { useState } from 'react';
import { BrandKit, ToneOfVoice } from '@/types/marketing.types';
import { Button } from '@/components/ui/Button';
import { Palette, Check, Save } from 'lucide-react';

export interface BrandKitEditorProps {
  brandKit: BrandKit;
  onSave: (updated: BrandKit) => Promise<void>;
}

export const BrandKitEditor: React.FC<BrandKitEditorProps> = ({ brandKit, onSave }) => {
  const [formData, setFormData] = useState<BrandKit>(brandKit);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({ ...formData, updatedAt: new Date().toISOString() });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setIsSaving(false);
    }
  };

  const tones: { id: ToneOfVoice; label: string; description: string }[] = [
    { id: 'EDITORIAL', label: 'Editorial', description: 'Sofisticado, baseado em publicações científicas renomadas' },
    { id: 'PREMIUM', label: 'Premium', description: 'Exclusivo, focado na medicina veterinária de alta precisão' },
    { id: 'MINIMALIST', label: 'Minimalista', description: 'Direto ao ponto, limpo e contemporâneo' },
    { id: 'CLINICAL', label: 'Clínico', description: 'Técnico, científico e altamente fundamentado' },
    { id: 'HUMAN', label: 'Humano', description: 'Acolhedor, focado na relação tutor-veterinário-paciente' },
  ];

  return (
    <form onSubmit={handleSubmit} className="p-6 bg-vet-surface border border-vet-border rounded-xl space-y-6 shadow-subtle">
      <div className="flex items-center justify-between border-b border-vet-border-subtle pb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-clinical-blue-light text-clinical-blue rounded-lg">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-vet-text">Kit de Marca (BrandKit)</h3>
            <p className="text-xs text-vet-secondary">Personalize a identidade visual e o tom de voz das postagens</p>
          </div>
        </div>

        <Button type="submit" isLoading={isSaving} leftIcon={savedSuccess ? <Check className="w-4 h-4 text-trusted-green" /> : <Save className="w-4 h-4" />}>
          {savedSuccess ? 'Salvo!' : 'Salvar BrandKit'}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-xs font-semibold text-vet-text mb-1.5">Nome da Clínica ou Veterinário</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-vet-surface-subtle border border-vet-border rounded-lg text-sm text-vet-text focus:outline-none focus:ring-2 focus:ring-clinical-blue"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-vet-text mb-1.5">URL do Logotipo</label>
          <input
            type="text"
            value={formData.logoUrl || ''}
            onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
            placeholder="https://..."
            className="w-full px-3.5 py-2.5 bg-vet-surface-subtle border border-vet-border rounded-lg text-sm text-vet-text focus:outline-none focus:ring-2 focus:ring-clinical-blue"
          />
        </div>
      </div>

      {/* Colors Grid */}
      <div>
        <label className="block text-xs font-semibold text-vet-text mb-2">Paleta de Cores Institucional</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <span className="block text-[11px] text-vet-secondary mb-1">Cor Primária</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.primaryColor}
                onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-vet-border cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-vet-text">{formData.primaryColor}</span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] text-vet-secondary mb-1">Cor Secundária</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.secondaryColor}
                onChange={(e) => setFormData({ ...formData, secondaryColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-vet-border cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-vet-text">{formData.secondaryColor}</span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] text-vet-secondary mb-1">Cor de Destaque</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.accentColor}
                onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-vet-border cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-vet-text">{formData.accentColor}</span>
            </div>
          </div>

          <div>
            <span className="block text-[11px] text-vet-secondary mb-1">Background</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-md border border-vet-border cursor-pointer"
              />
              <span className="text-xs font-mono font-bold text-vet-text">{formData.backgroundColor}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tone of Voice Selection */}
      <div>
        <label className="block text-xs font-semibold text-vet-text mb-2">Tom de Voz da Comunicação</label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {tones.map((t) => (
            <div
              key={t.id}
              onClick={() => setFormData({ ...formData, toneOfVoice: t.id })}
              className={`p-3.5 border rounded-xl cursor-pointer transition-all ${
                formData.toneOfVoice === t.id
                  ? 'border-clinical-blue bg-clinical-blue-light/30 shadow-xs'
                  : 'border-vet-border bg-vet-surface hover:border-vet-border-subtle'
              }`}
            >
              <span className="text-xs font-bold text-vet-text block mb-1">{t.label}</span>
              <span className="text-[11px] text-vet-secondary leading-tight block">{t.description}</span>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
};
