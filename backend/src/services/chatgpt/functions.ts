import 'dotenv/config'
import {
	ChatCompletion,
	ChatCompletionCreateParams,
	ChatCompletionMessageToolCall
} from 'openai/resources/index.mjs'
import {
	estimateChatGPTTokens,
	extractTextFromHTML,
	getWebPageContentFromUrl
} from '../../utils'
import openai from '.'

export const getWebPageContent = async (
	toolCall: ChatCompletionMessageToolCall,
	gptParams: ChatCompletionCreateParams,
	apiKey: string
): Promise<ChatCompletionCreateParams> => {
	const args = JSON.parse(toolCall.function.arguments)
	const { url, userquery } = args
	const newGptParams = { ...gptParams }
	console.log('Calling webpage function', url, userquery)
	let pageContent
	try {
		pageContent = await getWebPageContentFromUrl(url)
	} catch (e) {
		console.log('getWebPageContentFromUrl()', e)
		newGptParams.messages.push({
			role: 'tool',
			tool_call_id: toolCall.id,
			content: '<NULL>'
		})
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
			const openaiInstance = openai(apiKey)
			const chunkResponse = (await openaiInstance.chat.completions
				.create({
					model: 'gpt-4o-mini',
					temperature: 0,
					messages: [
						{
							role: 'system',
							content: `Rewrite the following text up to a maximum of 400 tokens, but attention to this particular query "${userquery}"`
						},
						{
							role: 'user',
							content: chunk
						}
					]
				})
				.catch((e: Error) => {
					console.log(
						'Got error when requesting ChatGPT to summarize webpage',
						e
					)
					throw new Error(
						'Got error when requesting ChatGPT to summarize webpage'
					)
				})) as ChatCompletion
			summarizedContent += chunkResponse.choices[0].message.content || ''
		})
	)

	newGptParams.messages.push({
		role: 'tool',
		tool_call_id: toolCall.id,
		content: summarizedContent
	})

	return newGptParams
}

export const getCurrentTime = (
	toolCall: ChatCompletionMessageToolCall,
	gptParams: ChatCompletionCreateParams
): ChatCompletionCreateParams => {
	console.log('Calling currenttime function')
	const newParams = { ...gptParams }
	newParams.messages.push({
		role: 'tool',
		tool_call_id: toolCall.id,
		content: String(new Date())
	})
	return newParams
}
