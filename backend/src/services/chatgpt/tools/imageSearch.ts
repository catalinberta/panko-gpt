import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../../logger';

const searchParams = z.string().describe("The user's query for searching a recent related image to the user query.");

const googleImageSearch = async (apiKey: string, cx: string, query: string): Promise<string | null> => {
	try {
		const res = await fetch(
			`https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(
				query
			)}&searchType=image&num=10&key=${apiKey}&cx=${cx}`
		);
		const data = await res.json();
		if (!data.items) return null;

		const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
		const safeItem = data.items.find((item: any) => allowed.includes(item.mime));

		return safeItem?.link ?? null;
	} catch (e) {
		logger.error(`Google Image Search failed: ${e}`);
		return null;
	}
};

const imageSearchTool = (googleApiKey?: string, googleCx?: string) => {
	return tool(
		async (input: unknown) => {
			const parseResult = searchParams.safeParse(input);

			if (!parseResult.success || !googleApiKey || !googleCx) {
				logger.warn('Invalid input for imageSearchTool:', parseResult.error);
				return { summary: 'Invalid input provided.', imageUrl: null };
			}

			return await googleImageSearch(googleApiKey, googleCx, parseResult.data);
		},
		{
			name: 'imageSearch',
			description: 'Searches the internet for a related image to the user query. Returns a string URL or null.',
			schema: searchParams
		}
	);
};

export default imageSearchTool;
