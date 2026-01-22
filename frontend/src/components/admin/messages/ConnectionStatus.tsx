'use client';

import { WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isConnected: boolean;
  className?: string;
}

export function ConnectionStatus({ isConnected, className }: ConnectionStatusProps) {
  if (isConnected) return null; // Only show when disconnected

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-2 bg-destructive/10 text-destructive rounded-md text-sm',
        className
      )}
    >
      <WifiOff className="w-4 h-4" />
      <span>Connection lost. Reconnecting...</span>
    </div>
  );
}
