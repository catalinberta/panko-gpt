import 'dotenv/config';
import { countGptTokens, extractArrayFromGptChunks, getKnowledebaseContext, sleep } from '../../utils';
import { chatGptDefaults } from '../../constants';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { BotConfig } from '../../global';
import {
	SystemMessage,
	AIMessage,
	HumanMessage,
	AIMessageChunk,
	MessageContent,
	BaseMessageLike
} from '@langchain/core/messages';
import { getPreviousMessages, setPreviousMessage } from '../previous-messages';
import summarizeWebpageUrlTool from './tools/webpageContent';
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import searchSummarizerTool from './tools/searchSummarizer';
import logger from '../logger';
import searchImageTool from './tools/imageSearch';
import { ReactionEmoji } from 'discord.js';

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

type QueryGptResult = {
	response: string;
	toolMessages: string[];
};

export const queryGPT = async (
	config: BotConfig,
	userMessage: string,
	conversationId: string,
	customTools?: DynamicStructuredTool<any>[] | DynamicTool[] | undefined,
	customToolsByName?: {
		[key: string]: DynamicTool | DynamicStructuredTool<any>;
	},
	customPrompt?: {
		system?: SystemMessage[];
		assistant?: AIMessage[];
		user?: HumanMessage[];
	}
): Promise<QueryGptResult> => {
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
		searchSummarizer: initializedSearchSummarizerTool,
		summarizeWebpageUrl: initializedSummarizeWebpageUrlTool
	};
	const messages = [];

	const tools = [];
	config.functionSearchSummarizer && tools.push(initializedSearchSummarizerTool);
	config.functionSearchSummarizer &&
		messages.push(
			new SystemMessage(
				'Do not generate image urls yourself. You can use searchSummarizer tool to also look for images to enrich responses.'
			)
		);
	config.functionUrlSummarizer && tools.push(initializedSummarizeWebpageUrlTool);

	if (customTools && customTools.length) {
		tools.push(...customTools);
	}
	customToolsByName &&
		Object.keys(customToolsByName).forEach(toolName => {
			toolsByName[toolName] = customToolsByName[toolName];
		});

	const modelWithTools = model.bindTools(tools);

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
	messages.push(new SystemMessage('Answer in the same language as the following user message'));
	messages.push(new HumanMessage(userMessage));

	customPrompt && customPrompt.system && messages.push(...customPrompt.system);
	customPrompt && customPrompt.assistant && messages.push(...customPrompt.assistant);
	customPrompt && customPrompt.user && messages.push(...customPrompt.user);

	logger.silly(`llm messages: ${messages}`);

	let aiResponse: AIMessageChunk = await modelWithTools.invoke(messages);
	const toolMessages: string[] = [];
	if (aiResponse.tool_calls && aiResponse.tool_calls.length) {
		messages.push(aiResponse);
		for (const toolCall of aiResponse.tool_calls) {
			logger.silly(`Using llm tool: ${toolCall.name}`);
			const selectedTool = toolsByName[toolCall.name];
			const toolMessage = await selectedTool.invoke(toolCall);
			logger.silly(`Tool response: ${JSON.stringify(toolMessage, null, 2)}`);
			messages.push(toolMessage);
			toolMessages.push(String(toolMessage.content));
		}
		aiResponse = await modelWithTools.invoke(messages);
	}
	const responseContent = Array.isArray(aiResponse.content) ? aiResponse.content.join('\n') : aiResponse.content;

	await setPreviousMessage(config, conversationId, userMessage, responseContent);

	logger.silly(`Llm response: ${responseContent}`);

	return {
		response: responseContent,
		toolMessages
	};
};

export const getReactionType = async (
	config: BotConfig,
	platform: string,
	emojiList: string[],
	userMessage: string,
	gptAnswer: MessageContent
): Promise<ReactionEmoji> => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: gptModel
	});

	const messages = [];

	messages.push(
		new SystemMessage(
			`You are an intelligent assistant that decides whether an AI response was necessary or if a simple emoji reaction was sufficient.`
		)
	);

	if (emojiList && emojiList.length) {
		messages.push(new SystemMessage(`Supported emojis are: ${emojiList.join(', ')}.`));
	}

	messages.push(
		new SystemMessage(`
		- If the user's message is a basic gratitude (e.g., "Thanks!", "Got it", "Cool", "Okay", "Yes", "Understood", "Sure"), return a suitable ${platform} emoji (e.g. 🤗).  
		- **Do not react if the message is a question, even if it does not end with a question mark.** This includes anything seeking information, explanations, or calculations (e.g., "What's 2+2", "Tell me how this works", "Explain this").  
		- **Do not react if the user made a request** (e.g., "Send me that file", "Generate a summary", "Give me an example").  
		- **Do not react if the reply had a question.
		- **Do not react if the reply had any form of explanation.
		- Avoid using very common emojis repeatedly. Instead, vary them randomly when appropriate.  
		- Your only scope is to ensure an emoji is only returned instead of saying welcome to a user's appreciation.
		- If you are not sure or confident about the decision, return an empty response.
		- If the AI's reply made sense or clarified anything, return an empty response.  
		- Do not include any explanations or extra text—only return the ${platform} emoji or an empty response.

		Message: User: "${userMessage}" | AI: "${gptAnswer}"  
	`)
	);

	const aiResponse = await model.invoke(messages);

	const responseContent = Array.isArray(aiResponse.content) ? aiResponse.content.join('\n') : aiResponse.content;

	if (responseContent) {
		logger.verbose(`Using reaction: ${aiResponse.content}`);
	}

	return responseContent as unknown as ReactionEmoji;
};

export const getComponents = async (
	config: BotConfig,
	platform: string,
	toolMessages: string[],
	userMessage: string,
	gptAnswer: MessageContent
) => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: gptModel
	});

	const messages = [];

	messages.push(
		new SystemMessage(
			`
			You are an AI tool that parses a user message and its chatgpt response and prepares the response for Discord Components V2.
				- Messages must also have a top-level "content" field for plain text.
				- Messages can optionally include a "components" array for interactive elements. Use components only for clear user interaction.
				- Do not use "embeds" for text content. 
				
			Supported Components (within Action Rows, type: 1):

				- "button" (ONLY for links, type: 2): must have "label", "url", style must always be "link" (style: 5). DO NOT use "custom_id" for link buttons. Optional: "emoji" ({ "name", "id"?, "animated"? }), "disabled".
				- "string_select" (type: 3): requires "custom_id", "placeholder", and "options" (array of { label, value, description?, emoji?, default? }).

			Supported Embed Structure (within the "embeds" array, each object represents one embed):

				- Embed object must have "type": "rich".
				- Optional properties within an embed object (leverage these for detailed, visually appealing, and well-structured presentation):
					- "color": integer (decimal color code, e.g., 3447003 for blue). **Choose a color that fits the message tone, theme, or urgency.**
					- "fields": array of field objects (max 25 fields). Use for presenting data in a list or table format.
						- Each field object: { "name": string (max 256 char), "value": string (max 1024 char), "inline"?: boolean (defaults to false) }
					- "image": object (optional): { "url": string }. **Use for a prominent image related to the core content of the embed.**
					- "thumbnail": object (optional): { "url": string }. **Use for a smaller image (like an icon or logo) displayed on the side of the embed.**
					- "timestamp": string (ISO 8601 timestamp, e.g., "2023-04-26T09:00:00.000Z") (optional). **Use for time-sensitive information.**

			Component Rules:
				- Interactive components (buttons, selects) must be placed inside Action Rows (type: 1).
				- The top-level "components" array must contain Action Row objects, NOT nested arrays of arrays.
				- Max 5 components per Action Row.
				- Max 5 Action Rows per message.
				- Do NOT use custom component types like "text", "media", "container", or "section" in the final Discord components array. These are internal concepts for structuring the response before conversion.

			Embed Usage Rules:
				- Only use embeds for images, thumbnails or other media, never for text.

			General Rendering Rules:
				- Text Formatting: **Use Discord Markdown** (bold **text**, italics *text* or _text_, underline __text__, strikethrough ~~text~~, inline code \`\`code\`\`, code blocks \`\`\`code\`\`\`, block quotes > text, links [text](url)) within the "content" field and applicable embed properties (like "description", "fields" values, "author" name) where appropriate for clarity, emphasis, or structure.
				- **Content Field Strategy:** Carefully determine the content of the top-level "content" field based on whether components are generated and how much information they contain:
					- If **neither** embeds nor components are included in the response, the "content" field **must** contain the **full original text** of the message.
					- If **embeds or components are included**, the "content" field should **avoid duplicating** information that is already clearly and fully conveyed by the embeds or components.
				- Only render components if they truly enhance the message (e.g., interactive elements, distinct layout elements).
				- If neither components nor embeds are necessary based on the response, provide the full response in the "content" field only.
				- Do NOT wrap your answer in markdown or triple backticks.
				- Respond with VALID DISCORD V2 JSON ONLY. No explanations or comments.

			Example Output Structure (Combine relevant sections based on input):
				
			{
				"content": "This is the main text content.",
				"components": [
					{
					"type": 1,
					"components": [
						{
						"type": 2,
						"style": 5,
						"label": "Example Link Button",
						"url": "[https://discord.com](https://discord.com)"
						}
					]
					},
					{
					"type": 1,
					"components": [
						{
						"type": 3,
						"custom_id": "example_select",
						"placeholder": "Choose something...",
						"options": [
							{
							"label": "Option A",
							"value": "a"
							},
							{
							"label": "Option B",
							"value": "b"
							}
						]
						}
					]
					}
				]
			}
		`
		)
	);
	toolMessages.forEach(toolMessage => {
		messages.push(new SystemMessage('Tool message: ' + toolMessage));
		logger.silly(`getComponents() Appending tool message: ${toolMessage}`);
	});
	messages.push(new HumanMessage(`User Message: ${userMessage}`), new HumanMessage(`GPT Response: ${gptAnswer}`));

	let aiResponse = await model.invoke(messages);

	const responseContent = Array.isArray(aiResponse.content) ? aiResponse.content.join('\n') : aiResponse.content;

	return responseContent;
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
