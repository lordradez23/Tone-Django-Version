import { useState, useCallback } from "react";
import { uploadFile as apiUpload } from "@/integrations/api/client";
import { useAuth } from "@/hooks/useAuth";

export const useFileUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File) => {
    if (!user) { setError("Not authenticated"); return null; }
    setIsUploading(true);
    setError(null);
    try {
      const result = await apiUpload(file);
      if (!result) throw new Error("Upload failed");
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  return { uploadFile, isUploading, error, reset: () => setError(null) };
};
