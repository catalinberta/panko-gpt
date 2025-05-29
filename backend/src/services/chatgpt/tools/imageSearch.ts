import { tool } from '@langchain/core/tools';
import axios from 'axios';
import { z } from 'zod';
import logger from '../../logger';

const searchImageParams = z.string().describe('Keywords to search for a relevant image.');

const searchImage = async (apiKey?: string, keywords?: string): Promise<string | null> => {
	if (!apiKey || !keywords) {
		logger.warn('Missing API key or keywords for searchImage tool.');
		return null;
	}

	try {
		const requestHeaders = {
			Accept: 'application/json',
			'X-Subscription-Token': apiKey
		};

		const webSearchResponse = await axios.get(
			`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(keywords)}&summary=1&count=1`,
			{
				headers: requestHeaders
			}
		);

		const summarizerSearchKey = webSearchResponse.data?.summarizer?.key;

		if (!summarizerSearchKey) {
			logger.debug(`No summarizer key found for keywords: "${keywords}"`);
			return null;
		}

		const summarizerResponse = await axios.get(
			`https://api.search.brave.com/res/v1/summarizer/search?key=${summarizerSearchKey}`,
			{
				headers: requestHeaders
			}
		);

		const enrichments = summarizerResponse.data?.enrichments;

		if (!enrichments) {
			logger.debug(`No enrichments found in summarizer response for key: "${summarizerSearchKey}"`);
			return null;
		}

		if (
			enrichments.entities &&
			enrichments.entities.length > 0 &&
			enrichments.entities[0].images &&
			enrichments.entities[0].images.length > 0 &&
			enrichments.entities[0].images[0].thumbnail?.src
		) {
			const entityImageUrl = enrichments.entities[0].images[0].thumbnail.src;
			logger.debug(`Found entity image URL from summarizer: ${entityImageUrl} for keywords "${keywords}"`);
			return entityImageUrl;
		}

		if (enrichments.images && enrichments.images.length > 0 && enrichments.images[0].thumbnail?.src) {
			const enrichedImageUrl = enrichments.images[0].thumbnail.src;
			logger.debug(
				`Found general enriched image URL from summarizer: ${enrichedImageUrl} for keywords "${keywords}"`
			);
			return enrichedImageUrl;
		}

		logger.debug(`No relevant images found in summarizer enrichments for keywords: "${keywords}"`);
		return null;
	} catch (e: any) {
		const errorData = e?.response?.data;
		if (errorData) {
			logger.error(
				`Brave API error during image search via summarizer for keywords "${keywords}": ${JSON.stringify(
					errorData
				)}`
			);
		} else {
			logger.error(`Error running searchImage (via summarizer) for keywords "${keywords}": ${e.message}`);
		}

		return null;
	}
};

const searchImageTool = (apiKey?: string) =>
	tool(searchImage.bind(null, apiKey), {
		name: 'imageSearch',
		description:
			'Search for a relevant image on the web by performing a Brave search and extracting the most relevant image from the search summarization results. Use this for photos of people, places, or objects where a representative image is needed.',
		schema: searchImageParams
	});

export default searchImageTool;
