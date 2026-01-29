'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getMatchById, getCurrentUser, mockMessages } from '@/lib/data';
import type { Message, User } from '@/lib/data';
import { sendMessage } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Lock, Send, Share2, Unlock } from 'lucide-react';

export default function ChatPage() {
  const params = useParams();
  const matchId = params.matchId as string;
  
  const currentUser = getCurrentUser();
  const match = getMatchById(matchId);
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>(mockMessages.filter(m => (m.senderId === matchId || m.receiverId === matchId)));
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to bottom on new message
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  if (!match || !currentUser) {
    return (
      <div className="flex h-full items-center justify-center">
        <p>Match not found.</p>
      </div>
    );
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    const result = await sendMessage(newMessage);
    setIsSending(false);

    if (result.error) {
      toast({
        variant: 'destructive',
        title: 'Message Not Sent',
        description: result.error,
      });
    } else {
      const sentMessage: Message = {
        id: `msg-${Date.now()}`,
        senderId: currentUser.id,
        receiverId: match.id,
        text: newMessage,
        timestamp: new Date(),
      };
      setMessages([...messages, sentMessage]);
      setNewMessage('');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-57px)]">
      <header className="flex items-center gap-4 border-b bg-background p-4">
        <Link href="/">
            <Avatar>
            <AvatarImage src={match.profilePicture.imageUrl} alt={match.name} data-ai-hint={match.profilePicture.imageHint} />
            <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
            </Avatar>
        </Link>
        <div className="flex-1">
          <p className="text-lg font-medium font-headline">{match.name}</p>
          <p className="text-sm text-muted-foreground">Active now</p>
        </div>
      </header>
      
      <Alert variant="default" className="m-4 bg-primary/10 border-primary/20">
        <Lock className="h-4 w-4" />
        <AlertTitle className='font-headline'>Active Match Exclusivity</AlertTitle>
        <AlertDescription>
          While in an active match, other matches are locked for 48 hours. After this period, you can choose to share contact info or continue chatting here.
        </AlertDescription>
        <div className="mt-4 flex gap-2">
            <Button size="sm" variant="secondary"><Share2 className='mr-2 h-4 w-4'/> Share Contact Info</Button>
            <Button size="sm" variant="secondary"><Unlock className='mr-2 h-4 w-4'/> End Exclusive Chat</Button>
        </div>
      </Alert>

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex items-end gap-2',
                message.senderId === currentUser.id ? 'justify-end' : 'justify-start'
              )}
            >
              {message.senderId !== currentUser.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={match.profilePicture.imageUrl} alt={match.name} />
                  <AvatarFallback>{match.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
              <div
                className={cn(
                  'max-w-xs rounded-lg p-3 lg:max-w-md',
                  message.senderId === currentUser.id
                    ? 'bg-primary text-primary-foreground rounded-br-none'
                    : 'bg-muted rounded-bl-none'
                )}
              >
                <p className="text-sm">{message.text}</p>
              </div>
              {message.senderId === currentUser.id && (
                <Avatar className="h-8 w-8">
                  <AvatarImage src={currentUser.profilePicture.imageUrl} alt={currentUser.name} />
                  <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
      <div className="border-t bg-background p-4">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
            autoComplete="off"
          />
          <Button type="submit" size="icon" disabled={isSending}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
