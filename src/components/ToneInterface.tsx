import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Loader2, Menu } from 'lucide-react';
import { Message, AnalysisResult } from '@/types/chat';
import { MessageBubble } from './MessageBubble';
import { AnalysisPanel } from './AnalysisPanel';
import { SuggestionCard } from './SuggestionCard';
import { useAnalyze } from '@/hooks/useAnalyze';
import { Button } from '@/components/ui/button';

const WELCOME_MESSAGES: Message[] = [
  {
    id: '1',
    content: 'Welcome to Tone! 👋\n\nI\'m here to help you communicate more effectively. Type a message and I\'ll analyze it in real-time.',
    sender: 'ai',
    timestamp: new Date(),
  },
  {
    id: '2',
    content: 'Try typing any message to see how it might be perceived. I\'ll offer suggestions to help you express yourself clearly and kindly.',
    sender: 'ai',
    timestamp: new Date(),
  },
];

export const ToneInterface = () => {
  const [messages, setMessages] = useState<Message[]>(WELCOME_MESSAGES);
  const [inputValue, setInputValue] = useState('');
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [pendingMessage, setPendingMessage] = useState('');
  const [showMobilePanel, setShowMobilePanel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { analysis, isAnalyzing, analyze, reset } = useAnalyze(800);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Analyze as user types
  useEffect(() => {
    analyze(inputValue);
  }, [inputValue, analyze]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`;
    }
  }, [inputValue]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Check if message is toxic and should show suggestion
    if (analysis?.toxicity.label === 'toxic' && analysis.rephrase) {
      setPendingMessage(inputValue);
      setShowSuggestion(true);
      return;
    }

    sendMessage(inputValue, analysis);
  };

  const sendMessage = (content: string, messageAnalysis: AnalysisResult | null) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      status: messageAnalysis?.toxicity.label || 'safe',
      analysis: messageAnalysis || undefined,
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    reset();

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        content: messageAnalysis?.toxicity.label === 'toxic'
          ? 'Thanks for sharing! Consider how the recipient might feel reading that message. Small adjustments can make a big difference. 💪'
          : messageAnalysis?.toxicity.label === 'warning'
            ? 'Good message! Just something to think about - tone can sometimes be interpreted differently in text. 🤔'
            : 'Great message! Keep up the positive communication! ✨',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    }, 1000);
  };

  const handleUseSuggestion = (suggestion: string) => {
    setShowSuggestion(false);
    setInputValue(suggestion);
    setPendingMessage('');
  };

  const handleEdit = () => {
    setShowSuggestion(false);
    setPendingMessage('');
    textareaRef.current?.focus();
  };

  const handleSendAnyway = () => {
    setShowSuggestion(false);
    sendMessage(pendingMessage, analysis);
    setPendingMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Determine send button color based on analysis
  const getButtonVariant = (): 'default' | 'safe' | 'warning' | 'toxic' => {
    if (!analysis || !inputValue.trim()) return 'default';
    return analysis.toxicity.label;
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="h-16 border-b border-border flex items-center justify-between px-4 bg-card/50 backdrop-blur-sm">
          <div>
            <h1 className="text-foreground font-semibold text-lg">Tone</h1>
            <p className="text-small text-xs">Set the right tone</p>
          </div>
          <button
            onClick={() => setShowMobilePanel(!showMobilePanel)}
            className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" />
          </button>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-border bg-card/30">
          <div className="flex items-end gap-3 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                rows={1}
                className="w-full bg-muted border border-border rounded-2xl px-4 py-3 pr-12 text-foreground placeholder:text-secondary resize-none focus:outline-none focus:ring-2 focus:ring-ring transition-all"
              />
              {isAnalyzing && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <Loader2 className="w-4 h-4 text-secondary animate-spin" />
                </div>
              )}
            </div>
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim()}
                variant={getButtonVariant()}
                size="icon"
                className="h-12 w-12 rounded-full transition-all duration-300"
              >
                <Send className="w-5 h-5 text-foreground" />
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Analysis Panel - Desktop */}
      <aside className="hidden lg:block w-80 border-l border-border bg-card/30">
        <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
      </aside>

      {/* Analysis Panel - Mobile Slide-up */}
      {showMobilePanel && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          className="lg:hidden fixed inset-x-0 bottom-0 h-[60vh] bg-card border-t border-border z-30 rounded-t-2xl"
        >
          <div className="w-12 h-1 bg-muted rounded-full mx-auto mt-3" />
          <AnalysisPanel analysis={analysis} isAnalyzing={isAnalyzing} />
        </motion.div>
      )}

      {/* Suggestion Popup */}
      <SuggestionCard
        isOpen={showSuggestion}
        originalMessage={pendingMessage}
        analysis={analysis}
        onUseSuggestion={handleUseSuggestion}
        onEdit={handleEdit}
        onSendAnyway={handleSendAnyway}
        onClose={() => setShowSuggestion(false)}
      />
    </div>
  );
};
