import React from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { LoadingState } from '@/components/ui/LoadingState';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, fallback }) => {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return <LoadingState message="Verificando autenticação e sessão médica..." size="lg" className="min-h-[300px]" />;
  }

  if (!isAuthenticated) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};
