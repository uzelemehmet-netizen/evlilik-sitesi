import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Sparkles } from 'lucide-react';

export default function SignupPage() {
  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-57px)] bg-gray-50 dark:bg-gray-900 px-4 py-12">
      <Card className="mx-auto max-w-sm w-full shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center items-center mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-headline">Join the Nexus</CardTitle>
          <CardDescription>Create your account to start finding your soulmate</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full-name">Full Name</Label>
              <Input id="full-name" placeholder="Alex Doe" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" />
            </div>
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox id="terms" required />
              <Label htmlFor="terms" className="text-sm font-normal">
                I agree to the{' '}
                <Link href="#" className="underline">
                  Terms and Conditions
                </Link>
              </Label>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 mt-2">
              Create an account
            </Button>
          </div>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline text-primary">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
