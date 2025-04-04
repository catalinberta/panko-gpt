import 'dotenv/config';
import { countGptTokens, extractArrayFromGptChunks, getKnowledebaseContext, sleep } from '../../utils';
import { chatGptDefaults } from '../../constants';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { BotConfig } from '../../global';
import { SystemMessage, AIMessage, HumanMessage, AIMessageChunk, MessageContent } from '@langchain/core/messages';
import { getPreviousMessages, setPreviousMessage } from '../previous-messages';
import summarizeWebpageUrlTool from './tools/webpageContent';
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import searchSummarizerTool from './tools/searchSummarizer';
import logger from '../logger';

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

export const queryGPT = async (config: BotConfig, userMessage: string, conversationId: string): Promise<MessageContent> => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;

	logger.verbose(`Using model: ${gptModel}`);

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: gptModel
	});

	const initializedSummarizeWebpageUrlTool = summarizeWebpageUrlTool(config.openAiKey);
	const initializedSearchSummarizerTool = searchSummarizerTool(config.functionSearchSummarizerKey);

	const toolsByName: {
		[key: string]: DynamicTool | DynamicStructuredTool<any>;
	} = {
		summarizeWebpageUrl: initializedSummarizeWebpageUrlTool,
		searchSummarizer: initializedSearchSummarizerTool
	};
	
	const tools = []
	config.functionSearchSummarizer && tools.push(initializedSearchSummarizerTool);
	config.functionUrlSummarizer && tools.push(initializedSummarizeWebpageUrlTool);
	const modelWithTools = model.bindTools(tools);

	const messages = [];

	messages.push(new SystemMessage(`Current time: ${String(new Date())}`));
	config.context && messages.push(new SystemMessage(config.context));
	
	if (config.knowledgebase) {
		const knowledgebase = await getKnowledebaseContext(userMessage, config);
		knowledgebase && messages.push(knowledgebase);
	}
	
	const previousMessages = getPreviousMessages(conversationId);
	
	if (previousMessages) {
		previousMessages.map(previousMessage => {
			if (previousMessage.role === 'user') {
				messages.push(new HumanMessage(previousMessage.content));
			}
			if (previousMessage.role === 'assistant') {
				messages.push(new AIMessage(previousMessage.content));
			}
		});
	}
	messages.push(new HumanMessage(userMessage));
	messages.push(new SystemMessage('Answer in the same language as the last message'));

	logger.silly(`llm messages: ${messages}`);

	let aiResponse: AIMessageChunk = await modelWithTools.invoke(messages);

	if (aiResponse.tool_calls && aiResponse.tool_calls.length) {
		messages.push(aiResponse);
		for (const toolCall of aiResponse.tool_calls) {
			logger.silly(`Using llm tool: ${toolCall.name}`);
			const selectedTool = toolsByName[toolCall.name];
			const toolMessage = await selectedTool.invoke(toolCall);
			logger.silly(`Tool response: ${toolMessage}`);
			messages.push(toolMessage);
		}
		aiResponse = await modelWithTools.invoke(messages);
	}
	if (typeof aiResponse.content === 'string') {
		await setPreviousMessage(config, conversationId, userMessage, aiResponse.content);
	}

	logger.silly(`Llm response: ${aiResponse.content}`);
	
	return aiResponse.content;
};

export const getReactionType = async (config: BotConfig, platform: string, emojiList: string[], userMessage: string, gptAnswer: string) => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: gptModel
	});

	const messages = [];

	messages.push(new SystemMessage(`You are an intelligent assistant that decides whether an AI response was necessary or if a simple emoji reaction was sufficient.`));
	
	if(emojiList && emojiList.length) {
		messages.push(new SystemMessage(`Supported emojis are: ${emojiList.join(', ')}.`));
	}

	messages.push(new SystemMessage(`
		- If the user's message is a basic gratitude or redundant confirmation (e.g., "Thanks!", "Got it", "Cool", "Okay", "Yes", "Understood", "Sure"), return a suitable ${platform} emoji (e.g. 🤗).  
		- **Do not react if the message is a question, even if it does not end with a question mark.** This includes anything seeking information, explanations, or calculations (e.g., "What's 2+2", "Tell me how this works", "Explain this").  
		- **Do not react if the user made a request** (e.g., "Send me that file", "Generate a summary", "Give me an example").  
		- **Do not react if the reply had a question.
		- **Do not react if the reply had any form of explanation.
		- Avoid using very common emojis repeatedly. Instead, vary them randomly when appropriate.  
		- Your only scope is to ensure an emoji is only returned instead of saying welcome to a user's appreciation.
		- If you are not sure or confident about the decision, return nothing.
		- If the AI's reply made sense or clarified anything, return nothing.  
		- Do not include any explanations or extra text—only return the ${platform} emoji or nothing.

		Message: User: "${userMessage}" | AI: "${gptAnswer}"  
	`));

	const aiResponse = await model.invoke(messages);

	if(aiResponse.content) {
		logger.verbose(`Using reaction: ${aiResponse.content}`);
	}
	
	return aiResponse.content;
};

export const getEmbeddingFromString = async (apiKey: string, content: string) => {
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
		};
	} catch (error) {
		logger.error(`Error generating text embedding: ${error}`);
		throw error;
	}
};

export const parseTextToChunksArray = async (apiKey: string, text: string) => {
	const textBatchSize = 8000;
	const chunksArray: string[] = [];
	text = text.replaceAll('"', "'");
	text = text.replace(/[\n\t\r]/g, ' ');
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: textBatchSize
	});

	const splitterOutput = await splitter.createDocuments([text]);
	const textSplits = splitterOutput.map(output => output.pageContent);
	logger.info(
		`Knowledgebase Update: Processing ${textSplits.length} batches of ~${textBatchSize} chars each. Please wait...`
	);
	const model = new ChatOpenAI({
		openAIApiKey: apiKey,
		model: 'gpt-4o-mini'
	});

	const processTextSplits = async (textSplit: string, currentIndex: number) => {
		const messages = [];

		messages.push(new SystemMessage(textToChunksContext));
		messages.push(new HumanMessage('Run the utility on the following text: ' + textSplit));

		const gptResponse = await model.invoke(messages);

		try {
			if (typeof gptResponse.content !== 'string') throw 'GPT Response is not a string';
			const chunks = extractArrayFromGptChunks(gptResponse.content);
			chunksArray.push(...chunks);
			logger.info(
				`Knowledgebase Update: ${currentIndex + 1}/${textSplits.length}  : Pushing ${chunks.length} chunks`
			);
			if (textSplits.length === currentIndex + 1) {
				logger.info('Knowledgebase Update: Finished!');
			}
			await sleep(500);
		} catch (e) {
			logger.error(`Error processing knowledgebase chunks from input ${e}`);
		}
	};

	for (let i = 0; i < textSplits.length; i++) {
		await processTextSplits(textSplits[i], i);
	}

	return chunksArray;
};
