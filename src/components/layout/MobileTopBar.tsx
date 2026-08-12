import React, { useState } from 'react';
import { Menu, Bell, Sparkles, X } from 'lucide-react';
import { NavItemId } from './Sidebar';

export interface MobileTopBarProps {
  onOpenMenu: () => void;
  onNavigate: (id: NavItemId) => void;
  unreadNotificationsCount?: number;
}

export const MobileTopBar: React.FC<MobileTopBarProps> = ({
  onOpenMenu,
  onNavigate,
  unreadNotificationsCount = 2,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-vet-surface border-b border-vet-border px-4 h-14 md:hidden flex items-center justify-between shadow-sm">
        {/* Menu Hamburger Toggle Button */}
        <button
          onClick={onOpenMenu}
          className="p-2.5 rounded-lg text-vet-text hover:bg-vet-bg active:bg-vet-border-subtle transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Abrir Menu Principal"
        >
          <Menu className="w-6 h-6 text-vet-text" />
        </button>

        {/* Vetmind Logo */}
        <button
          onClick={() => onNavigate('dashboard')}
          className="flex items-center gap-2 font-bold text-clinical-blue min-h-[44px] px-2"
        >
          <div className="w-8 h-8 rounded-lg bg-clinical-blue text-white flex items-center justify-center shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-base tracking-tight font-extrabold text-vet-text">
            Vet<span className="text-clinical-blue">mind</span>
          </span>
        </button>

        {/* Notifications Button */}
        <button
          onClick={() => setShowNotifications(!showNotifications)}
          className="relative p-2.5 rounded-lg text-vet-text hover:bg-vet-bg active:bg-vet-border-subtle transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Notificações"
        >
          <Bell className="w-6 h-6 text-vet-secondary" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-clinical-blue rounded-full ring-2 ring-white" />
          )}
        </button>
      </header>

      {/* Notifications Popover Modal on Mobile */}
      {showNotifications && (
        <div className="fixed inset-0 z-50 bg-black/50 md:hidden flex items-start justify-center pt-16 px-4">
          <div className="bg-vet-surface border border-vet-border rounded-xl w-full max-w-sm p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-vet-border-subtle">
              <h4 className="text-sm font-bold text-vet-text flex items-center gap-2">
                <Bell className="w-4 h-4 text-clinical-blue" /> Notificações do Sistema
              </h4>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-1 rounded text-vet-secondary hover:text-vet-text min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-clinical-blue-light/10 border border-clinical-blue-light rounded-lg">
                <p className="font-bold text-vet-text">Análise RAG Concluída</p>
                <p className="text-vet-secondary text-[11px]">O motor Gemini finalizou a síntese clínica do Atendimento Thor.</p>
              </div>
              <div className="p-2.5 bg-vet-bg border border-vet-border-subtle rounded-lg">
                <p className="font-bold text-vet-text">Prescrição Emitida</p>
                <p className="text-vet-secondary text-[11px]">Documento oficial gerado com dosagem determinística.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
