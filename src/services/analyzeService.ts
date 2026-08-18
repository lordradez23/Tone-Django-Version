import { AnalysisResult } from "@/types/chat";
import { api } from "@/integrations/api/client";

export const analyzeMessage = async (text: string): Promise<AnalysisResult> => {
  if (!text.trim()) {
    return {
      sentiment: { label: "neutral", confidence: 0.5 },
      toxicity: { label: "safe", confidence: 0.2 },
      feedback: "Start typing to see live analysis",
      shouldWarn: false,
      alternatives: [],
    };
  }
  try {
    return await api.post<AnalysisResult>("/analyze", { message: text });
  } catch {
    return {
      sentiment: { label: "neutral", confidence: 0.5 },
      toxicity: { label: "safe", confidence: 0.3 },
      feedback: "Analysis unavailable — please try again",
      shouldWarn: false,
      alternatives: [],
    };
  }
};
