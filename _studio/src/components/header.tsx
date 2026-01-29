import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Heart, LogOut, Settings, ShieldCheck, Sparkles, User, Users } from 'lucide-react';
import { getCurrentUser } from '@/lib/data';

export default function Header() {
  const user = getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <Sparkles className="h-6 w-6 text-primary" />
          <span className="font-bold font-headline text-lg">Soulmate Nexus</span>
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Matches
          </Link>
          <Link
            href="/profile"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Profile
          </Link>
          <Link
            href="/admin"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            Admin
          </Link>
        </nav>
        <div className="flex flex-1 items-center justify-end gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-9 w-9">
                   <AvatarImage 
                    src={user?.profilePicture.imageUrl} 
                    alt={user?.name}
                    data-ai-hint={user?.profilePicture.imageHint} 
                  />
                  <AvatarFallback>{user?.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.isVerified ? 'Verified' : 'Not Verified'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile/edit">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
