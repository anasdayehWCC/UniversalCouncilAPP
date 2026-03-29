import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Mic, Image as ImageIcon, Send, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EnhancedInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  onSend?: (value: string) => void;
  onMicClick?: () => void;
  onImageClick?: () => void;
}

export const EnhancedInput = React.forwardRef<HTMLTextAreaElement, EnhancedInputProps>(
  ({ className, onSend, onMicClick, onImageClick, value: controlledValue, defaultValue, onChange, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);
    const isControlled = controlledValue !== undefined;
    const [uncontrolledValue, setUncontrolledValue] = useState(() =>
      typeof defaultValue === 'string' ? defaultValue : ''
    );

    const value = isControlled ? String(controlledValue ?? '') : uncontrolledValue;

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (!isControlled) {
        setUncontrolledValue(e.target.value);
      }
      onChange?.(e);
    };

    const handleSend = () => {
      if (value.trim()) {
        onSend?.(value);
        if (!isControlled) {
          setUncontrolledValue('');
        }
      }
    };

    return (
      <div
        className={cn(
          "relative rounded-3xl border transition-all duration-300 bg-muted",
          isFocused ? "bg-card border-[var(--primary)] shadow-lg ring-4 ring-[var(--primary-soft)]" : "border-border hover:border-border/80",
          className
        )}
      >
        <textarea
          ref={ref}
          className="w-full bg-transparent border-0 focus:ring-0 resize-none p-4 min-h-[60px] max-h-[200px] text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
          placeholder="Ask anything about your cases..."
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          value={value}
          onChange={handleChange}
          {...props}
        />
        
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" onClick={onImageClick} aria-label="Upload image">
              <ImageIcon className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" aria-label="Attach file">
              <Paperclip className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
             {value.trim() ? (
	               <Button 
	                 size="icon" 
	                 className="rounded-full animate-in zoom-in duration-200"
	                 onClick={handleSend}
                   aria-label="Send message"
	               >
	                 <Send className="w-4 h-4" />
	               </Button>
             ) : (
               <Button 
                 variant="ghost" 
                 size="icon" 
                 className="rounded-full bg-muted text-muted-foreground hover:bg-muted/80 w-10 h-10"
                 onClick={onMicClick}
                 aria-label="Voice input"
               >
                 <Mic className="w-5 h-5" />
               </Button>
             )}
          </div>
        </div>
      </div>
    );
  }
);
EnhancedInput.displayName = "EnhancedInput";
