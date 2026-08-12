import React, { useState } from 'react';
import { Sidebar, NavItemId } from './Sidebar';
import { BottomNav } from './BottomNav';
import { MobileTopBar } from './MobileTopBar';
import { Drawer } from '@/components/ui/Drawer';

export interface ClinicalLayoutProps {
  activeItem: NavItemId;
  onNavigate: (id: NavItemId) => void;
  children: React.ReactNode;
}

export const ClinicalLayout: React.FC<ClinicalLayoutProps> = ({
  activeItem,
  onNavigate,
  children,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileNavigate = (id: NavItemId) => {
    onNavigate(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-vet-bg text-vet-text bg-paper-texture">
      {/* Desktop & Tablet Fixed Sidebar */}
      <Sidebar activeItem={activeItem} onNavigate={onNavigate} className="hidden md:flex" />

      {/* Mobile Top Bar */}
      <MobileTopBar
        onOpenMenu={() => setIsMobileMenuOpen(true)}
        onNavigate={handleMobileNavigate}
      />

      {/* Mobile Slide-Over Drawer Navigation */}
      <Drawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        title="Menu Vetmind"
        position="left"
      >
        <div className="py-2">
          <Sidebar
            activeItem={activeItem}
            onNavigate={handleMobileNavigate}
            className="w-full h-auto border-none shadow-none"
          />
        </div>
      </Drawer>

      {/* Main App Workspace Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Scrollable View Content with Top & Bottom Mobile Spacing */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pt-16 md:pt-6 pb-20 md:pb-8">
          {children}
        </main>
      </div>

      {/* Fixed Mobile Bottom Navigation */}
      <BottomNav activeItem={activeItem} onNavigate={handleMobileNavigate} />
    </div>
  );
};
