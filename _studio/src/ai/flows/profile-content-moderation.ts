'use server';

/**
 * @fileOverview A flow that checks profile descriptions for risky personal information.
 *
 * - moderateProfileContent - A function that moderates the profile content.
 * - ModerateProfileContentInput - The input type for the moderateProfileContent function.
 * - ModerateProfileContentOutput - The return type for the moderateProfileContent function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ModerateProfileContentInputSchema = z.object({
  description: z
    .string()
    .describe('The profile description to check for risky personal information.'),
});
export type ModerateProfileContentInput = z.infer<typeof ModerateProfileContentInputSchema>;

const ModerateProfileContentOutputSchema = z.object({
  isRisky: z
    .boolean()
    .describe(
      'Whether the profile description contains risky personal information or not.'
    ),
  reason: z
    .string()
    .describe(
      'The reason why the profile description is considered risky, if applicable.'
    ),
});
export type ModerateProfileContentOutput = z.infer<typeof ModerateProfileContentOutputSchema>;

export async function moderateProfileContent(
  input: ModerateProfileContentInput
): Promise<ModerateProfileContentOutput> {
  return moderateProfileContentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'moderateProfileContentPrompt',
  input: {schema: ModerateProfileContentInputSchema},
  output: {schema: ModerateProfileContentOutputSchema},
  prompt: `You are an AI agent specializing in identifying risky personal information in user profile descriptions for a dating app.

  Your task is to analyze the provided profile description and determine if it contains any information that could potentially lead to doxxing or unwanted contact, such as phone numbers, addresses, email addresses, or other personally identifiable information.

  Respond with JSON format, and make sure the isRisky field is a boolean.

  Profile Description: {{{description}}} `,
});

const moderateProfileContentFlow = ai.defineFlow(
  {
    name: 'moderateProfileContentFlow',
    inputSchema: ModerateProfileContentInputSchema,
    outputSchema: ModerateProfileContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
