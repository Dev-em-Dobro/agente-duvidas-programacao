import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, User, Copy, Check, Send, Loader2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface Message {
  id: string;
  content: string;
  isUser: boolean;
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onSendMessage?: (message: string) => void;
  error?: string;
}

// Component to format text with markdown support
function FormattedText({ content }: { content: string }) {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Split content by code blocks (```...```) first
  const parts = content.split(/(```[\s\S]*?```)/g);
  
  return (
    <div className="space-y-3">
      {parts.map((part, index) => {
        if (part.startsWith('```') && part.endsWith('```')) {
          // This is a code block
          const codeContent = part.slice(3, -3).trim();
          const lines = codeContent.split('\n');
          const language = lines[0]?.match(/^[a-zA-Z]+$/) ? lines[0] : '';
          const code = language ? lines.slice(1).join('\n') : codeContent;
          
          return (
            <div key={index} className="relative group">
              <div className="bg-slate-900 dark:bg-slate-800 rounded-lg overflow-hidden">
                {language && (
                  <div className="px-4 py-2 bg-slate-800 dark:bg-slate-700 text-slate-300 text-sm font-mono border-b border-slate-700">
                    {language}
                  </div>
                )}
                <div className="relative">
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-slate-100 font-mono text-sm leading-relaxed">
                      {code}
                    </code>
                  </pre>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-700 hover:bg-slate-600 text-slate-300"
                    onClick={() => copyToClipboard(code, index)}
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        } else {
          // Regular text with markdown formatting
          return part.trim() ? (
            <MarkdownFormattedText key={index} text={part} />
          ) : null;
        }
      })}
    </div>
  );
}

// Component to handle comprehensive markdown formatting
function MarkdownFormattedText({ text }: { text: string }) {
  const formatMarkdown = (content: string) => {
    // Split text into lines for processing
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];
    
    let i = 0;
    while (i < lines.length) {
      const line = lines[i].trim();
      
      // Headers (### ## #)
      if (line.startsWith('###')) {
        elements.push(
          <h3 key={i} className="text-lg font-bold mt-4 mb-2 text-foreground">
            {formatInlineElements(line.replace(/^###\s*/, ''))}
          </h3>
        );
      } else if (line.startsWith('##')) {
        elements.push(
          <h2 key={i} className="text-xl font-bold mt-4 mb-2 text-foreground">
            {formatInlineElements(line.replace(/^##\s*/, ''))}
          </h2>
        );
      } else if (line.startsWith('#')) {
        elements.push(
          <h1 key={i} className="text-2xl font-bold mt-4 mb-2 text-foreground">
            {formatInlineElements(line.replace(/^#\s*/, ''))}
          </h1>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const listItems: JSX.Element[] = [];
        let j = i;
        
        while (j < lines.length && /^\d+\.\s/.test(lines[j].trim())) {
          const listLine = lines[j].trim();
          listItems.push(
            <li key={j} className="mb-1">
              {formatInlineElements(listLine.replace(/^\d+\.\s*/, ''))}
            </li>
          );
          j++;
        }
        
        elements.push(
          <ol key={i} className="list-decimal list-inside space-y-1 mt-2 mb-3 pl-4">
            {listItems}
          </ol>
        );
        
        i = j - 1;
      }
      // Bullet lists
      else if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems: JSX.Element[] = [];
        let j = i;
        
        while (j < lines.length && (lines[j].trim().startsWith('- ') || lines[j].trim().startsWith('* '))) {
          const listLine = lines[j].trim();
          listItems.push(
            <li key={j} className="mb-1">
              {formatInlineElements(listLine.replace(/^[-*]\s*/, ''))}
            </li>
          );
          j++;
        }
        
        elements.push(
          <ul key={i} className="list-disc list-inside space-y-1 mt-2 mb-3 pl-4">
            {listItems}
          </ul>
        );
        
        i = j - 1;
      }
      // Regular paragraphs
      else if (line.length > 0) {
        elements.push(
          <p key={i} className="whitespace-pre-wrap leading-relaxed mb-2">
            {formatInlineElements(line)}
          </p>
        );
      }
      // Empty lines
      else {
        elements.push(<div key={i} className="h-2" />);
      }
      
      i++;
    }
    
    return elements;
  };

  const formatInlineElements = (text: string) => {
    // Handle inline code, bold, and other inline formatting
    const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);
    
    return parts.map((part, index) => {
      // Inline code
      if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
        const code = part.slice(1, -1);
        return (
          <code
            key={index}
            className="bg-slate-900 text-slate-100 px-1.5 py-0.5 rounded text-sm font-mono"
          >
            {code}
          </code>
        );
      }
      // Bold text (**text**)
      else if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
        const boldText = part.slice(2, -2);
        return <strong key={index} className="font-bold">{boldText}</strong>;
      }
      // Italic text (*text*)
      else if (part.startsWith('*') && part.endsWith('*') && part.length > 2 && !part.startsWith('**')) {
        const italicText = part.slice(1, -1);
        return <em key={index} className="italic">{italicText}</em>;
      }
      // Regular text
      else {
        return part;
      }
    });
  };
  
  return <div className="space-y-1">{formatMarkdown(text)}</div>;
}

export function ChatMessages({ messages, isLoading, onSendMessage, error }: ChatMessagesProps) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [message]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isLoading || !onSendMessage) return;
    
    onSendMessage(message.trim());
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
  return (
    <ScrollArea className="flex-1 px-4">
      <div className="space-y-4 py-4">
        {/* Welcome Message */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center h-full min-h-[50vh]">
            <div className="w-28 h-28 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <img src="/293bd586-7dd2-487c-9785-393da036e1a9.png" alt="Logo Ana" className="h-28 w-28 rounded-full object-cover" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">Ana -  Assistente em programação</h3>
            <p className="text-muted-foreground mb-8">Tire suas dúvidas de programação aqui</p>
            
            {/* Input integrado na tela de boas-vindas */}
            <div className="w-full max-w-3xl rounded-2xl" style={{ border: '2px solid #00EEA2'}}>
              <form onSubmit={handleSubmit} className="relative">
                <div className="flex items-end gap-3 bg-muted/30 rounded-2xl p-3 theme-transition">
                  <Textarea
                    ref={textareaRef}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Digite sua dúvida de programação..."
                    className="flex-1 bg-transparent border-0 resize-none outline-none focus-visible:ring-0 min-h-[24px] max-h-32"
                    rows={1}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="w-8 h-8 bg-primary hover:bg-primary/90"
                    disabled={!message.trim() || isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                {/* Error Message */}
                {error && (
                  <div className="mt-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm theme-transition">
                    {error}
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
        
        {/* Messages */}
        {messages.map((message) => (
          <div key={message.id} className="message-bubble">
            {message.isUser ? (
              <div className="flex items-start gap-3 max-w-3xl ml-auto">
                <div className="bg-primary text-primary-foreground rounded-2xl p-4 ml-auto">
                  <FormattedText content={message.content} />
                </div>
                <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4" />
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-3 max-w-3xl">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                  <img src="/293bd586-7dd2-487c-9785-393da036e1a9.png" alt="Logo Ana" className="h-8 w-8 rounded-full object-cover" />
                </div>
                <div className="bg-muted rounded-2xl p-4 theme-transition">
                  <FormattedText content={message.content} />
                </div>
              </div>
            )}
          </div>
        ))}
        
        {/* Typing Indicator */}
        {isLoading && (
          <div className="message-bubble">
            <div className="flex items-start gap-3 max-w-3xl">
              <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                <img src="/293bd586-7dd2-487c-9785-393da036e1a9.png" alt="Logo Ana" className="h-8 w-8 rounded-full object-cover" />
              </div>
              <div className="bg-muted rounded-2xl p-4 theme-transition">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator"></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground rounded-full typing-indicator" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
