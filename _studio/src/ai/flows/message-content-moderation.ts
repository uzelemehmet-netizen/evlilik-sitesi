'use server';

/**
 * @fileOverview A flow that moderates message content for risky personal information.
 *
 * - moderateMessageContent - A function that moderates the content of a message.
 * - ModerateMessageContentInput - The input type for the moderateMessageContent function.
 * - ModerateMessageContentOutput - The return type for the moderateMessageContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateMessageContentInputSchema = z.object({
  message: z.string().describe('The content of the message to be moderated.'),
});
export type ModerateMessageContentInput = z.infer<typeof ModerateMessageContentInputSchema>;

const ModerateMessageContentOutputSchema = z.object({
  isRisky: z.boolean().describe('Whether the message contains risky personal information.'),
  reason: z.string().describe('The reason why the message is considered risky, if applicable.'),
});
export type ModerateMessageContentOutput = z.infer<typeof ModerateMessageContentOutputSchema>;

export async function moderateMessageContent(
  input: ModerateMessageContentInput
): Promise<ModerateMessageContentOutput> {
  return moderateMessageContentFlow(input);
}

const moderateMessageContentPrompt = ai.definePrompt({
  name: 'moderateMessageContentPrompt',
  input: {schema: ModerateMessageContentInputSchema},
  output: {schema: ModerateMessageContentOutputSchema},
  prompt: `You are a content moderation expert.

You will analyze the given message and determine if it contains any risky personal information such as phone numbers, addresses, email addresses or social media handles that could lead to doxxing or unwanted contact.

Message: {{{message}}}

Respond with JSON that indicates whether the message is risky and, if so, the reason.
`,
});

const moderateMessageContentFlow = ai.defineFlow(
  {
    name: 'moderateMessageContentFlow',
    inputSchema: ModerateMessageContentInputSchema,
    outputSchema: ModerateMessageContentOutputSchema,
  },
  async input => {
    const {output} = await moderateMessageContentPrompt(input);
    return output!;
  }
);

