import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import logger from '../../logger';
import { GoogleCustomSearch } from '@langchain/community/tools/google_custom_search';
import scrapeAndSummarizeUrls from '../../scraper';
import { createLLM, summarizeText } from '..';
import { chatGptDefaults } from '../../../constants';
import { HumanMessage } from '@langchain/core/messages';

const searchParams = z
	.string()
	.describe("The user's query for searching the internet in real-time to get a text summary.");

const webSearch = async (
	openAiKey: string,
	googleApiKey: string,
	googleCx: string,
	userquery: string
): Promise<string> => {
	const errorResult = 'An error occurred during the search.';
	try {
		const maxSummaryTokens = 1000;
		const googleSearch = new GoogleCustomSearch({
			apiKey: googleApiKey,
			googleCSEId: googleCx
		});

		const rawResults = await googleSearch.call(userquery);
		let searchResults: any[] = [];

		try {
			searchResults = JSON.parse(rawResults);
		} catch {
			logger.warn('Failed to parse Google Custom Search results');
		}

		let webSearchContent = searchResults.map((r: any) => `${r.title}: ${r.snippet}`).join('\n');

		const topSources = await determineTopSources(openAiKey, searchResults, 4, userquery);

		if (topSources.length) {
			const links = topSources.map((r: any) => r.link).slice(0, 5);
			const contentFromLinks = await scrapeAndSummarizeUrls(links, openAiKey, userquery);
			webSearchContent += ' ' + contentFromLinks;
		}

		const summary = summarizeText(openAiKey, webSearchContent, maxSummaryTokens, userquery);

		return summary ?? 'Could not retrieve web search results.';
	} catch (e) {
		logger.error(`Error in webSearch for query "${userquery}": ${e}`);
		return errorResult;
	}
};

const determineTopSources = async (
	openAiKey: string,
	sources: string[],
	maxSources: number = 3,
	userquery: string
): Promise<object[]> => {
	const schema = z.object({ topSources: z.array(z.object({ title: z.string(), link: z.string() })) });

	const llm = createLLM(openAiKey, chatGptDefaults.smallModel).withStructuredOutput(schema);
	const prompt = `From the following sources, select the top ${maxSources} most relevant to: "${userquery}". 
              Sources: ${JSON.stringify(sources)}`;

	const response = await llm.invoke([
		new HumanMessage({
			content: prompt
		})
	]);
	return response.topSources;
};

const webSearchTool = (openAiKey: string, googleApiKey?: string, googleCx?: string) => {
	return tool(
		async (input: unknown) => {
			const parseResult = searchParams.safeParse(input);

			if (!parseResult.success || !googleApiKey || !googleCx) {
				logger.warn('Invalid input for webSearchTool:', parseResult.error);
				return 'Invalid input provided.';
			}

			return await webSearch(openAiKey, googleApiKey, googleCx, parseResult.data);
		},
		{
			name: 'webSearch',
			description: 'Searches the internet in real-time for up-to-date information. Returns a text summary',
			schema: searchParams
		}
	);
};

export default webSearchTool;
