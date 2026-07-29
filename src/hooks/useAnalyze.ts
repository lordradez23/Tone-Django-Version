import { useState, useCallback, useRef, useEffect } from "react";
import { AnalysisResult } from "@/types/chat";
import { analyzeMessage } from "@/services/analyzeService";

export const useAnalyze = (debounceMs = 1000) => {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef(false);

  const analyze = useCallback((text: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!text.trim()) { setAnalysis(null); setIsAnalyzing(false); return; }
    setIsAnalyzing(true);
    abortRef.current = false;
    debounceRef.current = setTimeout(async () => {
      try {
        const result = await analyzeMessage(text);
        if (!abortRef.current) setAnalysis(result);
      } catch { /* ignore */ }
      finally { if (!abortRef.current) setIsAnalyzing(false); }
    }, debounceMs);
  }, [debounceMs]);

  const reset = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current = true;
    setAnalysis(null);
    setIsAnalyzing(false);
  }, []);

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  return { analysis, isAnalyzing, analyze, reset };
};
