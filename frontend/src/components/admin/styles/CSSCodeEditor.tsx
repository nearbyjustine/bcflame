'use client';

import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CSSCodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CSSCodeEditor({ value, onChange, placeholder, className }: CSSCodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hasBasicSyntax = value.includes('{') && value.includes('}');
  const hasContent = value.trim().length > 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium">CSS Code</label>
          {hasContent && (
            <div className="flex items-center gap-1">
              {hasBasicSyntax ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {hasBasicSyntax ? 'Valid syntax' : 'Missing rule blocks'}
              </span>
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          disabled={!value}
        >
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4" />
              Copied
            </>
          ) : (
            <>
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </>
          )}
        </Button>
      </div>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || 'Enter CSS code...\n\n.my-class {\n  color: red;\n}'}
        className="font-mono text-sm min-h-[300px]"
        spellCheck={false}
      />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{value.split('\n').length} lines</span>
        <span>{value.length} characters</span>
      </div>
    </div>
  );
}
