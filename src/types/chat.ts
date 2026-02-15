export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  status?: 'safe' | 'warning' | 'toxic';
  analysis?: AnalysisResult;
}

export interface Alternative {
  text: string;
  reason: string;
}

export interface AnalysisResult {
  sentiment: {
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  toxicity: {
    label: 'safe' | 'warning' | 'toxic';
    confidence: number;
  };
  feedback: string;
  shouldWarn: boolean;
  alternatives?: Alternative[];
  rephrase?: {
    suggestion: string;
    reason: string;
  };
}

export interface ChatState {
  messages: Message[];
  isAnalyzing: boolean;
  currentAnalysis: AnalysisResult | null;
}
