import { tool } from '@langchain/core/tools';
import axios from 'axios';
import { z } from 'zod';
import logger from '../../logger';

interface SummarizerResult {
	summary: string;
	imageUrl: string | null;
}

const searchSummarizerParams = z
	.string()
	.describe(
		"The user's query for searching recent information from the internet and getting an up-to-date summarization and optionally an image."
	);

/**
 * Searches the internet using Brave Search, gets a summarization, and extracts a relevant image URL if available.
 * @param apiKey Your Brave Search API key.
 * @param userquery The search query keywords.
 * @returns A Promise resolving to an object containing the summary text and an image URL (or null).
 */
const searchSummarizer = async (apiKey?: string, userquery?: string): Promise<SummarizerResult> => {
	const result: SummarizerResult = {
		summary: '',
		imageUrl: null
	};

	if (!apiKey || !userquery) {
		logger.warn('Missing API key or userquery for searchSummarizer tool.');

		return result;
	}

	try {
		const requestHeaders = {
			Accept: 'application/json',
			'X-Subscription-Token': apiKey
		};

		const webSearchResponse = await axios.get(
			`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(userquery)}&summary=1&count=1`,
			{
				headers: requestHeaders
			}
		);

		const summarizerSearchKey = webSearchResponse.data?.summarizer?.key;

		if (!summarizerSearchKey) {
			logger.info(`No summarizer key found for query: "${userquery}". Returning empty result.`);

			return result;
		}

		const summarizerResponse = await axios.get(
			`https://api.search.brave.com/res/v1/summarizer/search?key=${summarizerSearchKey}`,
			{
				headers: requestHeaders
			}
		);

		const summarizerData = summarizerResponse.data?.summary;
		if (summarizerData && Array.isArray(summarizerData)) {
			result.summary = summarizerData
				.map((summarizerDataEntity: { data: string }) => summarizerDataEntity.data)
				.join('');
		}

		const enrichments = summarizerResponse.data?.enrichments;

		if (enrichments) {
			if (
				enrichments.entities &&
				enrichments.entities.length > 0 &&
				enrichments.entities[0].images &&
				enrichments.entities[0].images.length > 0 &&
				enrichments.entities[0].images[0].thumbnail?.src
			) {
				result.imageUrl = enrichments.entities[0].images[0].thumbnail.src;
				logger.info(`Found entity image URL in searchSummarizer for query "${userquery}"`);
			} else if (enrichments.images && enrichments.images.length > 0 && enrichments.images[0].thumbnail?.src) {
				result.imageUrl = enrichments.images[0].thumbnail.src;
				logger.info(`Found general enriched image URL in searchSummarizer for query "${userquery}"`);
			}
		}
	} catch (e: any) {
		const errorData = e?.response?.data;
		if (errorData) {
			logger.error(
				`Brave API error during searchSummarizer for query "${userquery}": ${JSON.stringify(errorData)}`
			);
		} else {
			logger.error(`Error running searchSummarizer for query "${userquery}": ${e.message}`);
		}

		return result;
	}

	logger.silly(
		`searchSummarizer completed for query "${userquery}". Summary length: ${result.summary.length}, Image URL: ${result.imageUrl}`
	);
	console.log(3958737534, result);
	return result;
};

const searchSummarizerTool = (apiKey?: string) =>
	tool(searchSummarizer.bind(null, apiKey), {
		name: 'searchSummarizer',
		description:
			'Search the internet and get a summarization for recent or real-time information. Returns an object with `summary` (string) and `imageUrl` (string or null) fields. Use `summary` for the text and `imageUrl` for an associated image.',
		schema: searchSummarizerParams
	});

export default searchSummarizerTool;
