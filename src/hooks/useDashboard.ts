import { useState, useEffect, useCallback } from 'react';
import { dashboardService, DashboardData } from '@/services/dashboard.service';
import { useAuthStore } from '@/stores/useAuthStore';

export interface UseDashboardResult {
  data: DashboardData;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useDashboard = (): UseDashboardResult => {
  const { user, isAuthenticated } = useAuthStore();

  const [data, setData] = useState<DashboardData>({
    cases: [],
    patients: [],
    analyses: [],
    documents: [],
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!user || !isAuthenticated) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await dashboardService.getDashboardData(user.uid);
      setData(result);
    } catch (err: any) {
      console.error('[useDashboard] Error loading dashboard data:', err);
      setError(err.message || 'Falha ao carregar dados do Dashboard.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isAuthenticated]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const isEmpty =
    data.cases.length === 0 &&
    data.patients.length === 0 &&
    data.analyses.length === 0 &&
    data.documents.length === 0;

  return {
    data,
    isLoading,
    isError: error !== null,
    isEmpty,
    error,
    refetch: fetchDashboard,
  };
};
