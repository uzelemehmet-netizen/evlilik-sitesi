'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { User } from '@/lib/data';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle, ShieldCheck } from 'lucide-react';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface MatchCardProps {
  user: User;
}

export function MatchCard({ user }: MatchCardProps) {
  const [isLiked, setIsLiked] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
  };

  return (
    <Card className="flex flex-col overflow-hidden rounded-lg shadow-lg transition-all hover:shadow-xl">
      <CardHeader className="p-0 relative">
        <Link href={`/chat/${user.id}`}>
          <Image
            src={user.profilePicture.imageUrl}
            alt={`Profile picture of ${user.name}`}
            width={400}
            height={400}
            className="w-full h-48 object-cover"
            data-ai-hint={user.profilePicture.imageHint}
          />
        </Link>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <CardTitle className="flex items-center justify-between text-xl font-headline">
          <Link href={`/chat/${user.id}`} className="hover:underline">
            {user.name}, {user.age}
          </Link>
          {user.isVerified && <ShieldCheck className="h-5 w-5 text-primary" />}
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{user.bio}</p>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between">
        <Button
          variant="outline"
          className="group transition-transform duration-200 ease-in-out hover:scale-105"
          onClick={handleLike}
        >
          <Heart
            className={cn(
              'mr-2 h-5 w-5 transition-colors duration-300',
              isLiked ? 'text-accent fill-accent' : 'text-gray-500'
            )}
          />
          {isLiked ? 'Liked' : 'Like'}
        </Button>
        <Link href={`/chat/${user.id}`} passHref>
          <Button className="bg-primary hover:bg-primary/90 animate-pulse hover:animate-none">
            <MessageCircle className="mr-2 h-5 w-5" />
            Chat
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
