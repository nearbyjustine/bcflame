'use client';

import { useEffect, useRef } from 'react';
import { format, isSameDay } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { Message } from '@/lib/api/conversations';

interface MessageThreadProps {
  messages: Message[];
  currentUserId: number;
}

export function MessageThread({ messages, currentUserId }: MessageThreadProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const groupMessagesByDate = (messages: Message[]) => {
    const groups: { date: Date; messages: Message[] }[] = [];
    let currentGroup: { date: Date; messages: Message[] } | null = null;

    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);

      if (!currentGroup || !isSameDay(currentGroup.date, messageDate)) {
        currentGroup = { date: messageDate, messages: [] };
        groups.push(currentGroup);
      }

      currentGroup.messages.push(message);
    });

    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messageGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          {/* Date divider */}
          <div className="flex items-center justify-center">
            <div className="px-3 py-1 bg-muted rounded-full text-xs text-muted-foreground">
              {format(group.date, 'MMMM d, yyyy')}
            </div>
          </div>

          {/* Messages */}
          {group.messages.map((message) => {
            const isOwnMessage = message.sender.id === currentUserId;

            return (
              <div
                key={message.id}
                className={cn(
                  'flex items-start gap-3',
                  isOwnMessage && 'flex-row-reverse'
                )}
              >
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs">
                    {message.sender.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

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
                    {message.messageType === 'system' && (
                      <div className="text-xs font-medium mb-1 opacity-80">
                        System Message
                      </div>
                    )}
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
                    {isOwnMessage && message.isRead && (
                      <span className="text-xs text-muted-foreground">✓ Read</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <div ref={messagesEndRef} />
    </div>
  );
}
