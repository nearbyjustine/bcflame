'use client';

import { useRouter } from 'next/navigation';
import { ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { Message } from '@/lib/api/conversations';
import { cn } from '@/lib/utils';

interface OrderMessageBubbleProps {
  message: Message;
  isOwnMessage: boolean;
  userType: 'admin' | 'reseller';
}

export function OrderMessageBubble({ message, isOwnMessage, userType }: OrderMessageBubbleProps) {
  const router = useRouter();

  const handleClick = () => {
    if (!message.relatedOrder) return;

    // Navigate based on user type
    if (userType === 'admin') {
      router.push(`/admin-portal/orders/${message.relatedOrder.id}`);
    } else {
      router.push(`/orders/${message.relatedOrder.id}`);
    }
  };

  if (!message.relatedOrder) {
    // Fallback to regular message display if relatedOrder is missing
    return (
      <div
        className={cn(
          'flex flex-col max-w-[70%]',
          isOwnMessage && 'items-end'
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-2',
            isOwnMessage
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted'
          )}
        >
          <p className="text-sm whitespace-pre-wrap break-words">
            {message.content}
          </p>
        </div>
        <div
          className={cn(
            'flex items-center gap-2 mt-1 px-2',
            isOwnMessage && 'flex-row-reverse'
          )}
        >
          <span className="text-xs text-muted-foreground">
            {format(new Date(message.createdAt), 'h:mm a')}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex flex-col max-w-[75%]',
        isOwnMessage && 'items-end'
      )}
    >
      <button
        onClick={handleClick}
        className={cn(
          'group rounded-2xl px-4 py-3 text-left transition-all',
          'hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
          'border-l-4 border-blue-500',
          isOwnMessage
            ? 'bg-blue-50 dark:bg-blue-950/30'
            : 'bg-blue-50 dark:bg-blue-950/30'
        )}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
              <ShoppingCart className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">
              Order Update
            </div>
            <p className="text-sm font-medium text-foreground mb-1">
              {message.relatedOrder.inquiry_number}
            </p>
            <p className="text-sm text-muted-foreground">
              {message.content}
            </p>
            <div className="mt-2 text-xs text-blue-600 dark:text-blue-400 group-hover:underline">
              View order details →
            </div>
          </div>
        </div>
      </button>

      <div
        className={cn(
          'flex items-center gap-2 mt-1 px-2',
          isOwnMessage && 'flex-row-reverse'
        )}
      >
        <span className="text-xs text-muted-foreground">
          {format(new Date(message.createdAt), 'h:mm a')}
        </span>
        {isOwnMessage && message.isRead && (
          <span className="text-xs text-muted-foreground">✓ Read</span>
        )}
      </div>
    </div>
  );
}
