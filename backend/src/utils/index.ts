import 'dotenv/config'
import { Message } from 'discord.js'
import { JSDOM } from 'jsdom'
import puppeteer from 'puppeteer-extra'
import Stealth from 'puppeteer-extra-plugin-stealth'
import AnonymizeUAPlugin from 'puppeteer-extra-plugin-anonymize-ua'
import { TranslationServiceClient } from '@google-cloud/translate'
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs'
import { BotConfig } from '../global'
import { searchVectorData } from '../db/VectorData'
import { getEmbeddingFromString } from '../services/chatgpt'

puppeteer.use(Stealth())
puppeteer.use(AnonymizeUAPlugin())

export const stringToChatGptResponseFormat = (message: string) => {
	return [
		{
			finish_reason: 'stop',
			index: 0,
			message: {
				content: message,
				role: 'assistant'
			}
		}
	]
}

export const estimateChatGPTTokens = (input: string): number => {
	if (!input || typeof input !== 'string') return 0
	const commonPunctuation = /[.,\/#!$%\^&\*;:{}=\-_`~()]/g
	let normalizedInput = input.replace(commonPunctuation, ' ') // Replace punctuation with spaces
	normalizedInput = normalizedInput.replace(/\s+/g, ' ').trim() // Normalize whitespace
	const tokens = normalizedInput.split(' ') // Split by space to approximate tokens
	return tokens.length
}

export const sendDiscordMessage = async (
	message: Message,
	assistantMessage: string
) => {
	const discordCharacterLimit = 2000
	if (assistantMessage.length >= discordCharacterLimit) {
		;(function sendDiscordMessage(assistantMessage) {
			message.reply(assistantMessage.substring(0, discordCharacterLimit))
			if (assistantMessage.length <= discordCharacterLimit) return
			setTimeout(
				sendDiscordMessage.bind(
					null,
					assistantMessage.substring(discordCharacterLimit)
				),
				1000
			)
		})(assistantMessage)
	} else {
		message.reply(assistantMessage)
	}
}

export const getWebPageContentFromUrl = async (url: string) => {
	const browser = await puppeteer.launch({
		args: [
			'--no-sandbox',
			'--disable-setuid-sandbox',
			'--disable-gpu=False',
			'--enable-webgl'
		],
		headless: true,
		timeout: 10_000,
		protocolTimeout: 20_000
	})
	const page = await browser.newPage()
	await page.setExtraHTTPHeaders({
		'upgrade-insecure-requests': '1',
		accept:
			'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
			'accept-encoding': 'gzip, deflate, br',
			'accept-language': 'en-US,en;q=0.9,en;q=0.8'
	})
	await page.setUserAgent(
		'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/110.0'
	)
	await page.setRequestInterception(true)
	await page.setJavaScriptEnabled(true)
	page.on('request', async (request: any) => {
		const typesToAbort = ['image', 'media', 'font']
		if (typesToAbort.indexOf(request.resourceType().toLowerCase()) > -1) {
			await request.abort()
		} else {
			await request.continue()
		}
	})
	try {
		await page.goto(url, { waitUntil: 'domcontentloaded' })
	} catch (e) {
		console.log('Error opening url', e)
		throw new Error(`Error opening ${url}, might be protected`)
	}
	let pageSourceHTML
	try {
		pageSourceHTML = await page.content()
	} catch (e) {
		console.log('error accessing page', e)
	}
	await browser.close()
	return pageSourceHTML || ''
}

export const extractTextFromHTML = (htmlString: string): string => {
	const { window } = new JSDOM(htmlString)
	const { document } = window

	function recursiveTextExtraction(node: Node): string {
		let text: string = ''
		node.childNodes.forEach((child: Node) => {
			if (child.nodeType === 3) {
				// Text node
				text += (child.nodeValue || '').replace(/\s{2,}/g, ' ') + ' '
			} else if (
				child.nodeType === 1 &&
				child.nodeName.toLowerCase() !== 'script' &&
				child.nodeName.toLowerCase() !== 'style'
			) {
				text += recursiveTextExtraction(child)
			}
		})
		return text
	}

	return recursiveTextExtraction(document.body)
}

// Creates a client
const translate = new TranslationServiceClient()

export const detectLanguage = async (
	acceptedLanguages: string[],
	content: string
) => {
	const acceptedConfidence = 0.4
	try {
		const [detection] = await translate.detectLanguage({
			parent: 'projects/panko-418815',
			content
		})
		const hasMinimumConfidence =
			detection.languages?.[0].confidence &&
			detection.languages?.[0].confidence > acceptedConfidence
		const isLanguageAccepted = acceptedLanguages.includes(
			detection.languages?.[0].languageCode || ''
		)
		return hasMinimumConfidence && isLanguageAccepted
			? detection.languages?.[0].languageCode
			: null
	} catch (error) {
		console.error('Error detecting language:', error)
	}
	return null
}

export const splitContentIntoChunks = (content: string, maxTokens: number) => {
	const contentTokens = estimateChatGPTTokens(content)
	const contentChunkLength = Math.floor(
		content.length / Math.ceil(contentTokens / maxTokens)
	)
	const contentChunks: string[] = []
	if (content.length <= contentChunkLength) {
		return [content]
	}
	while (content.length > contentChunkLength) {
		let lastSpaceIndex = content.lastIndexOf(' ', contentChunkLength)
		if (lastSpaceIndex === -1) {
			lastSpaceIndex = content.indexOf(' ', contentChunkLength)
		}
		contentChunks.push(content.substring(0, lastSpaceIndex))
		content = content.substring(lastSpaceIndex + 1)
	}
	return contentChunks
}

export const extractArrayFromGptChunks = (
	inputString: string | null
): string[] => {
	if (!inputString) return []
	try {
		const regex = /<textchunk>(.*?)<\/textchunk>/gs
		const matches = inputString.matchAll(regex)
		const chunks = []
		for (const match of matches) {
			chunks.push(match[1])
		}
		return chunks
	} catch (e) {
		console.log('Error extracting array from chunk value')
		return []
	}
}

export const getKnowledebaseContext = async (
	query: string,
	params: ChatCompletionCreateParams,
	config: BotConfig
) => {
	try {
		const maxKnowledgeTokens = 400
		const embeddingResponse = await getEmbeddingFromString(
			config.openAiKey,
			query
		)
		const results = await searchVectorData(
			embeddingResponse.embedding,
			config._id
		)
		if (!results) return
		let currentTokens = 0
		const newContext = results.map((result: any) => {
			currentTokens += result.tokens
			return currentTokens >= maxKnowledgeTokens ? '' : result.content
		})
		const stringContext = newContext.join(' ')
		params.messages.push({
			role: 'assistant',
			content: stringContext
		})
	} catch (e) {
		console.log('Error getting data from knowledgebase', e)
	}
}

export const sleep = (ms: number = 0): Promise<void> => {
	return new Promise(resolve => setTimeout(resolve, ms))
}
