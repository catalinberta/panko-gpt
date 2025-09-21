import { detectAll, langName, toISO3 } from 'tinyld';
import 'dotenv/config';
import { Message } from 'discord.js';
import puppeteer from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { BotConfig } from '../global';
import { searchVectorData } from '../models/VectorData';
import { createLLM, getEmbeddingFromString } from '../services/chatgpt';
import { PromptTemplate } from '@langchain/core/prompts';
import { encode } from 'gpt-3-encoder';
import { AIMessage, MessageContent } from '@langchain/core/messages';
import logger from '../services/logger';
import { chatGptDefaults } from '../constants';

puppeteer.use(Stealth());
puppeteer.use(AnonymizeUAPlugin());

export const sleep = (ms: number = 0): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
};

export const sendDiscordMessage = async (
	message: Message,
	assistantMessage: MessageContent,
	discordMessagePayload?: any
) => {
	const discordCharacterLimit = 2000;
	if (discordMessagePayload.content && discordMessagePayload.content.length >= discordCharacterLimit) {
		(function sendDiscordMessage(assistantMessage) {
			discordMessagePayload.content = assistantMessage.substring(0, discordCharacterLimit);
			message.reply(discordMessagePayload);
			if (assistantMessage.length <= discordCharacterLimit) return;
			setTimeout(
				sendDiscordMessage.bind(null, (assistantMessage as string).substring(discordCharacterLimit)),
				1000
			);
		})(discordMessagePayload.content);
	} else {
		message.reply(discordMessagePayload).catch(e => {
			logger.error(`Error sending discord message: ${e}`);
		});
	}
};

export const getKnowledebaseContext = async (query: string, config: BotConfig): Promise<AIMessage | null> => {
	try {
		const llm = createLLM(config.openAiKey, chatGptDefaults.smallModel);
		const standaloneTemplate =
			'Given the following user input with possible non-essential verbose details, convert it to a standalone input by removing non-essential details but keep the prefixed name in order to use it in vector embeddings search: {userInput}';
		const standaloneInputPrompt = PromptTemplate.fromTemplate(standaloneTemplate);
		const standaloneInputChain = standaloneInputPrompt.pipe(llm);
		const response = await standaloneInputChain.invoke({
			userInput: query
		});
		const content = response.content as string;
		const maxKnowledgeTokens = 400;
		const embeddingResponse = await getEmbeddingFromString(config.openAiKey, content);
		const results = await searchVectorData(embeddingResponse.embedding, config._id);
		if (!results) return null;
		let currentTokens = 0;
		const newContext = results.map((result: any) => {
			currentTokens += result.tokens;
			return currentTokens >= maxKnowledgeTokens ? '' : result.content;
		});
		const stringContext = newContext.join(' ');
		const langchainMessage = new AIMessage(stringContext);

		return langchainMessage;
	} catch (e) {
		logger.error(`Error getting data from knowledgebase {e}`);
		return null;
	}
};

export const countGptTokens = (text: string): number => {
	if (!text) return 0;
	return encode(text).length;
};

export const extractArrayFromGptChunks = (inputString: string | null): string[] => {
	if (!inputString) return [];
	try {
		const regex = /<textchunk>(.*?)<\/textchunk>/gs;
		const matches = inputString.matchAll(regex);
		const chunks = [];
		for (const match of matches) {
			chunks.push(match[1]);
		}
		return chunks;
	} catch (e) {
		logger.error(`Error extracting array from chunk value ${e}`);
		return [];
	}
};

export const hideCredentialsFromMongoDbUrl = (url: string) => {
	return url.replace(/(mongodb\+srv:\/\/[^:]+:[^@]+)@([^?]+)(\?.+)/, (match, user, cluster, params) => {
		const hiddenUser = `${user.slice(0, user.lastIndexOf(':') + 1)}...`;
		const clusterParts = cluster.split('.');
		const hiddenCluster = `${clusterParts[0].slice(0, -6)}...${clusterParts.slice(1).join('.')}`;
		return `${hiddenUser}@${hiddenCluster}${params}`;
	});
};

interface DetectOption {
	only: string[];
	verbose: boolean;
}
export const getLanguageFromText = (text: string, whitelist?: string) => {
	const detectParams: Partial<DetectOption> = {};
	if (whitelist) {
		detectParams.only = whitelist.split(',');
	}
	const accuracyThreshold = 0.5;
	const languages = detectAll(text, detectParams);
	if (!languages.length) {
		logger.debug('Language not detected.');
		return null;
	}
	logger.debug(
		`Language detection. Language: ${languages[0].lang}. Accuracy: ${
			languages[0].accuracy
		}. All Languages: ${JSON.stringify(languages)}`
	);
	if (languages.length && languages[0].accuracy > accuracyThreshold) {
		return langName(toISO3(languages[0].lang));
	}
	return null;
};
