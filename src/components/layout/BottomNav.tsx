import React from 'react';
import { cn } from '@/utils/cn';
import { NavItemId } from './Sidebar';
import { Home, FolderKanban, PlusCircle, BookOpen, User } from 'lucide-react';

export interface BottomNavProps {
  activeItem: NavItemId;
  onNavigate: (id: NavItemId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeItem, onNavigate }) => {
  const mobileItems: Array<{ id: NavItemId; label: string; icon: React.ReactNode; isAction?: boolean }> = [
    { id: 'dashboard', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'cases', label: 'Casos', icon: <FolderKanban className="w-5 h-5" /> },
    { id: 'newCase', label: 'Novo Caso', icon: <PlusCircle className="w-6 h-6" />, isAction: true },
    { id: 'literature', label: 'Literatura', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'account', label: 'Perfil', icon: <User className="w-5 h-5" /> },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-vet-surface border-t border-vet-border px-2 py-1 md:hidden flex items-center justify-around shadow-lg min-h-[56px]">
      {mobileItems.map((item) => {
        const isActive = item.id === activeItem;

        if (item.isAction) {
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="-mt-5 bg-clinical-blue text-white w-14 h-14 rounded-full shadow-xl hover:bg-clinical-blue-dark active:scale-95 transition-all flex items-center justify-center border-4 border-vet-surface min-h-[44px] min-w-[44px]"
              aria-label="Novo Caso"
            >
              {item.icon}
            </button>
          );
        }

        return (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={cn(
              'flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-lg text-[10px] font-medium transition-colors min-h-[44px] min-w-[44px]',
              isActive ? 'text-clinical-blue font-bold bg-clinical-blue-light/10' : 'text-vet-secondary hover:text-vet-text'
            )}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
