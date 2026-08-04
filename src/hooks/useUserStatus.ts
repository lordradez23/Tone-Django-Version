import { useState, useCallback } from "react";
import { api } from "@/integrations/api/client";

export const useUserStatus = () => {
  const [isSaving, setIsSaving] = useState(false);

  const updateStatus = useCallback(async (status: string): Promise<string | null> => {
    setIsSaving(true);
    try {
      const data = await api.put<{ status: string }>("/users/status", { status });
      return data.status;
    } catch {
      return null;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { updateStatus, isSaving };
};
