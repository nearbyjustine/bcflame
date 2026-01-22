'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findOrCreateConversation } from '@/lib/api/conversations';
import { toast } from 'sonner';

interface MessageButtonProps {
  userId: number;
  userName: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  showText?: boolean;
}

export function MessageButton({
  userId,
  userName,
  variant = 'outline',
  size = 'default',
  showIcon = true,
  showText = true,
}: MessageButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    try {
      setLoading(true);
      const conversation = await findOrCreateConversation(userId);
      router.push(`/admin-portal/messages/${conversation.id}`);
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to open conversation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={loading}
      variant={variant}
      size={size}
      aria-label={`Message ${userName}`}
    >
      {showIcon && <MessageSquare className="w-4 h-4" />}
      {showText && <span className="ml-2">Message</span>}
    </Button>
  );
}
