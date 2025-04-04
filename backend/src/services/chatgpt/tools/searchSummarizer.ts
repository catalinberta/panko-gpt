import { tool } from '@langchain/core/tools';
import axios from 'axios';
import { z } from 'zod';
import logger from '../../logger';

const searchSummarizer = async (apiKey?: string, userquery?: string): Promise<string> => {
	if(!apiKey || !userquery) return '';
	let summary = "";

	try {
	const requestHeaders = {
		Accept: "application/json",
		"X-Subscription-Token": apiKey
	}
		const response = await axios.get(`https://api.search.brave.com/res/v1/web/search?q=${userquery}&summary=1`, {
			headers: requestHeaders
		});
		const summarizerSearchKey = response.data.summarizer.key
		const summarizerResponse = await axios.get(`https://api.search.brave.com/res/v1/summarizer/search?key=${summarizerSearchKey}`, {
			headers: requestHeaders
		})
		
		const summarizerData = summarizerResponse.data.summary;
		summarizerData.map((summarizerDataEntity: {data: string}) => {
			summary += summarizerDataEntity.data;
		})
	} catch (e: any) {
		logger.error(`error running searchSummarizer() ${e?.response.data}`);
		throw new Error('Error in search summarizer.');
	}

	return summary;
};

const params = z.string().describe("The user's query for searching the internet");

const searchSummarizerTool = (apiKey?: string) =>
	tool(searchSummarizer.bind(null, apiKey), {
		name: 'searchSummarizer',
		description: 'Search the internet and get a summarization for recent or real-time information',
		schema: params
	});

export default searchSummarizerTool;
