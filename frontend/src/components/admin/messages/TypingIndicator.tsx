'use client';

interface TypingIndicatorProps {
  username: string;
}

export function TypingIndicator({ username }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
      <span>{username} is typing</span>
      <div className="flex gap-1">
        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>
          .
        </span>
        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>
          .
        </span>
      </div>
    </div>
  );
}
