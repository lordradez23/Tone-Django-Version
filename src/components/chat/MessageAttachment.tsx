import { FileText, Download, Image as ImageIcon } from 'lucide-react';

interface MessageAttachmentProps {
  url: string;
  name: string;
  type: string;
}

export const MessageAttachment = ({ url, name, type }: MessageAttachmentProps) => {
  const isImage = type.startsWith('image/');

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block mt-2">
        <img 
          src={url} 
          alt={name}
          className="max-w-full max-h-64 rounded-lg object-cover hover:opacity-90 transition-opacity"
          loading="lazy"
        />
      </a>
    );
  }

  return (
    <a 
      href={url} 
      target="_blank" 
      rel="noopener noreferrer"
      className="flex items-center gap-2 mt-2 p-2 bg-background/30 rounded-lg hover:bg-background/50 transition-colors"
    >
      <div className="p-2 bg-muted rounded">
        <FileText className="w-4 h-4 text-secondary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground truncate">{name}</p>
        <p className="text-xs text-secondary">{type || 'File'}</p>
      </div>
      <Download className="w-4 h-4 text-secondary" />
    </a>
  );
};
