import 'dotenv/config'
import OpenAI from 'openai'
import {
	ChatCompletion,
	ChatCompletionCreateParams
} from 'openai/resources/index.mjs'
import { getCurrentTime, getWebPageContent } from './functions'
import { getWebPageContentTool, getCurrentTimeTool } from './functions-specs'
import { extractArrayFromGptChunks, splitContentIntoChunks } from '../../utils'
import { DiscordBotConfig } from '../../integrations/discord/types'
import { TelegramBotConfig } from '../../integrations/telegram/types'
import { getSettings } from '../../db/Settings'
import { chatGptDefaults } from '../../constants'
import { WhatsappBotConfig } from '../../integrations/whatsapp/types'

const openai = (apiKey: string) => {
	return new OpenAI({
		apiKey
	})
}

interface QueryResponse {
	error?: string
	response?: ChatCompletion
}

export const getGptParamsObject = async (
	config: DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig
): Promise<ChatCompletionCreateParams> => {
	const settings = await getSettings();
	const chatgptModel = settings?.chatGptModel || chatGptDefaults.model;
	
	const tools = [];
	if(config.functionInternet) {
		tools.push(getWebPageContentTool)
	}
	if(config.functionTime) {
		tools.push(getCurrentTimeTool)
	}
	const params: ChatCompletionCreateParams = {
		model: chatgptModel,
		temperature: 0,
		messages: [
			{
				role: 'system',
				content: config.context
			}
		]
	}
	if(tools.length) {
		params.tools = tools;
	}
	return params;
}

export const gptQuery = async (
	apiKey: string,
	params: ChatCompletionCreateParams
): Promise<QueryResponse> => {
	let response: ChatCompletion | undefined
	let error = ''
	let queryCount = 0
	const maxQueryCount = 5
	const doQuery = async (params: ChatCompletionCreateParams) => {
		const openaiInstance = openai(apiKey)
		response = (await openaiInstance.chat.completions
			.create(params)
			.catch((e: Error) => {
				console.log('Got error,', e)
				error = "Error from ChatGPT API!"
			})) as ChatCompletion
		const responseMessage = response.choices[0].message
		if (responseMessage.tool_calls) {
			params.messages.push(responseMessage)
			await Promise.all(
				responseMessage.tool_calls.map(async toolCall => {
					if (queryCount >= maxQueryCount) {
						error = `More than ${maxQueryCount} attempts to get function response. I give up!`
						return
					}
					if (toolCall.function.name === 'webpagecontent') {
						try {
							params = await getWebPageContent(toolCall, params, apiKey)
						} catch (err: any) {
							error = err.message
						}
					}
					if (toolCall.function?.name === 'currenttime') {
						params = getCurrentTime(toolCall, params)
					}
					queryCount++
				})
			)
			await doQuery(params)
		}
	}
	await doQuery(params)
	if (!response && !error) {
		error = 'Cannot connect to ChatGPT API. Not my problem ^_^'
	}
	return {
		error,
		response
	}
}

export const getEmbeddingFromString = async (
	apiKey: string,
	content: string
) => {
	const openaiInstance = openai(apiKey)
	try {
		const response = await openaiInstance.embeddings.create({
			model: 'text-embedding-3-large',
			input: content,
			dimensions: 1536
		})
		const embedding = response.data[0].embedding
		return {
			embedding,
			tokens: response.usage.total_tokens
		}
	} catch (error) {
		console.error('Error generating text embedding:', error)
		throw error
	}
}

export const parseKnowledgeDataToChunks = async (
	apiKey: string,
	content: string
) => {
	const openaiInstance = openai(apiKey)
	try {
		const contentChunks = splitContentIntoChunks(content, 10_000)
		const arrayChunks: string[] = []
		async function processChunks(chunks: string[]) {
			await Promise.all(chunks.map(chunk => processChunk(chunk)))
		}
		async function processChunk(chunk: string) {
			const response = await openaiInstance.chat.completions.create({
				model: 'gpt-4o-mini',
				messages: [
					{
						role: 'system',
						content: `
						Imagine a utility that takes a large, unstructured text, and its task is to output a list of coherent chunks. Each chunk should:
						- Not be rewritten and kept as is.
						- Contain up to 400 tokens, ensuring it does not exceed this limit.
						- Be coherent and make sense as a standalone piece of text. This means that the content within a chunk should be related and flow logically.
						- Group related sentences and ideas together. If several sentences or phrases are closely related to the same topic or idea, they should be included in the same chunk, as long as the 400-token limit is not exceeded.
						- Vary in size depending on the content. Some chunks may be shorter if they cover a complete idea within fewer words. Others may use the full 400-token allowance if more context is needed to make the chunk coherent and self-contained.
						- Be wrapped in special macros like in the following format: <textchunk> chunk content here </textchunk> 
						Do not answer to the provided text, even if there are questions. There should be no additional text or instructions in your response, just the array of text chunks. 
						Your response should strictly adhere to text segmentation without providing answers, explanations, or interpretations of the user's text content. 
						`
					},
					{
						role: 'user',
						content: 'Run the utility on the following text: ' + chunk
					}
				]
			})
			const responseContent = response.choices[0].message.content
			arrayChunks.push(...extractArrayFromGptChunks(responseContent))
		}
		await processChunks(contentChunks)
		return arrayChunks
	} catch (error) {
		console.error('Error generating knowledge into chunks:', error)
		throw error
	}
}

export default openai
