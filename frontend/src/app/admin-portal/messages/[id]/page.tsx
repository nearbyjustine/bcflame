'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageThread } from '@/components/admin/messages/MessageThread';
import { MessageInput } from '@/components/admin/messages/MessageInput';
import { TypingIndicator } from '@/components/admin/messages/TypingIndicator';
import { ConnectionStatus } from '@/components/admin/messages/ConnectionStatus';
import { useSocketContext } from '@/contexts/SocketContext';
import {
  getConversation,
  sendMessage,
  markConversationAsRead,
  type Conversation,
  type Message,
} from '@/lib/api/conversations';
import { useAuthStore } from '@/stores/authStore';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const { socket, isConnected } = useSocketContext();
  const user = useAuthStore((state) => state.user);
  const conversationId = parseInt(params.id as string);

  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<number>>(new Set());
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Load conversation
  useEffect(() => {
    loadConversation();
  }, [conversationId]);

  // Socket event listeners
  useEffect(() => {
    if (!socket || !conversationId) return;

    // Join conversation room
    socket.emit('conversation:join', conversationId);

    // Listen for new messages
    socket.on('message:new', ({ message, conversationId: msgConvId }) => {
      if (msgConvId === conversationId) {
        setMessages((prev) => [...prev, message]);

        // Mark as read if from other user
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
      socket.emit('conversation:leave', conversationId);
      socket.off('message:new');
      socket.off('message:typing');
    };
  }, [socket, conversationId, user]);

  // Mark conversation as read when entering
  useEffect(() => {
    if (conversationId) {
      markConversationAsRead(conversationId).catch(console.error);
    }
  }, [conversationId]);

  const loadConversation = async () => {
    try {
      const data = await getConversation(conversationId);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Failed to load conversation:', error);
      toast.error('Failed to load conversation');
      router.push('/admin-portal/messages');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    try {
      const message = await sendMessage(conversationId, content);
      // Message will be added via Socket.IO event
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const handleTyping = useCallback(() => {
    if (!socket) return;

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Emit typing start
    socket.emit('message:typing', { conversationId, isTyping: true });

    // Set timeout to emit typing stop
    const timeout = setTimeout(() => {
      socket.emit('message:typing', { conversationId, isTyping: false });
    }, 3000);

    setTypingTimeout(timeout);
  }, [socket, conversationId, typingTimeout]);

  if (!user || loading) {
    return <div className="container mx-auto py-6">Loading...</div>;
  }

  if (!conversation) {
    return <div className="container mx-auto py-6">Conversation not found</div>;
  }

  const otherUser =
    user.userType === 'admin'
      ? conversation.participant_partner
      : conversation.participant_admin;

  const typingUsernames = Array.from(typingUsers)
    .filter((id) => id !== user.id)
    .map(() => otherUser.username);

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin-portal/messages')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        <Avatar>
          <AvatarFallback>{otherUser.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-xl font-bold">{otherUser.username}</h1>
          {otherUser.companyName && (
            <p className="text-sm text-muted-foreground">{otherUser.companyName}</p>
          )}
        </div>
      </div>

      <ConnectionStatus isConnected={isConnected} className="mb-4" />

      {/* Chat Interface */}
      <Card className="flex flex-col h-[calc(100vh-250px)]">
        <MessageThread messages={messages} currentUserId={user.id} />

        {typingUsernames.length > 0 && (
          <TypingIndicator username={typingUsernames[0]} />
        )}

        <MessageInput
          onSendMessage={handleSendMessage}
          disabled={!isConnected}
          placeholder={
            isConnected
              ? `Message ${otherUser.username}...`
              : 'Reconnecting...'
          }
        />
      </Card>
    </div>
  );
}
