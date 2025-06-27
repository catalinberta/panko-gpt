import 'dotenv/config';
import { ActivityType, Client, GatewayIntentBits, Message } from 'discord.js';
import { sendDiscordMessage } from '../../utils';
import { getComponents, getReactionType, queryGPT } from '../../services/chatgpt';
import { getDiscordMessage, sendDiscordTypingInterval } from './utils';
import { getDiscordConfigById, getDiscordConfigs } from './models/DiscordConfig';
import { DiscordBotConfig } from './types';
import { SystemMessage } from '@langchain/core/messages';
import { Platforms } from '../../constants';
import logger from '../../services/logger';

const botInstances: { [key: string]: Client } = {};

const Discord = async () => {
	const configs = await getDiscordConfigs();
	configs.forEach(async config => {
		if (!config.enabled) return;
		await createDiscordClient(config);
	});
};

const createOnMessageHandler = (config: DiscordBotConfig, client: Client) => {
	client.on('messageCreate', async (message: Message) => {
		if (message.author.bot) return;
		if (client.user && !message.mentions.users.has(client.user.id)) return;

		const discordMessage = await getDiscordMessage(client, message);
		const typingInterval = await sendDiscordTypingInterval(message);

		let gptResponse;
		try {
			gptResponse = await handleGPTResponse(config, discordMessage, message);
		} catch (e) {
			logger.error(`Discord onmessage error: ${e}`);
			sendDiscordMessage(message, 'Ewps, error from chatgpt api :pleading_face:');
			clearInterval(typingInterval);
			return;
		}

		logger.silly(`Discord gpt response: ${gptResponse}`);
		clearInterval(typingInterval);

		if (await handleReaction(config, discordMessage, gptResponse, message)) return;

		const componentResponse = await handleComponents(config, discordMessage, gptResponse);

		try {
			sendDiscordMessage(message, gptResponse.response, JSON.parse(componentResponse as string));
		} catch (e) {
			message.reply(gptResponse.response);
			const errorMessage = `Discord didn't let me send my reply. Used components: ${Boolean(componentResponse)}`;
			logger.error(`${errorMessage} ${e}`);
		}
	});
};

export const createDiscordClient = async (config: DiscordBotConfig) => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.MessageContent
		]
	});

	client.on('ready', () => {
		logger.info(`${config.internalName || config.botName} is Online!`);
		client.user?.setActivity({
			name: config.botStatusText ?? 'Hello World!',
			type: ActivityType.Custom
		});
	});

	try {
		await client.login(config.botKey);
		createOnMessageHandler(config, client);
		botInstances[config._id] = client;
	} catch (e) {
		logger.error(`Error connecting Discord Bot with config: ${config} | Error message: ${e}`);
	}

	return client;
};

export const restartDiscordClient = async (id: string) => {
	try {
		await botInstances[id]?.destroy();
		delete botInstances[id];

		const config = await getDiscordConfigById(id);
		if (config) {
			await createDiscordClient(config);
		}
	} catch (e) {
		logger.error(`Error restarting Discord Bot with id: ${id} | Error message: ${e}`);
	}
};

export const stopDiscordClient = async (id: string) => {
	try {
		const config = await getDiscordConfigById(id);
		if (!config) return;
		await botInstances[id]?.destroy();
		delete botInstances[id];
		logger.info(`${config.botName} is Offline!`);
	} catch (e) {
		logger.error(`Error stopping Discord Bot with id: ${id} | Error message: ${e}`);
	}
};

export const getDiscordClientId = async (config: DiscordBotConfig) => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.MessageContent
		]
	});

	try {
		await client.login(config.botKey);
		const clientId = client.user?.id;
		await client.destroy();
		return clientId;
	} catch (e) {
		logger.info(`Error connecting Discord Bot with config: ${config} | Error message: ${e}`);
	}

	return null;
};

const handleGPTResponse = async (config: DiscordBotConfig, discordMessage: any, message: Message) => {
	const customPrompt = {
		system: [
			new SystemMessage(
				'This message will receive further processing and possibly use Discord native components to enrich messaging on Discord. This includes buttons, content layouts, media etc.'
			)
		]
	};

	return await queryGPT(config, discordMessage.messageWithReply, message.channelId, [], {}, customPrompt);
};

const handleReaction = async (config: DiscordBotConfig, discordMessage: any, gptResponse: any, message: Message) => {
	const reaction = await getReactionType(
		config,
		Platforms.Discord,
		[],
		discordMessage.messageWithReply,
		gptResponse.response
	);
	if (reaction) {
		try {
			await message.react(reaction);
			return true;
		} catch (e) {
			logger.error(`Error reacting to message: ${e}`);
		}
	}
	return false;
};

const handleComponents = async (config: DiscordBotConfig, discordMessage: any, gptResponse: any) => {
	return await getComponents(
		config,
		Platforms.Discord,
		gptResponse.toolMessages,
		discordMessage.messageWithReply,
		gptResponse.response
	);
};

export default Discord;
