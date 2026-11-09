
'use server';
/**
 * @fileOverview Suggests primary and alternative license plate numbers based on an image for parking violations.
 *
 * - suggestLicensePlateAlternatives - A function that suggests license plate numbers.
 * - SuggestLicensePlateAlternativesInput - The input type for the suggestLicensePlateAlternatives function.
 * - SuggestLicensePlateAlternativesOutput - The return type for the suggestLicensePlateAlternatives function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestLicensePlateAlternativesInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a license plate, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type SuggestLicensePlateAlternativesInput = z.infer<typeof SuggestLicensePlateAlternativesInputSchema>;

const SuggestLicensePlateAlternativesOutputSchema = z.object({
  primaryPlate: z.string().describe('The most likely license plate number recognized by the AI.'),
  alternatives: z
    .array(z.string())
    .describe('An array of alternative license plate numbers suggested by the AI, not including the primaryPlate.'),
});
export type SuggestLicensePlateAlternativesOutput = z.infer<typeof SuggestLicensePlateAlternativesOutputSchema>;

export async function suggestLicensePlateAlternatives(
  input: SuggestLicensePlateAlternativesInput
): Promise<SuggestLicensePlateAlternativesOutput> {
  return suggestLicensePlateAlternativesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestLicensePlateAlternativesPrompt',
  input: {schema: SuggestLicensePlateAlternativesInputSchema},
  output: {schema: SuggestLicensePlateAlternativesOutputSchema},
  prompt: `You are an AI assistant helping traffic officers to identify license plates from images, specifically for the purpose of issuing parking challans.

You are given an image of a license plate.

Your task is to:
1. Identify the most likely license plate number from the image. Set this as 'primaryPlate'.
2. Suggest a few alternative license plate numbers based on the image, considering potential misread characters or ambiguities. Set these as 'alternatives'. Ensure the 'primaryPlate' is not repeated in the 'alternatives' list.

Image: {{media url=photoDataUri}}

Respond with the identified primaryPlate and any alternatives in the specified output format.`,
});

const suggestLicensePlateAlternativesFlow = ai.defineFlow(
  {
    name: 'suggestLicensePlateAlternativesFlow',
    inputSchema: SuggestLicensePlateAlternativesInputSchema,
    outputSchema: SuggestLicensePlateAlternativesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      // Handle cases where the AI might not return a valid output, e.g. safety reasons or parse error
      // For now, we'll return empty/default values, but this could be more robust.
      return { primaryPlate: "", alternatives: [] };
    }
    return output;
  }
);

