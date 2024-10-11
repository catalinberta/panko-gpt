import { countGptTokens } from '../../utils';
import { BotConfig } from '../../global';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';

const messages: { [key: string]: any[] } = {};

export const getPreviousMessages = (channelId: string) => {
	return messages[channelId];
};

export const setPreviousMessage = async (
	config: BotConfig,
	channelId: string,
	userMessage: string,
	assistantMessage: string
) => {
	const tokenLimit = 120;
	messages[channelId] = messages[channelId] || [];
	if (messages[channelId].length > 10) {
		messages[channelId].splice(0, 2);
	}
	const userMessageTokens = countGptTokens(userMessage);
	const assistantMessageTokens = countGptTokens(assistantMessage);

	const model = new ChatOpenAI({
		openAIApiKey: config.openAiKey,
		model: 'gpt-4o-mini'
	});

	if (userMessageTokens > tokenLimit) {
		try {
			const modelMessagesForUser = [];
			modelMessagesForUser.push(
				new SystemMessage(`Rewrite the following text in less than ${tokenLimit} tokens.`)
			);
			modelMessagesForUser.push(new HumanMessage(userMessage));
			const gptResponseForUser = await model.invoke(modelMessagesForUser);
			messages[channelId].push({
				role: 'assistant',
				content: gptResponseForUser.content
			});
		} catch (e) {
			console.log('Got error when requesting ChatGPT to summarize userMessage', e);
		}
	} else {
		messages[channelId].push({
			role: 'user',
			content: userMessage
		});
	}
	if (assistantMessageTokens > tokenLimit) {
		try {
			const modelMessagesForassistant = [];
			modelMessagesForassistant.push(
				new SystemMessage(`Rewrite the following text in less than ${tokenLimit} tokens.`)
			);
			modelMessagesForassistant.push(new HumanMessage(userMessage));
			const gptResponseForAssistant = await model.invoke(modelMessagesForassistant);
			messages[channelId].push({
				role: 'assistant',
				content: gptResponseForAssistant.content
			});
		} catch (e) {
			console.log('Got error when requesting ChatGPT to summarize assistantMessage', e);
		}
	} else {
		messages[channelId].push({
			role: 'assistant',
			content: assistantMessage
		});
	}
};
