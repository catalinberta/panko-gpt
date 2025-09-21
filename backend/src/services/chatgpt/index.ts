import 'dotenv/config';
import {
	countGptTokens,
	extractArrayFromGptChunks,
	getKnowledebaseContext,
	getLanguageFromText,
	sleep
} from '../../utils';
import { chatGptDefaults } from '../../constants';
import { ChatOpenAI, ChatOpenAIFields, OpenAIEmbeddings } from '@langchain/openai';
import { BotConfig, MessageWithContext } from '../../global';
import {
	SystemMessage,
	AIMessage,
	HumanMessage,
	AIMessageChunk,
	MessageContent,
	ToolMessage
} from '@langchain/core/messages';
import { getPreviousMessages, setPreviousMessage } from '../previous-messages';
import summarizeWebpageUrlTool from './tools/webpageContent';
import { DynamicStructuredTool, DynamicTool } from '@langchain/core/tools';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
// import searchSummarizerTool from './tools/searchSummarizer';
import logger from '../logger';
import { ReactionEmoji } from 'discord.js';
import {
	addReminderTool,
	getAllRemindersTool,
	getReminderByIdTool,
	removeReminderTool,
	updateReminderTool
} from './tools/reminder';
import webSearchTool from './tools/webSearch';
import imageSearchTool from './tools/imageSearch';
import { time } from 'console';

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

export const createLLM = (apiKey: string, model: string) => {
	const params: ChatOpenAIFields = {
		apiKey,
		model,
		reasoningEffort: 'medium',
		verbosity: 'medium'
	};
	if (model.startsWith('gpt-5')) {
		params.reasoningEffort = 'low';
		params.verbosity = 'low';
	}
	return new ChatOpenAI(params);
};

type QueryGptResult = {
	response: string;
	toolMessages: string[];
};
export const queryGPT = async (
	config: BotConfig,
	userMessage: MessageWithContext,
	conversationId: string,
	customTools?: DynamicStructuredTool<any>[] | DynamicTool[] | undefined,
	customToolsByName?: {
		[key: string]: DynamicTool | DynamicStructuredTool<any>;
	},
	customPrompt?: {
		system?: SystemMessage[];
		assistant?: AIMessage[];
		user?: HumanMessage[];
	},
	disableTools?: boolean
): Promise<QueryGptResult> => {
	const gptModel = config.chatGptModel || chatGptDefaults.model;
	let timeToResponse = new Date().getTime();
	logger.debug(`Using model: ${gptModel}`);

	const model = createLLM(config.openAiKey, gptModel);

	const initializedSummarizeWebpageUrlTool = summarizeWebpageUrlTool(config.openAiKey);
	const initializedGetAllRemindersTool = getAllRemindersTool();
	const initializedAddReminderTool = addReminderTool(config._id);
	const initializedUpdateReminderTool = updateReminderTool();
	const initializedGetReminderByIdTool = getReminderByIdTool();
	const initializedRemoveReminderByIdTool = removeReminderTool();
	const initializedWebSearchTool = webSearchTool(
		config.openAiKey,
		config.functionWebSearchGoogleApiKey,
		config.functionWebSearchGoogleCseKey
	);
	const initializedImageSearchTool = imageSearchTool(
		config.functionWebSearchGoogleApiKey,
		config.functionWebSearchGoogleCseKey
	);

	const toolsByName: {
		[key: string]: DynamicTool | DynamicStructuredTool<any>;
	} = {
		summarizeWebpageUrl: initializedSummarizeWebpageUrlTool,
		getAllReminders: initializedGetAllRemindersTool,
		addReminder: initializedAddReminderTool,
		updateReminder: initializedUpdateReminderTool,
		getReminderById: initializedGetReminderByIdTool,
		removeReminder: initializedRemoveReminderByIdTool,
		webSearch: initializedWebSearchTool,
		imageSearch: initializedImageSearchTool
	};

	const messages = [];
	const tools = [];

	if (!disableTools) {
		config.functionUrlSummarizer && tools.push(initializedSummarizeWebpageUrlTool);
		config.functionReminders && tools.push(initializedGetAllRemindersTool);
		config.functionReminders && tools.push(initializedGetReminderByIdTool);
		config.functionReminders && tools.push(initializedAddReminderTool);
		config.functionReminders && tools.push(initializedUpdateReminderTool);
		config.functionReminders && tools.push(initializedRemoveReminderByIdTool);
		config.functionWebSearch && tools.push(initializedWebSearchTool);
		config.functionImageSearch && tools.push(initializedImageSearchTool);
		messages.push(
			new SystemMessage(
				'Do not generate image urls yourself. You can use imageSearch tool to also look for images to enrich responses.'
			)
		);
	}

	if (customTools && customTools.length) {
		tools.push(...customTools);
	}
	customToolsByName &&
		Object.keys(customToolsByName).forEach(toolName => {
			toolsByName[toolName] = customToolsByName[toolName];
		});

	const modelWithTools = model.bindTools(tools);

	messages.push(new SystemMessage(`Current system time: ${String(new Date())}`));
	config.context && messages.push(new SystemMessage(config.context));

	if (config.knowledgebase) {
		const knowledgebase = await getKnowledebaseContext(userMessage.message, config);
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
	userMessage.context && messages.push(new SystemMessage('Message context: ' + userMessage.context));
	messages.push(new HumanMessage(userMessage.message));

	if (config.functionLanguageDetection) {
		const userLanguage = getLanguageFromText(userMessage.message, config.functionLanguageDetectionWhitelist);
		if (userLanguage) {
			logger.debug(`User language: ${userLanguage}`);
			messages.push(
				new SystemMessage(`User's last message was in ${userLanguage}, please answer in ${userLanguage}`)
			);
		}
	}

	customPrompt && customPrompt.system && messages.push(...customPrompt.system);
	customPrompt && customPrompt.assistant && messages.push(...customPrompt.assistant);
	customPrompt && customPrompt.user && messages.push(...customPrompt.user);

	logger.silly(`LLM messages: ${JSON.stringify(messages)}`);

	let aiResponse: AIMessageChunk;
	const toolMessages: string[] = [];
	const maxIterations = 5;
	let iterations = 0;

	while (true) {
		aiResponse = await modelWithTools.invoke(messages);
		if (!aiResponse.tool_calls || aiResponse.tool_calls.length === 0) {
			break;
		}

		if (iterations >= maxIterations) {
			logger.warn(`Reached max tool iterations (${maxIterations}). Asking model to finalize.`);
			messages.push(
				new SystemMessage(
					`Reached max tool iterations (${maxIterations}). Please produce the best possible final answer using the information gathered so far.`
				)
			);
			aiResponse = await modelWithTools.invoke(messages);
			break;
		}

		messages.push(aiResponse);

		for (const toolCall of aiResponse.tool_calls) {
			logger.debug(`Using LLM tool: ${toolCall.name}`);
			const selectedTool = toolsByName[toolCall.name];
			if (!selectedTool) {
				const note = `Requested tool "${toolCall.name}" is not available.`;
				logger.warn(note);
				messages.push(
					new ToolMessage({
						tool_call_id: toolCall.id!,
						content: note
					})
				);
				continue;
			}
			let toolResultContent: string;
			try {
				const toolOutput = await (selectedTool as any).invoke(toolCall.args);
				logger.silly(`Tool response: ${JSON.stringify(toolOutput, null, 2)}`);
				toolMessages.push(JSON.stringify(toolOutput));
				toolResultContent = typeof toolOutput === 'string' ? toolOutput : JSON.stringify(toolOutput);
			} catch (err: any) {
				const errMsg = `Tool "${toolCall.name}" failed: ${err?.message || String(err)}`;
				logger.error(errMsg);
				toolResultContent = `Tool Error: ${errMsg}`;
			}

			messages.push(
				new ToolMessage({
					tool_call_id: toolCall.id!,
					content: toolResultContent
				})
			);
		}

		iterations += 1;
	}

	const responseContent = Array.isArray(aiResponse.content)
		? aiResponse.content.join('\n')
		: String(aiResponse.content ?? '');

	await setPreviousMessage(config, conversationId, userMessage.message, responseContent);
	for (let i = 0; i < toolMessages.length; i++) {
		await setPreviousMessage(config, conversationId, undefined, toolMessages[i]);
	}

	timeToResponse = Math.round((new Date().getTime() - timeToResponse) / 1000);
	logger.silly(`LLM response [${timeToResponse}s]:  ${responseContent}`);

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
	const model = createLLM(config.openAiKey, chatGptDefaults.smallModel);

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
	const model = createLLM(config.openAiKey, chatGptDefaults.smallModel);
	const messages = [];

	messages.push(
		new SystemMessage(
			`
			You are an AI tool that parses a user message and its chatgpt response and prepares the response for Discord Components V2.
				- Messages must also have a top-level "content" field for plain text.
				- Messages can optionally include a "components" array for interactive elements. Use components only for clear user interaction.
				- If the message content contains a valid image URL (ending in .jpg, .jpeg, .png, .webp, or .gif), always include an embed object in the embeds array with that URL in the image.url field.
				- If a component contains a "mailto:" link, do not render it as a button; instead, replace it with a markdown mail link [email](mailto:email) inside the "content" field.
				- Do not use "embeds" for text content. 

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
				- Max 1 Select/Dropdown per message.
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
				"embeds": [
					{
						"title": "Image title",
						"description": "Image description.",
						"image": {
							"url": "https://example.com/image.png"
						},
						"color": 5814783
					}
				],
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
								"custom_id": "component_listing_movies:movie_name_selected",
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
	const model = createLLM(apiKey, chatGptDefaults.smallModel);

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

export const summarizeText = async (apiKey: string, text: string, maxTokens: number = 400, userquery?: string) => {
	const model = createLLM(apiKey, chatGptDefaults.smallModel);
	const messages = [
		new SystemMessage(
			`Summarize the following text up to a maximum of ${maxTokens} tokens. ${
				userquery ? 'Summarization is requested from the following user query: ' + userquery : ''
			}`
		),
		new HumanMessage(text)
	];
	const gptResponse = await model.invoke(messages);
	return String(gptResponse.content);
};
