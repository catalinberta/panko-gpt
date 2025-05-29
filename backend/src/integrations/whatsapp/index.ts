import { WhatsappBotConfig, WhatsappContactsFilterType } from './types';
import { getWhatsappConfigById, getWhatsappConfigs, updateWhatsappConfigById } from './models/WhatsappConfig';
import { getReactionType, queryGPT } from '../../services/chatgpt';
import { Chat, ChatId, Client, LocalAuth } from 'whatsapp-web.js';
import { Platforms } from '../../constants';
import logger from '../../services/logger';

const botInstances: { [key: string]: Client } = {};

const Whatsapp = async () => {
	const configs: WhatsappBotConfig[] = await getWhatsappConfigs();
	for (let config in configs) {
		if (!configs[config].enabled) continue;
		await createWhatsappClient(configs[config]);
		await new Promise(resolve => setTimeout(resolve, 20000));
	}
};

const createOnMessageHandler = (config: WhatsappBotConfig, client: Client) => {
	client.on('message', async msg => {
		const chat = await msg.getChat();
		const isGroup = chat.isGroup;
		const isMentioned = msg.mentionedIds.indexOf(msg.to as unknown as ChatId) > -1;
		const currentTimestamp = Math.round(Date.now() / 1000);
		const messageTimestamp = msg.timestamp;
		const maxAgeInSeconds = 60;

		const isContactValidated = await validateContact(config, chat);
		if (!isContactValidated) return;

		if (currentTimestamp - messageTimestamp > maxAgeInSeconds) return;
		if (isGroup && !isMentioned) return;

		const author = await msg.getContact();
		const authorName = author.pushname || author.name || author.shortName;

		chat.sendStateTyping();
		const userMessage: string = `${authorName}: ${msg.body}`;

		logger.silly(`Whatsapp message: ${userMessage} `);

		let gptResponse;
		try {
			gptResponse = await queryGPT(config, userMessage, msg.from);
		} catch (e) {
			logger.error(e);
			msg.reply('Ewps, error from chatgpt api :pleading_face:');
			return;
		}
		if (typeof gptResponse.response !== 'string') return;

		try {
			if (await handleReaction(config, userMessage, gptResponse, msg, chat, isGroup)) return;
			if (isGroup) {
				await msg.reply(gptResponse.response);
			} else {
				await chat.sendMessage(gptResponse.response);
			}
		} catch (e) {
			if (isGroup) {
				msg.reply(gptResponse.response);
			} else {
				chat.sendMessage(gptResponse.response);
			}
			logger.error(`Error sending message to WhatsApp ${e}`);
		}
	});
};

export const createWhatsappClient = async (config: WhatsappBotConfig): Promise<Client> => {
	const botName = config.internalName;
	const client = new Client({
		takeoverOnConflict: true,
		puppeteer: {
			args: ['--no-sandbox']
		},
		authStrategy: new LocalAuth({
			clientId: config._id,
			dataPath: './data/_sessions/whatsapp'
		})
	});

	try {
		// Destroy and remove previous instance
		if (botInstances[config._id]) botInstances[config._id].destroy();
		botInstances[config._id] = client;

		// Init
		client.initialize();
		createOnMessageHandler(config, client);

		client.on('qr', async qr => {
			logger.info(`${botName} showing QR`);
			await updateWhatsappConfigById(config._id, {
				linked: false,
				qrcode: qr
			});
		});
		client.on('ready', async () => {
			logger.info(`${botName} is Online!`);
			await updateWhatsappConfigById(config._id, {
				linked: true,
				qrcode: ''
			});
		});
		client.on('authenticated', async () => {
			logger.info(`${botName} authenticated`);
			await updateWhatsappConfigById(config._id, {
				linked: true,
				qrcode: ''
			});
		});
		client.on('disconnected', async e => {
			logger.info(`${botName} disconnected`, e);
			await updateWhatsappConfigById(config._id, {
				enabled: false,
				linked: false,
				qrcode: ''
			});
		});
	} catch (e) {
		logger.error(`Error connecting Whatsapp Bot with config: ${config} | Error message: ${e}`);
	}

	return client;
};

export const restartWhatsappClient = async (id: string) => {
	try {
		const config = await getWhatsappConfigById(id);
		if (!config) {
			logger.warn('No config found to restart');
			return;
		}
		logger.info('Restarting', config.internalName);

		botInstances[id]?.destroy();
		delete botInstances[id];
		await createWhatsappClient(config);
	} catch (e) {
		logger.error(`Error restarting Whatsapp Bot with id: ${id} | Error message: ${e}`);
	}
};

export const unlinkWhatsappClient = async (id: string) => {
	try {
		botInstances[id]?.logout();
		botInstances[id]?.destroy();
		delete botInstances[id];
	} catch (e) {
		logger.error(`Error unlinking whatsapp ${e}`);
	}
};

export const stopWhatsappClient = async (id: string) => {
	try {
		botInstances[id]?.destroy();
		delete botInstances[id];
	} catch (e) {
		logger.error(`Error stopping Whatsapp Bot with id: ${id} | Error message: ${e}`);
	}
};

const validateContact = async (config: WhatsappBotConfig, chat: Chat): Promise<boolean> => {
	const { onlyContacts, contactsFilterType, contactsWhitelist, contactsBlacklist } = config;
	if (!onlyContacts) return true;

	const isGroup = chat.isGroup;
	const contact = await chat.getContact();
	const contactNumber = contact.number.replace(/[\D]/gi, '');

	if (contactsFilterType === WhatsappContactsFilterType.ALL) {
		return !isGroup && contact.isMyContact;
	}

	if (contactsFilterType === WhatsappContactsFilterType.WHITELIST) {
		let isContactWhitelisted = false;
		contactsWhitelist.map(whitelistedContact => {
			const cleanedWhitelistedContact = whitelistedContact.replace(/[\D]/gi, '');
			if (contactNumber === cleanedWhitelistedContact) {
				isContactWhitelisted = true;
			}
		});
		if (!isContactWhitelisted)
			logger.info(`Blocked non-whitelisted number: ${contactNumber}. Received message: ${chat.lastMessage.body}`);
		return isContactWhitelisted;
	}

	if (contactsFilterType === WhatsappContactsFilterType.BLACKLIST) {
		let isContactBlacklisted = false;
		contactsBlacklist.map(blacklistedContact => {
			const cleanedBlacklistedContact = blacklistedContact.replace(/[\D]/gi, '');
			if (contactNumber === cleanedBlacklistedContact) {
				isContactBlacklisted = true;
			}
		});
		if (isContactBlacklisted)
			logger.info(`Blocked blacklisted number: ${contactNumber}. Received message: ${chat.lastMessage.body}`);
		return !isContactBlacklisted;
	}

	return true;
};

const handleReaction = async (
	config: WhatsappBotConfig,
	userMessage: string,
	gptResponse: any,
	msg: any,
	chat: any,
	isGroup: boolean
): Promise<boolean> => {
	try {
		const reaction = await getReactionType(config, Platforms.Whatsapp, [], userMessage, gptResponse.response);
		if (reaction) {
			await msg.react(reaction);
			return true;
		}
	} catch (e) {
		logger.error(`Error reacting to WhatsApp message: ${e}`);
	}
	return false;
};

export default Whatsapp;
