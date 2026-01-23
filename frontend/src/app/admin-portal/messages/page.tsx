'use client';

import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ConversationList } from '@/components/admin/messages/ConversationList';
import { ConnectionStatus } from '@/components/admin/messages/ConnectionStatus';
import { OrdersModal } from '@/components/admin/messages/OrdersModal';
import { useSocketContext } from '@/contexts/SocketContext';
import { getConversations, type Conversation } from '@/lib/api/conversations';
import { useAuthStore } from '@/stores/authStore';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

export default function MessagesPage() {
  const { socket, isConnected } = useSocketContext();
  const user = useAuthStore((state) => state.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);

  // Load conversations
  useEffect(() => {
    loadConversations();
  }, []);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    // Listen for new messages to update conversation list
    socket.on('message:new', ({ conversationId }) => {
      loadConversations(); // Refresh list
    });

    // Listen for unread count updates
    socket.on('conversation:unread', () => {
      loadConversations(); // Refresh list
    });

    return () => {
      socket.off('message:new');
      socket.off('conversation:unread');
    };
  }, [socket]);

  const loadConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data);
      setFilteredConversations(data);
    } catch (error) {
      console.error('Failed to load conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  // Filter conversations by search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter((conv) => {
      const otherUser =
        user?.userType === 'admin' ? conv.participant_partner : conv.participant_admin;
      return (
        otherUser.username.toLowerCase().includes(query) ||
        otherUser.companyName?.toLowerCase().includes(query) ||
        conv.lastMessagePreview.toLowerCase().includes(query)
      );
    });

    setFilteredConversations(filtered);
  }, [searchQuery, conversations, user]);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Messages</h1>
        <p className="text-muted-foreground mt-2">
          {user.userType === 'admin'
            ? 'Communicate with your business partners'
            : 'Message the admin team'}
        </p>
      </div>

      <ConnectionStatus isConnected={isConnected} className="mb-4" />

      <Card>
        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Conversation List */}
        {loading ? (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        ) : (
          <ConversationList
            conversations={filteredConversations}
            currentUserId={user.id}
            currentUserType={user.userType ?? 'reseller'}
            onViewOrders={(conversation) => setSelectedConversation(conversation)}
          />
        )}
      </Card>

      {/* Orders Modal */}
      {selectedConversation && (
        <OrdersModal
          conversationId={selectedConversation.id}
          partnerName={
            user.userType === 'admin'
              ? selectedConversation.participant_partner.username
              : selectedConversation.participant_admin.username
          }
          isOpen={!!selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </div>
  );
}
