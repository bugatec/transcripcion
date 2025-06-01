
import React, { useRef, useEffect } from 'react';
import { Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface TranscriptionBoxProps {
  title: string;
  content: string;
  isListening?: boolean;
  placeholder: string;
  onCopy: () => void;
  onDownload: () => void;
  isExpanded?: boolean;
}

const TranscriptionBox = ({ 
  title, 
  content, 
  isListening = false, 
  placeholder, 
  onCopy, 
  onDownload,
  isExpanded = false 
}: TranscriptionBoxProps) => {
  const textBoxRef = useRef<HTMLDivElement>(null);

  // Format text into sentences with line breaks for better readability
  const formatTextIntoSentences = (text: string) => {
    if (!text) return '';
    
    const sentences = text.split(/([.!?:]+)/).filter(s => s.trim());
    
    let formattedText = '';
    for (let i = 0; i < sentences.length; i += 2) {
      const sentence = sentences[i]?.trim();
      const punctuation = sentences[i + 1] || '';
      if (sentence) {
        formattedText += sentence + punctuation + '\n\n';
      }
    }
    
    return formattedText
      .replace(/,\s+([A-Z])/g, ',\n$1')
      .replace(/:\s+/g, ':\n')
      .trim();
  };

  // Auto-scroll
  useEffect(() => {
    if (textBoxRef.current && content) {
      const element = textBoxRef.current;
      element.scrollTop = element.scrollHeight;
    }
  }, [content]);

  return (
    <Card className={`shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm ${
      isExpanded ? 'h-[85vh]' : 'h-[70vh]'
    }`}>
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            {title}
          </h2>
          <div className="flex items-center gap-2">
            {isListening && (
              <div className="flex items-center gap-2 text-red-500 mr-4">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Escuchando...</span>
              </div>
            )}
            <Button
              onClick={onCopy}
              variant="outline"
              size="sm"
              disabled={!content.trim()}
              className="flex items-center gap-1 px-2"
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              onClick={onDownload}
              variant="outline"
              size="sm"
              disabled={!content.trim()}
              className="flex items-center gap-1 px-2"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        <div 
          ref={textBoxRef}
          className="flex-1 overflow-y-auto scroll-smooth"
        >
          {content ? (
            <div className="text-lg leading-relaxed text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
              {formatTextIntoSentences(content)}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <div className="text-center">
                <p className="text-lg">{placeholder}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default TranscriptionBox;
