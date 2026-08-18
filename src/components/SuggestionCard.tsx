import { motion, AnimatePresence } from 'framer-motion';
import { AnalysisResult } from '@/types/chat';
import { X, Lightbulb, AlertCircle, Check, Edit3, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SuggestionCardProps {
  isOpen: boolean;
  originalMessage: string;
  analysis: AnalysisResult | null;
  onUseSuggestion: (suggestion: string) => void;
  onEdit: () => void;
  onSendAnyway: () => void;
  onClose: () => void;
}

export const SuggestionCard = ({
  isOpen,
  originalMessage,
  analysis,
  onUseSuggestion,
  onEdit,
  onSendAnyway,
  onClose,
}: SuggestionCardProps) => {
  if (!analysis?.rephrase) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          
          {/* Popup */}
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-lg z-50"
          >
            <div className="suggestion-popup">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-warning" />
                  </div>
                  <h3 className="text-foreground font-semibold">Message Review</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-full hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5 text-secondary" />
                </button>
              </div>

              {/* Original Message */}
              <div className="mb-4">
                <p className="text-xs uppercase tracking-wider mb-2">Original Message</p>
                <div className="bg-muted/50 rounded-lg p-3 border-l-4 border-toxic">
                  <p className="text-foreground text-sm">{originalMessage}</p>
                </div>
              </div>

              {/* Suggestion */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="w-4 h-4 text-safe" />
                  <p className="text-xs uppercase tracking-wider">Suggested Rephrase</p>
                </div>
                <div className="bg-safe/10 rounded-lg p-3 border-l-4 border-safe">
                  <p className="text-foreground text-sm">{analysis.rephrase.suggestion}</p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6 p-3 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  <span className="font-medium text-foreground">Why?</span> {analysis.rephrase.reason}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={() => onUseSuggestion(analysis.rephrase!.suggestion)}
                  className="flex-1 bg-safe hover:bg-safe/90 text-foreground"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Use Suggestion
                </Button>
                <Button
                  onClick={onEdit}
                  variant="outline"
                  className="flex-1 border-border hover:bg-muted"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
                <Button
                  onClick={onSendAnyway}
                  variant="outline"
                  className="flex-1 border-warning/50 text-warning hover:bg-warning/10"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send Anyway
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
