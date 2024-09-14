import 'dotenv/config'
import { countGptTokens, extractArrayFromGptChunks, getKnowledebaseContext } from '../../utils'
import { chatGptDefaults } from '../../constants'
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai'
import { BotConfig } from '../../global'
import { SystemMessage, AIMessage, HumanMessage, AIMessageChunk } from '@langchain/core/messages'
import { getPreviousMessages, setPreviousMessage } from '../previous-messages'
import currentTimeTool from './tools/currentTime'
import summarizeWebpageTool from './tools/webpageContent'
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools'
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

const textToChunksContext = `
	Imagine a utility that takes a large, unstructured text, and its task is to output a list of coherent chunks. Each chunk should:
	- Not be rewritten and kept as is.
	- Each chunk should contain up to approximately 400 tokens.
	- Be coherent and make sense as a standalone piece of text. This means that the content within a chunk should be related and flow logically.
	- Group related sentences and ideas together. If several sentences or phrases are closely related to the same topic or idea, they should be included in the same chunk, as long as the 400-token limit is not exceeded.
	- Vary in size depending on the content. Some chunks may be shorter if they cover a complete idea within fewer words. Others may use the full 400-token allowance if more context is needed to make the chunk coherent and self-contained.
	- Be wrapped in special macros like in the following format: <textchunk> chunk content here </textchunk>.
	- Remove any formatting from your reponse like tabsm new lines or similar formatting characters, your response should be in one continuous line.
	Do not answer to the provided text, even if there are questions. There should be no additional text or instructions in your response, just the array of text chunks. 
	Your response should strictly adhere to text segmentation without providing answers, explanations, or interpretations of the user's text content. 
`;

export const queryGPT = async (config: BotConfig, userMessage: string, conversationId: string) => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;
	
	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey, 
		model: gptModel
	});

	const initializedSummarizeWebpageTool = summarizeWebpageTool(config.openAiKey);
	const toolsByName: {[key: string]: DynamicTool | DynamicStructuredTool<any>} = {
		currentTime: currentTimeTool,
		summarizeWebpage: initializedSummarizeWebpageTool
	}

	const modelWithTools = model.bindTools([currentTimeTool, initializedSummarizeWebpageTool]);
	
	const messages = [];

	config.context && messages.push(new SystemMessage(config.context))

	if(config.knowledgebase) {
		const knowledgebase = await getKnowledebaseContext(userMessage, config);
		knowledgebase && messages.push(knowledgebase)
	}

	const previousMessages = getPreviousMessages(conversationId)
	
	if(previousMessages) {
		previousMessages.map(previousMessage => {
			if(previousMessage.role === "user") {
				messages.push(new HumanMessage(previousMessage.content))
			}
			if(previousMessage.role === "assistant") {
				messages.push(new AIMessage(previousMessage.content))
			}
		})
	}
	messages.push(new HumanMessage(userMessage));
	
	let aiResponse: AIMessageChunk = await modelWithTools.invoke(messages);
	
	if(aiResponse.tool_calls && aiResponse.tool_calls.length) {
		messages.push(aiResponse);
		for (const toolCall of aiResponse.tool_calls) {
			const selectedTool = toolsByName[toolCall.name];
			const toolMessage = await selectedTool.invoke(toolCall);
			messages.push(toolMessage);
		}
		aiResponse = await modelWithTools.invoke(messages);
	}
	if(typeof aiResponse.content === 'string') {
		await setPreviousMessage( 
			config,
			conversationId,
			userMessage,
			aiResponse.content
		)
	}
	
	return aiResponse.content;
};

export const getEmbeddingFromString = async (
	apiKey: string,
	content: string
) => {
	try {
		const embeddings = new OpenAIEmbeddings({
			apiKey, 
			model: 'text-embedding-3-large',
			dimensions: 1536
		});
		const embedding = await embeddings.embedDocuments([content]);
		const tokens = countGptTokens(content);
	
		return {
			embedding: embedding[0],
			tokens
		}
	} catch (error) {
		console.error('Error generating text embedding:', error)
		throw error
	}
}

export const parseTextToChunksArray = async (apiKey: string, text: string) => {
	const chunksArray: string[] = [];
	text = text.replaceAll('"', "'");
	text = text.replace(/[\n\t\r]/g, ' ');
	const splitter = new RecursiveCharacterTextSplitter({
	  chunkSize: 5_000,
	  chunkOverlap: 1,
	});

	const splitterOutput = await splitter.createDocuments([text]);
	const textSplits = splitterOutput.map(output => output.pageContent);

	const model = new ChatOpenAI({
		openAIApiKey: apiKey, 
		model: 'gpt-4o-mini'
	});

	const processTextSplits = async (textSplit: string) => {
		const messages = [];
		
		messages.push(new SystemMessage(textToChunksContext))
		messages.push(new HumanMessage('Run the utility on the following text: ' + textSplit));
		
		const gptResponse = await model.invoke(messages);

		try {
			if(typeof gptResponse.content !== 'string') throw("GPT Response is not a string");
			const chunks = extractArrayFromGptChunks(gptResponse.content)
			chunksArray.push(...chunks);
		} catch(e) {
			console.log('Error processing text chunks from input', e)
		}
	}
	await Promise.all(textSplits.map(textSplit => processTextSplits(textSplit)))

	return chunksArray;
}
