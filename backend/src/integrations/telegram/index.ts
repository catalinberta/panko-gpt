import { Telegraf, Context } from 'telegraf';
import { TelegramBotConfig } from './types';
import { getTelegramConfigById, getTelegramConfigs } from '../../integrations/telegram/models/TelegramConfig';
import { queryGPT } from '../../services/chatgpt';
import { MessageContent } from '@langchain/core/messages';

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

		let gptResponse: MessageContent;
		try {
			gptResponse = await queryGPT(config, userMessage, ctx.message.chat.id.toString());
		} catch (e) {
			console.log(e);
			ctx.reply('Ewps, error from chatgpt api :pleading_face:');
			return;
		}
		if (typeof gptResponse !== 'string') return;
		try {
			ctx.reply(gptResponse);
		} catch (e) {
			ctx.reply("Telegram didn't let me send my reply.");
			console.error(`Error sending message to Telegram`, e);
		}
	});
	client.catch((err, ctx) => {
		console.log(`Ooops, encountered an error - ${ctx.updateType}`, err);
	});
};

export const createTelegramClient = async (config: TelegramBotConfig): Promise<Telegraf<Context>> => {
	const client = new Telegraf(config.botKey);

	try {
		client.launch();
		createOnMessageHandler(config, client);
		botInstances[config._id] = client;
		console.log(`${config.botName} is Online!`);
	} catch (e) {
		console.log('Error connecting Telegram Bot with config:', config, 'Error message:', e);
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
		console.log('Error restarting Telegram Bot with id:', id, 'Error message:', e);
	}
};

export const stopTelegramClient = async (id: string) => {
	try {
		await botInstances[id]?.stop();
	} catch (e) {
		console.log('Error stopping Telegram Bot with id:', id, 'Error message:', e);
	}
};

export default Telegram;
