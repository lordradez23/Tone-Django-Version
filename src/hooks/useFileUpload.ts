import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface UploadResult {
  url: string;
  name: string;
  type: string;
}

export const useFileUpload = () => {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<UploadResult | null> => {
    if (!user) {
      setError('User not authenticated');
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      
      const { data, error: uploadError } = await supabase.storage
        .from('chat-attachments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('chat-attachments')
        .getPublicUrl(data.path);

      setUploadProgress(100);
      
      return {
        url: urlData.publicUrl,
        name: file.name,
        type: file.type
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      setError(message);
      return null;
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const reset = useCallback(() => {
    setError(null);
    setUploadProgress(0);
  }, []);

  return {
    uploadFile,
    isUploading,
    uploadProgress,
    error,
    reset
  };
};
