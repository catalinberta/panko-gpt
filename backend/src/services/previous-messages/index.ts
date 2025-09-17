import { countGptTokens } from '../../utils';
import { BotConfig } from '../../global';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage, AIMessage } from '@langchain/core/messages';
import logger from '../logger';

const messages: { [key: string]: any[] } = {};

export const getPreviousMessages = (channelId: string) => {
	return messages[channelId];
};

export const setPreviousMessage = async (
	config: BotConfig,
	channelId: string,
	userMessage?: string,
	assistantMessage?: string
) => {
	const tokenLimit = 120;
	const messagesLimit = 20;
	messages[channelId] = messages[channelId] || [];
	if (messages[channelId].length > messagesLimit) {
		messages[channelId].splice(0, 2);
	}
	const userMessageTokens = userMessage ? countGptTokens(userMessage) : 0;
	const assistantMessageTokens = assistantMessage ? countGptTokens(assistantMessage) : 0;

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: 'gpt-4o-mini'
	});

	if (userMessage) {
		if (userMessageTokens > tokenLimit) {
			try {
				const modelMessagesForUser = [];
				modelMessagesForUser.push(
					new SystemMessage(
						`Rewrite the following text in less than ${tokenLimit} tokens. Keep identifiable and essential information like IDs and param values.`
					)
				);
				modelMessagesForUser.push(new HumanMessage(userMessage));
				const gptResponseForUser = await model.invoke(modelMessagesForUser);
				messages[channelId].push({
					role: 'assistant',
					content: gptResponseForUser.content
				});
			} catch (e) {
				logger.error(`Got error when requesting ChatGPT to summarize userMessage ${e}`);
			}
		} else {
			messages[channelId].push({
				role: 'user',
				content: userMessage
			});
		}
	}
	if (assistantMessage) {
		if (assistantMessageTokens > tokenLimit) {
			try {
				const modelMessagesForassistant = [];
				modelMessagesForassistant.push(
					new SystemMessage(
						`Rewrite the following text in less than ${tokenLimit} tokens. Keep identifiable and essential information like IDs and param values.`
					)
				);
				modelMessagesForassistant.push(new HumanMessage(assistantMessage));
				const gptResponseForAssistant = await model.invoke(modelMessagesForassistant);
				messages[channelId].push({
					role: 'assistant',
					content: gptResponseForAssistant.content
				});
			} catch (e) {
				logger.error(`Got error when requesting ChatGPT to summarize assistantMessage ${e}`);
			}
		} else {
			messages[channelId].push({
				role: 'assistant',
				content: assistantMessage
			});
		}
	}
};
