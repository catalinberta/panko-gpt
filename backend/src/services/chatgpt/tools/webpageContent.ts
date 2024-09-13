import { getWebPageContentFromUrl, extractTextFromHTML, estimateChatGPTTokens } from "../../../utils"
import { tool } from "@langchain/core/tools"
import { z } from "zod";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";



const summarizeWebpage = async (apiKey: string, {userquery, url}: any): Promise<string> => {
	let pageContent
	try {
		pageContent = await getWebPageContentFromUrl(url)
	} catch (e) {
		console.log('getWebPageContentFromUrl()', e)
		throw new Error('Error opening page, might be protected from scraping.')
	}

	pageContent = extractTextFromHTML(pageContent)

	const chunkMaxTokenSize = 4000
	const pageContentTokens = estimateChatGPTTokens(pageContent)
	const pageContentChunkLength = Math.floor(
		pageContent.length / Math.ceil(pageContentTokens / chunkMaxTokenSize)
	)
	const pageContentChunks: string[] = []
	let summarizedContent = ''
	if (pageContentTokens > chunkMaxTokenSize) {
		const chunkCount = Math.ceil(pageContentTokens / chunkMaxTokenSize)
		for (let i = 0; i < chunkCount; i++) {
			const start = i * pageContentChunkLength
			const end = start + pageContentChunkLength
			pageContentChunks.push(pageContent.substring(start, end))
		}
	} else {
		pageContentChunks.push(pageContent)
	}
	
	await Promise.all(
		pageContentChunks.map(async (chunk, index) => {
			const model = new ChatOpenAI({
				openAIApiKey: apiKey, 
				model: 'gpt-4o-mini'
			});
			const messages = [];
			messages.push(new SystemMessage(`Rewrite the following text up to a maximum of 400 tokens, but attention to this particular query "${userquery}"`))
			messages.push(new HumanMessage(chunk));
			const gptResponse = await model.invoke(messages);
			summarizedContent += gptResponse.content || ''
		})
	)
		
	return summarizedContent
}
	
const schema = z.object({
	userquery: z.string().describe("The user's motive for needing the content of the URL"),
	url: z.string().describe("Properly formatted URL from user query")
});
	
const summarizeWebpageTool = (apiKey: string) => tool(
	summarizeWebpage.bind(null, apiKey),
	{
		name: "summarizeWebpage",
		description: "Access the internet and get the summarization of a webpage",
		schema
	}
);

export default summarizeWebpageTool;