import { useState, useEffect, useRef } from 'react';

export interface UseAutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  delayMs?: number;
  enabled?: boolean;
}

export interface UseAutosaveResult {
  isSaving: boolean;
  lastSavedAt: string | null;
  hasUnsavedChanges: boolean;
  triggerManualSave: () => Promise<void>;
}

export function useAutosave<T>({
  data,
  onSave,
  delayMs = 1500,
  enabled = true,
}: UseAutosaveOptions<T>): UseAutosaveResult {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const dataRef = useRef<T>(data);
  const isFirstRender = useRef(true);

  // Track manual changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      dataRef.current = data;
      return;
    }

    if (JSON.stringify(dataRef.current) !== JSON.stringify(data)) {
      setHasUnsavedChanges(true);
      dataRef.current = data;
    }
  }, [data]);

  // Debounced Autosave effect
  useEffect(() => {
    if (!enabled || !hasUnsavedChanges) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSave(dataRef.current);
        setLastSavedAt(new Date().toLocaleTimeString());
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('[useAutosave] Failed to autosave:', err);
      } finally {
        setIsSaving(false);
      }
    }, delayMs);

    return () => clearTimeout(timer);
  }, [data, delayMs, enabled, hasUnsavedChanges, onSave]);

  const triggerManualSave = async () => {
    if (!hasUnsavedChanges) return;
    setIsSaving(true);
    try {
      await onSave(dataRef.current);
      setLastSavedAt(new Date().toLocaleTimeString());
      setHasUnsavedChanges(false);
    } catch (err) {
      console.error('[useAutosave] Failed to trigger manual save:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isSaving,
    lastSavedAt,
    hasUnsavedChanges,
    triggerManualSave,
  };
}
