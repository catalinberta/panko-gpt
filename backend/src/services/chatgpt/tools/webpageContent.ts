import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import webScrapeUrls from '../../scraper';

const schema = z.object({
	userquery: z.string().describe("The user's motive for needing the content of the URL"),
	url: z.string().describe('Properly formatted URL from user query')
});

const summarizeWebpageUrlTool = (apiKey: string) =>
	tool(({ userquery, url }: any) => webScrapeUrls([url], apiKey, userquery), {
		name: 'summarizeWebpageUrl',
		description: 'Get summary from a webpage url',
		schema
	});

export default summarizeWebpageUrlTool;
