import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../../logger';
import OpenAI from 'openai';

const imageGenParams = z.object({
	prompt: z.string().describe('Detailed description of the image to generate.'),
	size: z
		.enum(['auto', '1024x1024', '1536x1024', '1024x1536', '256x256', '512x512', '1792x1024', '1024x1792'])
		.default('512x512')
});

const generateImage = async (
	openaiApiKey: string,
	{ prompt, size }: z.infer<typeof imageGenParams>
): Promise<string> => {
	try {
		logger.debug(`Generating image with prompt: ${prompt}`);
		const openai = new OpenAI({ apiKey: openaiApiKey });

		const res = await openai.images.generate({
			prompt,
			size
		});

		const url = res.data?.[0]?.url ?? 'Image not generated.';
		if (!url) {
			logger.warn('No Image URL returned by OpenAI');
		}

		return url;
	} catch (e) {
		const errorMessage = `OpenAI image generation failed: ${e}`;
		logger.error(errorMessage);
		return errorMessage;
	}
};

const imageGenerationTool = (openaiApiKey: string) => {
	return tool(
		async (input: unknown) => {
			const parseResult = imageGenParams.safeParse(input);

			if (!parseResult.success) {
				logger.warn('Invalid input for imageGeneration:', parseResult.error);
				return 'Invalid input provided.';
			}

			return await generateImage(openaiApiKey, parseResult.data);
		},
		{
			name: 'imageGeneration',
			description:
				'Generates an image based on a user prompt using OpenAI’s gpt-image-1 model. Returns a string containing an image url or an error.',
			schema: imageGenParams
		}
	);
};

export default imageGenerationTool;
