import { useState, useCallback } from "react";
import { api } from "@/integrations/api/client";

export const useUserStatus = () => {
  const [isSaving, setIsSaving] = useState(false);

  const updateStatus = useCallback(async (status: string): Promise<void> => {
    setIsSaving(true);
    try {
      await api.put<{ status: string }>("/users/status", { status });
    } catch {
      // silently fail — status is non-critical
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { updateStatus, isSaving };
};
