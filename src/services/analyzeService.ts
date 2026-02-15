import { AnalysisResult } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';

export const analyzeMessage = async (text: string): Promise<AnalysisResult> => {
  if (!text.trim()) {
    return {
      sentiment: { label: 'neutral', confidence: 0.5 },
      toxicity: { label: 'safe', confidence: 0.2 },
      feedback: '✓ Start typing to see live analysis',
      shouldWarn: false,
      alternatives: []
    };
  }

  try {
    const { data, error } = await supabase.functions.invoke('analyze-message', {
      body: { message: text }
    });

    if (error) {
      console.error('Analysis error:', error);
      // Return fallback on error
      return getFallbackAnalysis(text);
    }

    // Handle rate limit or payment errors
    if (data?.error) {
      console.warn('Analysis warning:', data.error);
      return getFallbackAnalysis(text);
    }

    // Map alternatives to rephrase for backward compatibility with SuggestionCard
    const result: AnalysisResult = {
      sentiment: data.sentiment || { label: 'neutral', confidence: 0.5 },
      toxicity: data.toxicity || { label: 'safe', confidence: 0.3 },
      feedback: data.feedback || '✓ Your message looks good!',
      shouldWarn: data.shouldWarn || false,
      alternatives: data.alternatives || [],
    };

    // Set rephrase from first alternative for SuggestionCard compatibility
    if (result.alternatives && result.alternatives.length > 0) {
      result.rephrase = {
        suggestion: result.alternatives[0].text,
        reason: result.alternatives[0].reason
      };
    }

    return result;
  } catch (err) {
    console.error('Analysis failed:', err);
    return getFallbackAnalysis(text);
  }
};

// Fallback analysis when AI is unavailable
const getFallbackAnalysis = (text: string): AnalysisResult => {
  const lowerText = text.toLowerCase();
  
  const toxicKeywords = ['hate', 'stupid', 'idiot', 'dumb', 'ugly', 'loser', 'kill', 'die', 'shut up', 'worthless'];
  const warningKeywords = ['annoying', 'weird', 'boring', 'lame', 'whatever', "don't care"];
  
  const hasToxic = toxicKeywords.some(k => lowerText.includes(k));
  const hasWarning = warningKeywords.some(k => lowerText.includes(k));
  
  let toxicityLabel: 'safe' | 'warning' | 'toxic' = 'safe';
  let toxicityConfidence = 0.3;
  
  if (hasToxic) {
    toxicityLabel = 'toxic';
    toxicityConfidence = 0.8;
  } else if (hasWarning) {
    toxicityLabel = 'warning';
    toxicityConfidence = 0.6;
  }
  
  return {
    sentiment: { label: 'neutral', confidence: 0.5 },
    toxicity: { label: toxicityLabel, confidence: toxicityConfidence },
    feedback: toxicityLabel === 'safe' 
      ? '✓ Your message looks great!' 
      : '💡 Consider rephrasing for a kinder tone',
    shouldWarn: toxicityLabel !== 'safe',
    alternatives: []
  };
};