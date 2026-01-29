'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { getCurrentUser } from '@/lib/data';
import { updateProfile } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';

const profileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
});

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

export default function EditProfilePage() {
  const user = getCurrentUser();
  const { toast } = useToast();

  const [state, formAction] = useFormState(updateProfile, {
    error: undefined,
    success: undefined,
  });

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      bio: user?.bio || '',
    },
  });

  useEffect(() => {
    if (state?.error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: typeof state.error === 'string' ? state.error : 'Please check the form for errors.',
      });
    }
    if (state?.success) {
      toast({
        title: 'Success!',
        description: state.success,
      });
    }
  }, [state, toast]);

  return (
    <div className="container mx-auto max-w-2xl px-4 py-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Edit Profile</CardTitle>
          <CardDescription>Update your personal details and verify your identity.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-6">
            <div className="grid gap-2">
              <Label htmlFor="bio">About Me</Label>
              <Textarea
                id="bio"
                name="bio"
                defaultValue={user?.bio}
                rows={5}
                placeholder="Tell us something about yourself..."
              />
              {typeof state?.error !== 'string' && state?.error?.bio && (
                <p className="text-sm text-destructive">{state.error.bio[0]}</p>
              )}
            </div>
            <SubmitButton />
          </form>

          <Separator className="my-8" />

          <div>
            <h3 className="text-lg font-semibold font-headline">Identity Verification (KYC)</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Verify your identity to get a badge on your profile and increase trust.
            </p>
            <div className="mt-4 space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="id-upload">Upload ID Document</Label>
                <Input id="id-upload" type="file" />
                <p className="text-xs text-muted-foreground">e.g., Passport, Driver's License</p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="selfie-upload">Upload a Selfie</Label>
                <Input id="selfie-upload" type="file" />
                <p className="text-xs text-muted-foreground">
                  Make sure your face is clearly visible.
                </p>
              </div>
              <Button variant="secondary">Submit for Verification</Button>
            </div>
            <Alert className="mt-6">
              <Terminal className="h-4 w-4" />
              <AlertTitle>Admin Verification</AlertTitle>
              <AlertDescription>
                Our team will review your documents and you will be notified upon approval.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
