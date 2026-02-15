import { Message } from '@/types/chat';
import { motion } from 'framer-motion';
import { format } from 'date-fns';

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      <div
        className={`max-w-[75%] ${isUser ? 'message-bubble-user' : 'message-bubble-ai'}`}
      >
        <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
          {message.content}
        </p>
        <div className="flex items-center justify-end gap-2 mt-2">
          <span className="text-small text-xs">
            {format(message.timestamp, 'HH:mm')}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
