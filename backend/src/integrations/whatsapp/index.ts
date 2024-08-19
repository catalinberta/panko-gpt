//@ts-nocheck
import { WhatsappBotConfig } from './types'
import {
	getWhatsappConfigById,
	getWhatsappConfigs,
	updateWhatsappConfigById
} from './models/WhatsappConfig'
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs'
import { getGptParamsObject, gptQuery } from '../../services/chatgpt'
import { getKnowledebaseContext } from '../../utils'
import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';

const botInstances: { [key: string]: Client } = {}

const Whatsapp = async () => {
	const configs: WhatsappBotConfig[] = await getWhatsappConfigs()
	configs.forEach(async config => {
		console.log(0, configs);
		if (!config.enabled) return
		console.log(1)
		const whatsappClient = await createWhatsappClient(config)
	})
}

const createOnMessageHandler = (
	config: WhatsappBotConfig,
	client: Client
) => {
	client.on('message', async msg => {
		console.log('Got message', msg.body);
		if (msg.body == '!ping') {
			msg.reply('pong');
		}

		const userMessage: string = msg.body;

		const params: ChatCompletionCreateParams = await getGptParamsObject(
			config
		)
		if (config.knowledgebase) {
			await getKnowledebaseContext(userMessage, params, config)
		}
		// getPreviousMessages(params, ctx.message.chat.id.toString())
		params.messages.push({
			role: 'user',
			content: userMessage
		})
		let chatgptResponse
		try {
			chatgptResponse = await gptQuery(config.openAiKey, params)
		} catch (e) {
			console.log(e)
			msg.reply('Ewps, error from chatgpt api :pleading_face:')
			return
		}
		if (chatgptResponse?.error) {
			msg.reply(chatgptResponse.error)
			return
		}
		const assistantMessage =
			chatgptResponse?.response?.choices[0].message.content
		if (!assistantMessage) return

		// await setPreviousMessage(
		// 	config,
		// 	ctx.message.chat.id.toString(),
		// 	userMessage,
		// 	assistantMessage
		// )

		try {
			msg.reply(assistantMessage)
		} catch (e) {
			msg.reply("WhatsApp didn't let me send my reply.")
			console.error(`Error sending message to WhatsApp`, e)
		}
	})
}

export const createWhatsappClient = async (
	config: WhatsappBotConfig
): Promise<Client> => {
	const client = new Client({
		takeoverOnConflict: true,
		puppeteer: {
			args: ['--no-sandbox']
		},
		authStrategy: new LocalAuth({
			clientId: config._id,
			dataPath: './_sessions/whatsapp'
		})
	}) 

	try {
		client.initialize();
		createOnMessageHandler(config, client)
		console.log(`${config.internalName || config.botName} is Online!`)
		botInstances[config._id] = client

		client.on('qr', async (qr) => {
			await updateWhatsappConfigById(config._id, {
				linked: false,
				qrcode: qr
			})
			qrcode.generate(qr, {small: true});
			console.log('QR RECEIVED', qr);
		});
		client.on('ready', () => {
			console.log('Whatsapp Client is ready!');
		});
		client.on('authenticated', async () => {
			console.log('authenticated')
			await updateWhatsappConfigById(config._id, {
				linked: true,
				qrcode: ''
			})
		});
		client.on('disconnected', async () => {
			console.log('disconnected')
			await updateWhatsappConfigById(config._id, {
				linked: false,
				qrcode: ''
			})
		});
		client.on('auth_failure', async () => {
			console.log('auth fail')
			await updateWhatsappConfigById(config._id, {
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
	console.log(0, 'Restart whatsapp');
	try {
		await botInstances[id]?.destroy()
		const config = await getWhatsappConfigById(id)
		if (config) {
			await createWhatsappClient(config)
			console.log(0, 'Restart whatsapp2');
		}
	} catch (e) {
		console.log(0, 'Error Restart whatsapp9', e);
		console.log(
			'Error restarting Whatsapp Bot with id:',
			id,
			'Error message:',
			e
		)
	}
}

export const unlinkWhatsappClient = async (id: string) => {
	console.log(0, 'Unlink');
	try {
		await botInstances[id]?.logout()
		await botInstances[id]?.destroy()
	} catch (e) {
		console.log(0, 'Error unlinking whatsapp', e);
		console.log(
			'Error restarting Whatsapp Bot with id:',
			id,
			'Error message:',
			e
		)
	}
}

export const stopWhatsappClient = async (id: string) => {
	try {
		console.log(0, 'stop & destroy whatsapp');
		await botInstances[id]?.destroy()
		console.log(0, 'destroy complete');
	} catch (e) {
		console.log('Error stopping Whatsapp Bot with id:', id, 'Error message:', e)
	}
}

export default Whatsapp
