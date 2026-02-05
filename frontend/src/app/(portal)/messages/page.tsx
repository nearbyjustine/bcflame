'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageThread } from '@/components/admin/messages/MessageThread';
import { MessageInput } from '@/components/admin/messages/MessageInput';
import { TypingIndicator } from '@/components/admin/messages/TypingIndicator';
import { ConnectionStatus } from '@/components/admin/messages/ConnectionStatus';
import { useSocketContext } from '@/contexts/SocketContext';
import {
  getConversations,
  getConversation,
  sendMessage,
  markConversationAsRead,
  type Conversation,
  type Message,
} from '@/lib/api/conversations';
import { useAuthStore } from '@/stores/authStore';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { useOnboardingTour } from '@/hooks/useOnboardingTour';
import { resellerMessagesSteps } from '@/hooks/tours/resellerTours';

export default function ResellerMessagesPage() {
  const { socket, isConnected } = useSocketContext();
  const user = useAuthStore((state) => state.user);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  useOnboardingTour({ moduleKey: 'messages', steps: resellerMessagesSteps, enabled: !!conversation });
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());

  // Load conversations (should only be one with admin)
  useEffect(() => {
    loadConversation();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversation) return;

    // Join conversation room
    socket.emit('conversation:join', conversation.id);

    // Listen for new messages
    socket.on('message:new', ({ message, conversationId }) => {
      if (conversationId === conversation.id) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if from admin
        if (message.sender.id !== user?.id) {
          markConversationAsRead(conversationId).catch(console.error);
        }
      }
    });

    // Listen for typing indicators
    socket.on('message:typing', ({ userId, isTyping }) => {
      if (isTyping) {
        setTypingUsers((prev) => new Set(prev).add(userId));
      } else {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });

    return () => {
      if (conversation) {
        socket.emit('conversation:leave', conversation.id);
      }
      socket.off('message:new');
      socket.off('message:typing');
    };
  }, [socket, conversation, user]);

  const loadConversation = async () => {
    try {
      // Get all conversations (should only be one)
      const conversations = await getConversations();

      if (conversations.length > 0) {
        // Load the first (and likely only) conversation
        const conv = await getConversation(conversations[0].id);
        setConversation(conv);
        setMessages(conv.messages || []);
        markConversationAsRead(conv.id).catch(console.error);
      }
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!conversation) return;

    try {
      await sendMessage(conversation.id, content);
      // Message will be added via Socket.IO event
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  if (!user || loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  // No conversation exists yet
  if (!conversation) {
    return (
      <div className="container mx-auto py-6">
        <Card className="p-12 text-center">
          <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">No Messages Yet</h2>
          <p className="text-muted-foreground">
            You don&apos;t have any conversations with the admin team yet.
          </p>
        </Card>
      </div>
    );
  }

  const adminUser = conversation.participant_admin;
  const typingUsernames = Array.from(typingUsers)
    .filter((id) => id !== user.id)
    .map(() => adminUser.username);

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6" data-tour="res-messages-header">
        <Avatar>
          <AvatarFallback>{adminUser.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-xl font-bold">{adminUser.username}</h1>
          <p className="text-sm text-muted-foreground">BC Flame Admin Team</p>
        </div>
      </div>

      <div data-tour="res-messages-connection">
        <ConnectionStatus isConnected={isConnected} className="mb-4" />
      </div>

      {/* Chat Interface */}
      <Card className="flex flex-col h-[calc(100vh-250px)]" data-tour="res-messages-chat">
        <MessageThread messages={messages} currentUserId={user.id} userType="reseller" />

        {typingUsernames.length > 0 && (
          <TypingIndicator username={typingUsernames[0]} />
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
          placeholder={
            isConnected ? 'Message admin...' : 'Reconnecting...'
          }
        />
      </Card>
    </div>
  );
}
