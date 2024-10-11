import 'dotenv/config';
import { Message } from 'discord.js';
import { JSDOM } from 'jsdom';
import puppeteer from 'puppeteer-extra';
import Stealth from 'puppeteer-extra-plugin-stealth';
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua';
import { TranslationServiceClient } from '@google-cloud/translate';
import { BotConfig } from '../global';
import { searchVectorData } from '../models/VectorData';
import { getEmbeddingFromString } from '../services/chatgpt';
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { encode } from 'gpt-3-encoder';
import { AIMessage, MessageContent } from '@langchain/core/messages';

puppeteer.use(Stealth());
puppeteer.use(AnonymizeUAPlugin());

export const sendDiscordMessage = async (message: Message, assistantMessage: MessageContent) => {
	if (typeof assistantMessage !== 'string') return;
	const discordCharacterLimit = 2000;
	if (assistantMessage.length >= discordCharacterLimit) {
		(function sendDiscordMessage(assistantMessage) {
			message.reply(assistantMessage.substring(0, discordCharacterLimit));
			if (assistantMessage.length <= discordCharacterLimit) return;
			setTimeout(sendDiscordMessage.bind(null, assistantMessage.substring(discordCharacterLimit)), 1000);
		})(assistantMessage);
	} else {
		message.reply(assistantMessage);
	}
};

export const getWebPageContentFromUrl = async (url: string) => {
	const browser = await puppeteer.launch({
		args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu=False', '--enable-webgl'],
		headless: true,
		timeout: 10_000,
		protocolTimeout: 20_000
	});
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({
		'upgrade-insecure-requests': '1',
		accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
		'accept-encoding': 'gzip, deflate, br',
		'accept-language': 'en-US,en;q=0.9,en;q=0.8'
	});
	await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0');
	await page.setRequestInterception(true);
	await page.setJavaScriptEnabled(true);
	page.on('request', async (request: any) => {
		const typesToAbort = ['image', 'media', 'font'];
		if (typesToAbort.indexOf(request.resourceType().toLowerCase()) > -1) {
			await request.abort();
		} else {
			await request.continue();
		}
	});
	try {
		await page.goto(url, { waitUntil: 'domcontentloaded' });
	} catch (e) {
		console.log('Error opening url', e);
		throw new Error(`Error opening ${url}, might be protected`);
	}
	let pageSourceHTML;
	try {
		pageSourceHTML = await page.content();
	} catch (e) {
		console.log('error accessing page', e);
	}
	await browser.close();
	return pageSourceHTML || '';
};

export const extractTextFromHTML = (htmlString: string): string => {
	const { window } = new JSDOM(htmlString);
	const { document } = window;

	function recursiveTextExtraction(node: Node): string {
		let text: string = '';
		node.childNodes.forEach((child: Node) => {
			if (child.nodeType === 3) {
				text += (child.nodeValue || '').replace(/\s{2,}/g, ' ') + ' ';
			} else if (
				child.nodeType === 1 &&
				child.nodeName.toLowerCase() !== 'script' &&
				child.nodeName.toLowerCase() !== 'style'
			) {
				text += recursiveTextExtraction(child);
			}
		});
		return text;
	}

	return recursiveTextExtraction(document.body);
};

const translate = new TranslationServiceClient();

export const detectLanguage = async (acceptedLanguages: string[], content: string) => {
	const acceptedConfidence = 0.4;
	try {
		const [detection] = await translate.detectLanguage({
			parent: 'projects/panko-418815',
			content
		});
		const hasMinimumConfidence =
			detection.languages?.[0].confidence && detection.languages?.[0].confidence > acceptedConfidence;
		const isLanguageAccepted = acceptedLanguages.includes(detection.languages?.[0].languageCode || '');
		return hasMinimumConfidence && isLanguageAccepted ? detection.languages?.[0].languageCode : null;
	} catch (error) {
		console.error('Error detecting language:', error);
	}
	return null;
};

export const getKnowledebaseContext = async (query: string, config: BotConfig): Promise<AIMessage | null> => {
	try {
		const llm = new ChatOpenAI({
			openAIApiKey: config.openAiKey,
			model: 'gpt-4o-mini'
		});
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
		console.log('Error getting data from knowledgebase', e);
		return null;
	}
};

export const sleep = (ms: number = 0): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms));
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
		console.log('Error extracting array from chunk value');
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
