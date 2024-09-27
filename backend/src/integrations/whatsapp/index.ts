import { WhatsappBotConfig } from './types'
import {
	getWhatsappConfigById,
	getWhatsappConfigs,
	updateWhatsappConfigById
} from './models/WhatsappConfig'
import { queryGPT } from '../../services/chatgpt'
import { ChatId, Client, LocalAuth } from 'whatsapp-web.js';

const botInstances: { [key: string]: Client } = {}

const Whatsapp = async () => {
	const configs: WhatsappBotConfig[] = await getWhatsappConfigs()
	for(let config in configs) {
		if (!configs[config].enabled) continue
		await createWhatsappClient(configs[config])
		await new Promise(resolve => setTimeout(resolve, 20000))
	}
}

const createOnMessageHandler = (
	config: WhatsappBotConfig,
	client: Client
) => {
	client.on('message', async msg => {
		const chat = await msg.getChat()
		const isGroup = chat.isGroup;
		const contact = await chat.getContact();
		const isMentioned = msg.mentionedIds.indexOf(msg.to as unknown as ChatId) > -1;
		const currentTimestamp = Math.round(Date.now() / 1000)
		const messageTimestamp = msg.timestamp;
		const maxAgeInSeconds = 60;

		if(config.onlyContacts && !isGroup && !contact.isMyContact) return;
		if(currentTimestamp - messageTimestamp > maxAgeInSeconds) return;
		if(isGroup && !isMentioned) return;

		const author = await msg.getContact();
		const authorName = author.pushname || author.name || author.shortName; 

		chat.sendStateTyping();
		const userMessage: string = `${authorName}: ${msg.body}`;

		let gptResponse
		try {
			gptResponse = await queryGPT(config, userMessage, msg.from);
		} catch (e) {
			console.log(e)
			msg.reply('Ewps, error from chatgpt api :pleading_face:')
			return
		}
		if(typeof gptResponse !== 'string') return;

		try {
			if(isGroup) {
				msg.reply(gptResponse)
			} else {
				chat.sendMessage(gptResponse)
			}
			
		} catch (e) {
			msg.reply("WhatsApp didn't let me send my reply.")
			console.error(`Error sending message to WhatsApp`, e)
		}
	})
}

export const createWhatsappClient = async (
	config: WhatsappBotConfig
): Promise<Client> => {
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
	}) 
	
	try {
		// Destroy and remove previous instance
		if(botInstances[config._id]) botInstances[config._id].destroy();
		botInstances[config._id] = client

		// Init
		client.initialize();
		createOnMessageHandler(config, client)
		console.log(`${botName} is Online!`)

		client.on('qr', async (qr) => {
			await updateWhatsappConfigById(config._id, {
				linked: false,
				qrcode: qr
			})
		});
		client.on('ready', async () => {
			console.log(`Whatsapp Client ${botName} is ready!`);
			await updateWhatsappConfigById(config._id, {
				linked: true,
				qrcode: ''
			})
		});
		client.on('authenticated', async () => {
			console.log(`${botName} authenticated`)
			await updateWhatsappConfigById(config._id, {
				linked: true,
				qrcode: ''
			})
		});
		client.on('disconnected', async (e) => {
			console.log(`${botName} disconnected`, e)
			await updateWhatsappConfigById(config._id, {
				enabled: false,
				linked: false,
				qrcode: ''
			})
		});

	} catch (e) {
		console.log(
			'Error connecting Whatsapp Bot with config:',
			config,
			'Error message:',
			e
		)
	}

	return client
}

export const restartWhatsappClient = async (id: string) => {
	try {
		const config = await getWhatsappConfigById(id)
		if(!config) {
			console.log('No config found to restart');
		}
		console.log('Restarting', config.internalName);
	
		botInstances[id]?.destroy()
		delete botInstances[id];
		await createWhatsappClient(config)
	} catch (e) {
		console.log(
			'Error restarting Whatsapp Bot with id:',
			id,
			'Error message:',
			e
		)
	}
}

export const unlinkWhatsappClient = async (id: string) => {
	try {
		botInstances[id]?.logout()
		botInstances[id]?.destroy()
		delete botInstances[id]
	} catch (e) {
		console.log('Error unlinking whatsapp', e);
	}
}

export const stopWhatsappClient = async (id: string) => {
	try {
		botInstances[id]?.destroy()
		delete botInstances[id]
	} catch (e) {
		console.log('Error stopping Whatsapp Bot with id:', id, 'Error message:', e)
	}
}

export default Whatsapp
