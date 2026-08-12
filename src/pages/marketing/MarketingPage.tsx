import React, { useState, useEffect } from 'react';
import { PageTransition } from '@/components/motion/PageTransition';
import { MarketingStudioModule } from '@/components/marketing/MarketingStudioModule';
import { BrandKitEditor } from '@/components/marketing/BrandKitEditor';
import { marketingRepository } from '@/repositories/marketing.repository';
import { useAuthStore } from '@/stores/useAuthStore';
import { BrandKit } from '@/types/marketing.types';
import { Sparkles, Palette, Layers } from 'lucide-react';

export const MarketingPage: React.FC = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'studio' | 'brandkit'>('studio');
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  useEffect(() => {
    if (!user) return;
    marketingRepository.getBrandKit(user.uid).then(setBrandKit);
  }, [user]);

  const handleSaveBrandKit = async (updated: BrandKit) => {
    if (!user) return;
    const saved = await marketingRepository.saveBrandKit(updated);
    setBrandKit(saved);
  };

  return (
    <PageTransition className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-vet-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-vet-text tracking-tight flex items-center gap-2.5">
            <Sparkles className="w-6 h-6 text-clinical-blue" />
            Estúdio de Marketing
          </h1>
          <p className="text-xs text-vet-secondary mt-0.5">
            Gere posts e comunicados científicos anonimizados a partir de prontuários reais.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-vet-surface-subtle p-1 rounded-xl border border-vet-border">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'studio'
                ? 'bg-vet-surface text-clinical-blue shadow-xs font-bold'
                : 'text-vet-secondary hover:text-vet-text'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Estúdio de Posts
          </button>

          <button
            onClick={() => setActiveTab('brandkit')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'brandkit'
                ? 'bg-vet-surface text-clinical-blue shadow-xs font-bold'
                : 'text-vet-secondary hover:text-vet-text'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            Kit de Marca (BrandKit)
          </button>
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'studio' && <MarketingStudioModule />}
      {activeTab === 'brandkit' && brandKit && (
        <BrandKitEditor brandKit={brandKit} onSave={handleSaveBrandKit} />
      )}
    </PageTransition>
  );
};

export default MarketingPage;
