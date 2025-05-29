import { Telegraf, Context } from 'telegraf';
import { TelegramBotConfig } from './types';
import { getTelegramConfigById, getTelegramConfigs } from '../../integrations/telegram/models/TelegramConfig';
import { getReactionType, queryGPT } from '../../services/chatgpt';
import { MessageContent } from '@langchain/core/messages';
import { Platforms } from '../../constants';
import logger from '../../services/logger';

const supportedEmojis = [
	'👍',
	'👎',
	'❤️',
	'🔥',
	'🎉',
	'🤩',
	'😱',
	'😁',
	'😢',
	'💩',
	'🤮',
	'🥰',
	'🤯',
	'🤔',
	'🤬',
	'👏'
];

const botInstances: { [key: string]: Telegraf<Context> } = {};

const Telegram = async () => {
	const configs: TelegramBotConfig[] = await getTelegramConfigs();
	configs.forEach(async config => {
		if (!config.enabled) return;
		const telegramClient = await createTelegramClient(config);
		createOnMessageHandler(config, telegramClient);
	});
};

const createOnMessageHandler = (config: TelegramBotConfig, client: Telegraf<Context>) => {
	client.on('text', async ctx => {
		if (ctx.message.chat.type !== 'private' && !ctx.message.text.includes(`@${ctx.botInfo.username}`)) {
			return;
		}

		const userMessage: string = ctx.message.text;
		ctx.sendChatAction('typing');

		logger.silly(`Telegram message: ${userMessage} `);

		let gptResponse;
		try {
			gptResponse = await queryGPT(config, userMessage, ctx.message.chat.id.toString());
		} catch (e) {
			logger.error(e);
			ctx.reply('Ewps, error from chatgpt api :pleading_face:');
			return;
		}

		try {
			if (await handleReaction(config, userMessage, gptResponse, ctx)) return;
			await ctx.reply(gptResponse.response);
		} catch (e) {
			ctx.reply("Telegram didn't let me send my reply.");
			logger.error(`Error sending message to Telegram ${e}`);
		}
	});
	client.catch((err, ctx) => {
		logger.error(`Ooops, encountered an error - ${ctx.updateType} ${err}`);
	});
};

export const createTelegramClient = async (config: TelegramBotConfig): Promise<Telegraf<Context>> => {
	const client = new Telegraf(config.botKey);

	try {
		client.launch();
		createOnMessageHandler(config, client);
		botInstances[config._id] = client;
		logger.info(`${config.botName} is Online!`);
	} catch (e) {
		logger.error(`Error connecting Telegram Bot with config: ${config} | Error message: ${e}`);
	}

	return client;
};

export const restartTelegramClient = async (id: string) => {
	try {
		await botInstances[id]?.stop();
		const config = await getTelegramConfigById(id);
		if (config) {
			await createTelegramClient(config);
		}
	} catch (e) {
		logger.error(`Error restarting Telegram Bot with id: ${id} | Error message: ${e}`);
	}
};

export const stopTelegramClient = async (id: string) => {
	try {
		await botInstances[id]?.stop();
	} catch (e) {
		logger.error(`Error stopping Telegram Bot with id: ${id} | Error message: ${e}`);
	}
};

const handleReaction = async (
	config: TelegramBotConfig,
	userMessage: string,
	gptResponse: any,
	ctx: Context
): Promise<boolean> => {
	try {
		const reaction = await getReactionType(
			config,
			Platforms.Telegram,
			supportedEmojis,
			userMessage,
			gptResponse.response
		);
		if (reaction) {
			// @ts-ignore
			await ctx.react(reaction);
			return true;
		}
	} catch (e) {
		logger.error(`Error reacting to Telegram message: ${e}`);
	}
	return false;
};

export default Telegram;
