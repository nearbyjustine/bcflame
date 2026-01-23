'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import type { Conversation } from '@/lib/api/conversations';

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: number;
  currentUserType: 'admin' | 'reseller';
  activeConversationId?: number;
  onViewOrders?: (conversation: Conversation) => void;
}

export function ConversationList({
  conversations,
  currentUserId,
  currentUserType,
  activeConversationId,
  onViewOrders,
}: ConversationListProps) {
  const getOtherParticipant = (conversation: Conversation) => {
    return currentUserType === 'admin'
      ? conversation.participant_partner
      : conversation.participant_admin;
  };

  const getUnreadCount = (conversation: Conversation) => {
    return currentUserType === 'admin'
      ? conversation.unreadCount_admin
      : conversation.unreadCount_partner;
  };

  return (
    <div className="divide-y">
      {conversations.map((conversation) => {
        const otherUser = getOtherParticipant(conversation);
        const unreadCount = getUnreadCount(conversation);
        const isActive = conversation.id === activeConversationId;

        return (
          <div
            key={conversation.id}
            className={cn(
              'relative p-4 hover:bg-muted/50 transition-colors',
              isActive && 'bg-muted'
            )}
          >
            <Link
              href={`/admin-portal/messages/${conversation.id}`}
              className="block"
            >
              <div className="flex items-start gap-3">
                <Avatar>
                  <AvatarFallback>
                    {otherUser.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0 pr-10">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{otherUser.username}</span>
                      {unreadCount > 0 && (
                        <Badge variant="destructive" className="px-2 py-0.5 text-xs">
                          {unreadCount}
                        </Badge>
                      )}
                    </div>
                    {conversation.lastMessageAt && (
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(conversation.lastMessageAt), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </div>

                  {otherUser.companyName && (
                    <div className="text-sm text-muted-foreground truncate mb-1">
                      {otherUser.companyName}
                    </div>
                  )}

                  {conversation.lastMessagePreview && (
                    <div className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessagePreview}
                    </div>
                  )}
                </div>
              </div>
            </Link>

            {/* Cart button for admins */}
            {currentUserType === 'admin' && onViewOrders && (
              <div className="absolute right-4 top-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onViewOrders(conversation);
                  }}
                  title="View partner orders"
                >
                  <ShoppingCart className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        );
      })}

      {conversations.length === 0 && (
        <div className="p-8 text-center text-muted-foreground">
          No conversations yet
        </div>
      )}
    </div>
  );
}
