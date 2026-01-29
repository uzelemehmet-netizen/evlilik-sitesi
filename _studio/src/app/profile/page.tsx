import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/data';
import { ShieldCheck, Star, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function ProfilePage() {
  const user = getCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Could not find user profile.</p>
        <Link href="/login">
          <Button className="mt-4">Login</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-4xl mx-auto overflow-hidden shadow-lg">
        <CardHeader className="p-0">
          <div className="relative h-48 w-full bg-muted">
            <Image
              src="https://picsum.photos/seed/header/1200/300"
              alt="Profile banner"
              layout="fill"
              objectFit="cover"
              className="opacity-50"
              data-ai-hint="abstract background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6 relative">
          <div className="absolute -top-16 left-6">
            <AvatarWithStatus />
          </div>
          <div className="flex justify-between items-center pt-16">
            <div>
              <CardTitle className="text-3xl font-headline flex items-center gap-2">
                {user.name}, {user.age}
                {user.isVerified && <ShieldCheck className="h-7 w-7 text-primary" title="Verified Account" />}
              </CardTitle>
              <CardDescription className="mt-1">
                Marriage Intent: <Badge variant="secondary">{user.marriageIntent}</Badge>
              </CardDescription>
            </div>
            <Link href="/profile/edit">
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" /> Edit Profile
              </Button>
            </Link>
          </div>
          
          <Separator className="my-6" />

          <div>
            <h3 className="text-lg font-semibold font-headline">About Me</h3>
            <p className="mt-2 text-muted-foreground">{user.bio}</p>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold font-headline">Subscription</h3>
              <Card className="mt-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl font-headline">
                    <Star className="text-yellow-500" /> Premium Member
                  </CardTitle>
                  <CardDescription>You have full access to all features.</CardDescription>
                </CardHeader>
                <CardFooter className="flex gap-2">
                  <Button variant="secondary">Cancel Subscription</Button>
                </CardFooter>
              </Card>
            </div>
             <div>
              <h3 className="text-lg font-semibold font-headline">Account</h3>
              <Card className="mt-2 bg-destructive/10 border-destructive">
                <CardHeader>
                   <CardTitle className="text-xl font-headline">Delete Account</CardTitle>
                  <CardDescription>Permanently delete your account and all associated data.</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="destructive">
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Account
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AvatarWithStatus() {
  const user = getCurrentUser();
  if (!user) return null;

  return (
    <div className="relative">
      <Image
        src={user.profilePicture.imageUrl}
        alt={`Profile picture of ${user.name}`}
        width={128}
        height={128}
        className="rounded-full border-4 border-background shadow-md"
        data-ai-hint={user.profilePicture.imageHint}
      />
      {user.isVerified && 
        <div className="absolute bottom-1 right-1 bg-primary rounded-full p-1.5 border-2 border-background">
          <ShieldCheck className="h-4 w-4 text-primary-foreground" />
        </div>
      }
    </div>
  );
}
