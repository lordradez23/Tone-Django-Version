import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '@/types/chat';
import { AlertTriangle, TrendingUp, Loader2, Lightbulb } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface AnalysisPanelProps {
  analysis: AnalysisResult | null;
  isAnalyzing: boolean;
  onSelectAlternative?: (text: string) => void;
}

export const AnalysisPanel = ({ analysis, isAnalyzing, onSelectAlternative }: AnalysisPanelProps) => {
  const sentimentEmoji = {
    positive: '😊',
    neutral: '😐',
    negative: '😔',
  };

  const toxicityColors = {
    safe: 'bg-safe',
    warning: 'bg-warning',
    toxic: 'bg-toxic',
  };

  const toxicityLabels = {
    safe: 'Looking good',
    warning: 'Could be softer',
    toxic: 'Consider rephrasing',
  };

  const toxicityExplanations = {
    safe: 'Your message has a positive or neutral tone that should be well-received.',
    warning: 'Some words or phrasing might come across as dismissive or could be misinterpreted.',
    toxic: 'The language used may unintentionally hurt feelings or escalate conflict. A gentler approach could help.',
  };

  const toxicityGlows = {
    safe: 'shadow-[0_0_20px_hsla(142,52%,42%,0.4)]',
    warning: 'shadow-[0_0_20px_hsla(45,65%,55%,0.4)]',
    toxic: 'shadow-[0_0_20px_hsla(0,65%,55%,0.4)]',
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">Live Analysis</h2>
        <p className="text-small mt-1">Real-time message safety check</p>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
        <AnimatePresence mode="wait">
          {isAnalyzing && !analysis && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-8"
            >
              <Loader2 className="w-6 h-6 text-secondary animate-spin" />
              <span className="ml-2 text-small">Analyzing...</span>
            </motion.div>
          )}

          {!analysis && !isAnalyzing && (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-8"
            >
              <p className="text-small">Start typing to see live analysis</p>
            </motion.div>
          )}

          {analysis && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              {/* Sentiment Card */}
              <div className="analysis-card">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-secondary" />
                  <span className="text-small font-medium">Sentiment</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <motion.span 
                      className="text-3xl"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      {sentimentEmoji[analysis.sentiment.label]}
                    </motion.span>
                    <span className="text-foreground font-medium capitalize">
                      {analysis.sentiment.label}
                    </span>
                  </div>
                  <span className="text-small">
                    {(analysis.sentiment.confidence * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              {/* Toxicity Card */}
              <div className="analysis-card">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-secondary" />
                  <span className="text-small font-medium">Toxicity Level</span>
                </div>
                
                {/* Toxicity Meter */}
                <div className="h-3 bg-muted rounded-full overflow-hidden mb-3">
                  <motion.div
                    className={`h-full rounded-full ${toxicityColors[analysis.toxicity.label]} ${toxicityGlows[analysis.toxicity.label]}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${analysis.toxicity.confidence * 100}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.span 
                        className={`px-3 py-1 rounded-full text-sm font-medium cursor-help ${
                          analysis.toxicity.label === 'safe' ? 'bg-safe/20 text-safe' :
                          analysis.toxicity.label === 'warning' ? 'bg-warning/20 text-warning' :
                          'bg-toxic/20 text-toxic'
                        }`}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                      >
                        {toxicityLabels[analysis.toxicity.label]}
                      </motion.span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs text-center">
                      <p>{toxicityExplanations[analysis.toxicity.label]}</p>
                    </TooltipContent>
                  </Tooltip>
                  <span className="text-small">
                    {(analysis.toxicity.confidence * 100).toFixed(0)}% confidence
                  </span>
                </div>
              </div>

              {/* Feedback Card */}
              <motion.div 
                className="analysis-card"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <p className="text-foreground text-sm leading-relaxed">
                  {analysis.feedback}
                </p>
              </motion.div>

              {/* Alternatives Card */}
              {analysis.alternatives && analysis.alternatives.length > 0 && (
                <motion.div 
                  className="analysis-card"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-safe" />
                    <span className="text-small font-medium">Try saying it this way</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.alternatives.map((alt, index) => (
                      <motion.button
                        key={index}
                        onClick={() => onSelectAlternative?.(alt.text)}
                        className="w-full text-left p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors border border-transparent hover:border-safe/30"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1 }}
                      >
                        <p className="text-foreground text-sm mb-1">"{alt.text}"</p>
                        <p className="text-secondary text-xs">{alt.reason}</p>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
