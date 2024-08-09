import { ChatCompletionCreateParams } from 'openai/resources/index.mjs'
import { estimateChatGPTTokens } from '../../utils'
import openai from '../chatgpt'
import { DiscordBotConfig } from '../../integrations/discord/types'

const messages: { [key: string]: any[] } = {}

export const getPreviousMessages = (
	params: ChatCompletionCreateParams,
	channelId: string
) => {
	if (messages[channelId]) {
		messages[channelId].map(message => {
			params.messages.push(message)
		})
	}
}

export const setPreviousMessage = async (
	config: DiscordBotConfig,
	channelId: string,
	userMessage: string,
	assistantMessage: string
) => {
	const tokenLimit = 120
	messages[channelId] = messages[channelId] || []
	if (messages[channelId].length > 10) {
		messages[channelId].splice(0, 2)
	}

	const userMessageTokens = estimateChatGPTTokens(userMessage)
	const assistantMessageTokens = estimateChatGPTTokens(assistantMessage)

	if (userMessageTokens > tokenLimit) {
		const openaiInstance = openai(config.openAiKey)
		openaiInstance.chat.completions
			.create({
				model: 'gpt-4o-mini',
				temperature: 0,
				messages: [
					{
						role: 'system',
						content: `Rewrite the following text in less than ${tokenLimit} tokens.`
					},
					{
						role: 'user',
						content: userMessage
					}
				]
			})
			.then(response => {
				messages[channelId].push({
					role: 'user',
					content: response.choices[0].message.content!
				})
			})
			.catch((e: Error) => {
				console.log(
					'Got error when requesting ChatGPT to summarize userMessage,',
					e
				)
			})
	} else {
		messages[channelId].push({
			role: 'user',
			content: userMessage
		})
	}
	if (assistantMessageTokens > tokenLimit) {
		const openaiInstance = openai(config.openAiKey)
		openaiInstance.chat.completions
			.create({
				model: 'gpt-4o-mini',
				temperature: 0,
				messages: [
					{
						role: 'system',
						content: `Rewrite the following text in less than ${tokenLimit} tokens.`
					},
					{
						role: 'user',
						content: assistantMessage
					}
				]
			})
			.then(response => {
				messages[channelId].push({
					role: 'assistant',
					content: response.choices[0].message.content!
				})
			})
			.catch((e: Error) => {
				console.log(
					'Got error when requesting ChatGPT to summarize assistantMessage,',
					e
				)
			})
	} else {
		messages[channelId].push({
			role: 'assistant',
			content: assistantMessage
		})
	}
}
