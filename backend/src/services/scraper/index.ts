import puppeteer, { Browser } from 'puppeteer';
import { countGptTokens, sleep } from '../../utils';
import logger from '../logger';
import { summarizeText } from '../chatgpt';

let browser: Browser | null;
let browserIsInitializing = false;

const chunkMaxTokenSize = 10000;
const chunkSummaryMaxTokens = 400;
const finalSummaryMaxTokens = 2000;
const reSummaryMaxTokens = 1000;
const maxSummarizedTokens = 5000;

export const webScrapeUrls = async (urls: string[], apiKey: string, userquery: string): Promise<string> => {
	if (!urls || !urls.length) return 'No urls supplied';

	const urlsContent = await Promise.all(urls.map(getWebPageContentFromUrl));
	await closeBrowser();
	const summarizedUrlsContent = await summarizeAllUrlsContent(urlsContent, apiKey, userquery);
	const finalSummary = await createFinalSummary(summarizedUrlsContent, apiKey, userquery);

	return finalSummary;
};

const summarizeAllUrlsContent = async (urlsContent: string[], apiKey: string, userquery: string): Promise<string[]> => {
	const pLimit = (await import('p-limit')).default;
	const limitUrls = pLimit(3);

	return Promise.all(
		urlsContent.map((pageContent, idx) =>
			limitUrls(() => summarizeSingleUrlContent(pageContent, apiKey, userquery))
		)
	);
};

const summarizeSingleUrlContent = async (pageContent: string, apiKey: string, userquery: string): Promise<string> => {
	const chunks = splitContentIntoChunks(pageContent);
	const chunkSummaries = await summarizeChunks(chunks, apiKey, userquery);

	let summarizedContent = chunkSummaries.join('\n');
	summarizedContent = await reSummarizeIfNeeded(summarizedContent, apiKey, userquery);

	return summarizedContent;
};

const splitContentIntoChunks = (pageContent: string): string[] => {
	const pageContentTokens = countGptTokens(pageContent);

	if (pageContentTokens <= chunkMaxTokenSize) {
		return [pageContent];
	}

	const chunkCount = Math.ceil(pageContentTokens / chunkMaxTokenSize);
	const pageContentChunkLength = Math.floor(pageContent.length / chunkCount);

	const chunks: string[] = [];
	for (let i = 0; i < chunkCount; i++) {
		const start = i * pageContentChunkLength;
		const end = start + pageContentChunkLength;
		chunks.push(pageContent.substring(start, end));
	}

	return chunks;
};

const summarizeChunks = async (chunks: string[], apiKey: string, userquery: string): Promise<string[]> => {
	const pLimit = (await import('p-limit')).default;
	const limitChunks = pLimit(2);

	return Promise.all(
		chunks.map(chunk => limitChunks(() => summarizeText(apiKey, chunk, chunkSummaryMaxTokens, userquery)))
	);
};

const reSummarizeIfNeeded = async (summarizedContent: string, apiKey: string, userquery: string): Promise<string> => {
	const summarizedPageContentTokens = countGptTokens(summarizedContent);

	if (summarizedPageContentTokens <= maxSummarizedTokens) {
		return summarizedContent;
	}

	const summary = await summarizeText(apiKey, summarizedContent, reSummaryMaxTokens, userquery);

	return summary;
};

const createFinalSummary = async (
	summarizedUrlsContent: string[],
	apiKey: string,
	userquery: string
): Promise<string> => {
	const allUrlsContent = summarizedUrlsContent.join('\n');
	const summary = await summarizeText(apiKey, allUrlsContent, finalSummaryMaxTokens, userquery);

	return summary;
};

const initBrowser = async (): Promise<void> => {
	if (!browser) {
		if (browserIsInitializing) {
			await sleep(1000);
			return await initBrowser();
		}
		browserIsInitializing = true;
		browser = await puppeteer.launch({
			executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
			args: [
				'--no-sandbox',
				'--disable-dev-shm-usage',
				'--disable-setuid-sandbox',
				'--disable-gpu=False',
				'--enable-webgl',
				'--user-data-dir=/tmp/chrome-user-data'
			],
			headless: true,
			timeout: 10_000,
			protocolTimeout: 20_000
		});
		browserIsInitializing = false;
	}
};
const getWebPageContentFromUrl = async (url: string) => {
	await initBrowser();

	const page = await browser!.newPage();

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
		const typesToAbort = ['image', 'media', 'font', 'stylesheet'];
		if (typesToAbort.includes(request.resourceType().toLowerCase())) {
			await request.abort();
		} else {
			await request.continue();
		}
	});

	try {
		await page.goto(url, { waitUntil: 'domcontentloaded' });
		const pageTextContent = await page.evaluate(() => document.body.innerText);
		await page.close();
		return pageTextContent;
	} catch (e) {
		logger.error(`Error opening ${url}: ${e}`);
		await page.close();
		throw new Error(`Error opening ${url}, might be protected`);
	}
};
const closeBrowser = async () => {
	if (browser) {
		await browser.close();
		browserIsInitializing = false;
		browser = null;
	}
};

export default webScrapeUrls;
