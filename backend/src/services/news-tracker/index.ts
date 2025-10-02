import cron from 'node-cron';
import logger from '../logger';
import ClientManager from '../client-manager';
import { createLLM, queryGPT } from '../chatgpt';
import { getDiscordConfigById } from '../../integrations/discord/models/DiscordConfig';
import { chatGptDefaults, Platforms } from '../../constants';
import { getTelegramConfigById } from '../../integrations/telegram/models/TelegramConfig';
import {
	addPreviousNewsToTopic,
	getAllNewsTopics,
	NewsTopic,
	TopicPreviousNews,
	updateNewsTopic
} from '../../models/NewsTopic';
import { checkNews, NewsApiCleanResult, NewsApiResult } from './news-service';
import { getSettings } from '../../models/Settings';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import z from 'zod';
import { scrapeUrl } from '../scraper';
import async from 'async';

const schedulerQueue = async.queue<NewsTopic>(async topic => {
	await checkTopic(topic);
}, 1);

interface NewsApiResultWithScore extends NewsApiResult {
	score: number;
	summary: string;
	selectionReason: string;
	id: number;
}

export const startNewsTrackerScheduler = () => {
	const newsTrackerScheduler = cron.schedule('0 * * * *', schedulerCallback);
	newsTrackerScheduler.start();
	logger.info('News Tracker Scheduler Started!');
};

const schedulerCallback = async () => {
	const newsTopics = await getAllNewsTopics();
	const normalizedTopics = newsTopics.map(topic => ({
		...topic,
		_id: topic._id.toString()
	}));

	const topicsToSearch = filterTopicsToSearch(normalizedTopics);

	topicsToSearch.forEach(topic => {
		schedulerQueue.push(topic);
	});
};
const syncTopicLastUpdateAt = async (_id: string) => {
	const now = new Date();
	const utcDate = new Date(
		now.getUTCFullYear(),
		now.getUTCMonth(),
		now.getUTCDate(),
		now.getUTCHours(),
		now.getUTCMinutes()
	);
	await updateNewsTopic(_id, { lastUpdateAt: utcDate });
};
const checkTopic = async (topic: NewsTopic) => {
	const { previousNews = [], query, _id } = topic;
	await syncTopicLastUpdateAt(_id);
	logger.debug(`Checking news topic: ${query} ID ${_id}`);

	const parsedPrevNews = parsePreviousNews(previousNews);

	const news = await checkNews(query);
	if (!news.length) {
		logger.debug(`No news found for ${_id} ${query}`);
		return;
	}
	logger.debug(`Found news for ${query} ID ${_id}. Found: ${news.length}`);
	const cleanedNews = news.filter(news => {
		return parsedPrevNews.allLinks.indexOf(news.url) === -1;
	});
	if (!cleanedNews.length) {
		logger.debug(`No cleaned news found for ${_id} ${query}`);
		return;
	}
	logger.debug(`Cleaned news for ${query} ID ${_id}. Found: ${cleanedNews.length}`);
	const relevantNews = await parseRelevantNews(cleanedNews, parsedPrevNews, query);
	if (!relevantNews.length) {
		logger.debug(`No relevant news found for ${_id} ${query}`);
		return;
	}
	logger.debug(`Relevant news for ${query} ID ${_id}. Found: ${relevantNews.length}`);
	const topRelevantNews = await getTopRelevantNews(relevantNews.slice(0, 10), parsedPrevNews, query);
	if (!topRelevantNews) {
		logger.debug(`No top relevant news found for ${_id} ${query}`);
		return;
	}

	logger.debug(`Top relevant news for ${_id} ${query}. Data: ${JSON.stringify(topRelevantNews, null, 2)}`);

	if (topRelevantNews) {
		shareNews(topic, topRelevantNews);
		const prevNews = {
			createdAt: new Date(),
			summary: topRelevantNews.summary,
			link: topRelevantNews.url,
			selectionReason: topRelevantNews.selectionReason
		};
		await addPreviousNewsToTopic(topic._id, prevNews);
	}
};

const shareNews = async (topic: NewsTopic, topRelevantNews: NewsApiResult) => {
	if (topic.platform === Platforms.Discord) {
		sendDiscordNews(topic, topRelevantNews);
	}
	if (topic.platform === Platforms.Telegram) {
		sendTelegramNews(topic, topRelevantNews);
	}
};

const sendDiscordNews = async (topic: NewsTopic, topRelevantNews: NewsApiResult) => {
	let config = await getDiscordConfigById(topic.companionId);
	// if (!config?.functionNewsTracking) return;

	const defaultMessage = `${topic.query} News: `;
	const client = ClientManager.get(topic.companionId);

	try {
		if (!config) {
			logger.error('No config found for companion id ' + topic.companionId);
			return;
		}
		let discordMessage;
		try {
			const response = await queryGPT(
				config,
				{
					message: `
					- Write a discord news-formatted V2 component compatible message with the following scope:
					-- Never return custom schemas like { type, title, ... }.
					-- Always respond with a valid Discord V2 message object containing "content": string, "embeds": array, "components": array
					-- Only return a link title, small description/summary, an image and content notifying the user with prefix <@${
						topic.userId
					}>.
					-- Announce a new article that contains news in the user's interest.
					-- The article information will contain at least link, an image and a summary
					-- Topic is: ${topic.query}.
					-- New article: ${JSON.stringify(topRelevantNews)}
				`
				},
				topic.channelId,
				undefined,
				undefined,
				undefined,
				true
			);
			const parsedMessage = JSON.parse(response.response);
			if ('embeds' in parsedMessage || 'components' in parsedMessage) {
				discordMessage = parsedMessage;
			} else {
				discordMessage = {
					content: `<@${topic.userId}> ${parsedMessage.title || topic.query}`,
					embeds: [
						{
							title: parsedMessage.title,
							url: parsedMessage.url,
							description: parsedMessage.summary || parsedMessage.description,
							image: parsedMessage.image ? { url: parsedMessage.image } : undefined,
							footer: { text: `Score: ${parsedMessage.score ?? '?'}` },
							timestamp: parsedMessage.timestamp
						}
					],
					components: parsedMessage.url
						? [
								{
									type: 1,
									components: [
										{
											type: 2,
											style: 5,
											label: parsedMessage.cta || 'Read Article',
											url: parsedMessage.url
										}
									]
								}
						  ]
						: []
				};
			}
		} catch (e) {
			logger.error(`Error parsing gpt response for Discord: ${e}`);
			discordMessage = { content: `<@${topic.userId}> ${defaultMessage}` };
		}

		const channel = await client.channels.fetch(topic.channelId);
		try {
			await channel.send(discordMessage);
		} catch (e) {
			logger.error(`Error sending news to Discord: ${e}`);
		}
	} catch (error) {
		logger.error('Error running news topic: ' + String(error));
	}
};

const sendTelegramNews = async (topic: NewsTopic, topRelevantNews: NewsApiResult) => {
	let config = await getTelegramConfigById(topic.companionId);
	// if (!config?.functionNewsTracking) return;

	const defaultMessage = `${topic.query} News:`;
	const client = ClientManager.get(topic.companionId);

	try {
		if (!config) {
			logger.error('No config found for companion id ' + topic.companionId);
			return;
		}
		let message;
		try {
			const response = await queryGPT(
				config,
				{
					message: `
					- Write a very short message with the following scope:
					-- Announce a new article that contains news in the user's interest.
					-- The article information will contain at least link and a short summary
					-- Topic is: ${topic.query}.
					-- New article: ${JSON.stringify(topRelevantNews)}
				`
				},
				topic.channelId,
				undefined,
				undefined,
				undefined,
				true
			);
			message = `@${topic.userName} ${response.response}`;

			try {
				await client.telegram.sendMessage(topic.channelId, message);
			} catch (e) {
				logger.error(`Error sending news to Telegram: ${e}`);
			}
		} catch (e) {
			logger.error(`Error parsing gpt response for Telegram: ${e}`);
		}
	} catch (error) {
		logger.error('Error running news topic: ' + String(error));
	}
};

const getTopRelevantNews = async (
	news: NewsApiResult[],
	previousNews: {
		allLinks: string[];
		previousNewsContext: string;
	},
	query: string
): Promise<NewsApiResultWithScore | null> => {
	const minScoreThreshold = 75;
	const processedNews = [];

	for (let i = 0; i < news.length; i++) {
		const { selectionReason, summary, score } = await getNewsRelevancyScore(news[i], previousNews, query);
		processedNews.push({
			id: i,
			score,
			summary,
			selectionReason
		});
	}

	const topScore = processedNews.reduce(
		(acc, newsScore) => {
			return newsScore.score > acc.score ? newsScore : acc;
		},
		{ id: 0, score: 0 }
	);

	if (topScore.score > minScoreThreshold) {
		const topNews = news[topScore.id];

		return {
			...news[topScore.id],
			...processedNews[topScore.id]
		};
	}
	return null;
};

const getNewsRelevancyScore = async (
	news: NewsApiResult,
	previousNews: {
		allLinks: string[];
		previousNewsContext: string;
	},
	query: string
) => {
	const settings = await getSettings();
	const newsContent = await scrapeUrl(news.url);

	const model = createLLM(settings?.openAiKey, chatGptDefaults.smallModel).withStructuredOutput(
		z.object({ score: z.number(), summary: z.string(), selectionReason: z.string() })
	);
	const messages = [
		new SystemMessage(
			`
			- You will be given a list of already processed articles and the content of a new article.
			- You will return a summary of the article and a score of how relevant the article was to the user's query: ${query}.
			- A selectionReason which describe the article details that indicate the relevancy to the user's query.
			- The score needs to be between 0 (not relevant) and 100 (Extremely relevant). 
			- A score of 0 means the information in the new article is already present in the previousNews.
			- A score of 100 represents that the user's query is 100% in the article content with genuine new information and not already present in the previous news.
			`
		),
		new HumanMessage(`Previously processed articles: ${JSON.stringify(previousNews)}`),
		new HumanMessage(`New article: ${newsContent}`)
	];
	const gptResponse = await model.invoke(messages);

	return {
		score: Math.round(gptResponse.score),
		summary: gptResponse.summary,
		selectionReason: gptResponse.selectionReason
	};
};

const parseRelevantNews = async (
	news: NewsApiCleanResult[],
	parsedPrevNews: {
		allLinks: string[];
		previousNewsContext: string;
	},
	userquery: string
) => {
	const settings = await getSettings();

	const schema = z.object({
		news: z.array(
			z.object({
				title: z.string(),
				description: z.string(),
				url: z.string(),
				urlToImage: z.string(),
				content: z.string()
			})
		)
	});
	const model = createLLM(settings?.openAiKey, chatGptDefaults.smallModel).withStructuredOutput(schema);

	const systemPrompt = `
		- You are a news result filterer. 
		- You will be given a stringified array of news results, all previously parsed links, a set of more details about latest news already processed and a user query find related news.
		- Your job is to return a new structured response with an array of news results with the following rules:
		-- Remove news that have already been processed.
		-- Remove news that have already been covered.
		-- Remove news that are not related to the user query.
		-- Only keep news-worthy articles with genuine new helpful information.
		-- Order remaining results in order of relevancy from most relevant to least.
	`;
	const messages = [];
	messages.push(new SystemMessage(systemPrompt));
	messages.push(new HumanMessage('News results: ' + JSON.stringify(news)));
	messages.push(new HumanMessage('All previously processed news links: ' + JSON.stringify(parsedPrevNews.allLinks)));
	messages.push(new HumanMessage('Previously processed latest news: ' + parsedPrevNews.previousNewsContext));
	messages.push(new HumanMessage('User query: ' + JSON.stringify(userquery)));
	const response = await model.invoke(messages);

	return response.news;
};

const parsePreviousNews = (previousNews: TopicPreviousNews[]) => {
	const allLinks = previousNews.map(news => news.link);
	const filteredPreviousNews = previousNews.slice(0, 10);
	let previousNewsContext = filteredPreviousNews.reduce((acc, previousNews, index) => {
		return `
			${acc}
			Link ${index}: ${previousNews.link}. 
			Summary: ${previousNews.summary}
			Reason for previously sharing this news: ${previousNews.selectionReason}
			`;
	}, '');

	return {
		allLinks,
		previousNewsContext
	};
};

const filterTopicsToSearch = (topics: NewsTopic[]) => {
	const topicsToSearch = topics.filter((topic: NewsTopic) => {
		const nowTimestamp = new Date().getTime();
		const lastUpdateTimestamp = new Date(topic.lastUpdateAt).getTime();
		const diff = (nowTimestamp - lastUpdateTimestamp) / 1000;
		return diff > topic.frequency;
	});
	return topicsToSearch;
};
