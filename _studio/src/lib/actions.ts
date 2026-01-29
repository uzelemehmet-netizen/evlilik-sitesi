'use server';

import { z } from 'zod';
import { moderateProfileContent } from '@/ai/flows/profile-content-moderation';
import { moderateMessageContent } from '@/ai/flows/message-content-moderation';
import { revalidatePath } from 'next/cache';

const profileSchema = z.object({
  bio: z.string().min(10, 'Bio must be at least 10 characters long.'),
});

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty.'),
});

export async function updateProfile(prevState: any, formData: FormData) {
  const validatedFields = profileSchema.safeParse({
    bio: formData.get('bio'),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors,
    };
  }

  const moderationResult = await moderateProfileContent({ description: validatedFields.data.bio });

  if (moderationResult.isRisky) {
    return {
      error: `Your bio was flagged for the following reason: ${moderationResult.reason}. Please remove any personal information.`,
    };
  }
  
  // In a real app, you would save the bio to the database here.
  console.log('Bio updated successfully:', validatedFields.data.bio);
  
  revalidatePath('/profile');
  return {
    success: 'Profile updated successfully!',
  };
}

export async function sendMessage(message: string) {
  const validatedFields = messageSchema.safeParse({ message });

  if (!validatedFields.success) {
    return {
      error: 'Message is not valid.',
    };
  }

  const moderationResult = await moderateMessageContent({ message: validatedFields.data.message });

  if (moderationResult.isRisky) {
    return {
      error: `Your message was flagged: ${moderationResult.reason}. Please avoid sharing personal contact information.`,
    };
  }

  // In a real app, you would save the message to the database here.
  console.log('Message sent successfully:', validatedFields.data.message);
  
  return {
    success: 'Message sent!',
  };
}
