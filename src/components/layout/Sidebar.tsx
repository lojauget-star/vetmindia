import React, { useState } from 'react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/stores/useAuthStore';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  Stethoscope,
  PlusCircle,
  LayoutDashboard,
  FolderKanban,
  Users,
  BookOpen,
  Wrench,
  Sparkles,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react';

export type NavItemId =
  | 'newCase'
  | 'dashboard'
  | 'cases'
  | 'patients'
  | 'literature'
  | 'tools'
  | 'marketing'
  | 'account'
  | 'settings';

export interface NavItem {
  id: NavItemId;
  label: string;
  icon: React.ReactNode;
  isAction?: boolean;
}

export interface SidebarProps {
  activeItem: NavItemId;
  onNavigate: (id: NavItemId) => void;
  className?: string;
}

export const navItems: NavItem[] = [
  { id: 'newCase', label: 'Novo caso', icon: <PlusCircle className="w-5 h-5" />, isAction: true },
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'cases', label: 'Casos', icon: <FolderKanban className="w-5 h-5" /> },
  { id: 'patients', label: 'Pacientes', icon: <Users className="w-5 h-5" /> },
  { id: 'literature', label: 'Literatura', icon: <BookOpen className="w-5 h-5" /> },
  { id: 'tools', label: 'Ferramentas', icon: <Wrench className="w-5 h-5" /> },
  { id: 'marketing', label: 'Estúdio de Marketing', icon: <Sparkles className="w-5 h-5" /> },
  { id: 'account', label: 'Minha Conta', icon: <User className="w-5 h-5" /> },
  { id: 'settings', label: 'Configurações', icon: <Settings className="w-5 h-5" /> },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeItem, onNavigate, className }) => {
  const { user, profile, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'relative flex flex-col h-screen bg-vet-surface border-r border-vet-border transition-all duration-300 z-30 select-none shrink-0',
        isCollapsed ? 'w-20' : 'w-64',
        className
      )}
    >
      {/* Collapse Toggle Button (Tablet/Desktop) */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-7 p-1 bg-vet-surface border border-vet-border rounded-full shadow-subtle text-vet-secondary hover:text-vet-text z-40 hidden md:flex"
        aria-label={isCollapsed ? 'Expandir menu' : 'Recolher menu'}
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Brand Header */}
      <div className="flex items-center gap-3 p-5 border-b border-vet-border-subtle">
        <div className="p-2.5 bg-clinical-blue text-white rounded-xl shadow-subtle shrink-0">
          <Stethoscope className="w-6 h-6" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-lg font-bold text-vet-text tracking-tight leading-none">Vetmind</span>
            <span className="text-[10px] text-vet-secondary font-medium tracking-wide mt-1">
              Clinical Engine
            </span>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = item.id === activeItem;

          if (item.isAction) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3.5 py-3 rounded-xl font-semibold text-sm transition-all shadow-subtle my-2',
                  'bg-clinical-blue text-white hover:bg-clinical-blue-dark active:scale-[0.98]',
                  isCollapsed && 'justify-center px-0'
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!isCollapsed && <span>{item.label}</span>}
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-clinical-blue-light text-clinical-blue font-semibold border-l-4 border-clinical-blue'
                  : 'text-vet-secondary hover:text-vet-text hover:bg-vet-surface-subtle',
                isCollapsed && 'justify-center px-0 border-l-0'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={cn('shrink-0', isActive ? 'text-clinical-blue' : 'text-vet-secondary')}>
                {item.icon}
              </span>
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </button>
          );
        })}
      </div>

      {/* User Profile & Plan Footer */}
      <div className="p-4 border-t border-vet-border-subtle bg-vet-surface-subtle space-y-3">
        {!isCollapsed && (
          <div className="flex items-center justify-between">
            <Badge variant="trusted" size="sm">
              Plano Profissional
            </Badge>
            <button
              onClick={() => logout()}
              className="text-xs text-vet-secondary hover:text-red-600 flex items-center gap-1"
              title="Sair da Conta"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div
          onClick={() => onNavigate('account')}
          className={cn(
            'flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-vet-border-subtle transition-colors',
            isCollapsed && 'justify-center p-0 hover:bg-transparent'
          )}
        >
          <Avatar name={profile?.fullName || user?.displayName || 'Veterinário'} src={profile?.logoUrl} size="md" />
          {!isCollapsed && (
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold text-vet-text truncate">
                {profile?.fullName || user?.displayName || 'Médico Veterinário'}
              </span>
              <span className="text-[10px] text-vet-secondary truncate">
                CRMV: {profile?.crmv || 'Não informado'}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
