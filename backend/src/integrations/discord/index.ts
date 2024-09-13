import 'dotenv/config'
import { ActivityType, Client, GatewayIntentBits, Message } from 'discord.js'
import { sendDiscordMessage } from '../../utils'
import { queryGPT } from '../../services/chatgpt'
import {
	getDiscordMessage,
	sendDiscordTypingInterval
} from './utils'
import { getDiscordConfigById, getDiscordConfigs } from './models/DiscordConfig'
import { DiscordBotConfig } from './types'
import { MessageContent } from '@langchain/core/messages'

const botInstances: { [key: string]: Client } = {}

const Discord = async () => {
	const configs: DiscordBotConfig[] = await getDiscordConfigs()
	configs.forEach(async config => {
		if (!config.enabled) return
		await createDiscordClient(config)
	})
}

const createOnMessageHandler = (config: DiscordBotConfig, client: Client) => {
	client.on('messageCreate', async (message: Message) => {
		if (message.author.bot) return
		if (client.user && !message.mentions.users.has(client.user.id)) {
			return
		}
		const discordMessage = await getDiscordMessage(client, message)
		const typingInterval = await sendDiscordTypingInterval(message)
		
		let gptResponse: MessageContent;
		try {
			gptResponse = await queryGPT(config, discordMessage.messageWithReply, message.channelId);
		} catch (e) {
			console.log(e)
			sendDiscordMessage(
				message,
				'Ewps, error from chatgpt api :pleading_face:'
			)
			clearInterval(typingInterval)
			return
		}
		clearInterval(typingInterval)

		try {
			sendDiscordMessage(message, gptResponse)
		} catch (e) {
			const errorMessage = "Discord didn't let me send the reply.";
			message.reply(errorMessage)
			console.error(errorMessage, e)
		}
	})
}

export const createDiscordClient = async (config: DiscordBotConfig) => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.MessageContent
		]
	})

	client.on('ready', () => {
		console.log(`${config.botName} is Online!`)
		client.user?.setActivity({
			name: config.botStatusText ?? 'Hello World!',
			type: ActivityType.Custom
		})
	})

	try {
		await client.login(config.botKey)
		createOnMessageHandler(config, client)
		botInstances[config._id] = client
	} catch (e) {
		console.log(
			'Error connecting Discord Bot with config:',
			config,
			'Error message:',
			e
		)
	}

	return client
}

export const restartDiscordClient = async (id: string) => {
	try {
		await botInstances[id]?.destroy()
		delete botInstances[id]
		
		const config = await getDiscordConfigById(id)
		if (config) {
			await createDiscordClient(config)
		}
	} catch (e) {
		console.log(
			'Error restarting Discord Bot with id:',
			id,
			'Error message:',
			e
		)
	}
}

export const stopDiscordClient = async (id: string) => {
	try {
		const config = await getDiscordConfigById(id)
		console.log(`${config.botName} is Offline!`)
		await botInstances[id]?.destroy()
		delete botInstances[id]
	} catch (e) {
		console.log('Error stopping Discord Bot with id:', id, 'Error message:', e)
	}
}

export const getDiscordClientId = async (config: DiscordBotConfig) => {
	const client = new Client({
		intents: [
			GatewayIntentBits.Guilds,
			GatewayIntentBits.GuildMessages,
			GatewayIntentBits.GuildMembers,
			GatewayIntentBits.MessageContent
		]
	})

	try {
		await client.login(config.botKey)
		const clientId = client.user?.id
		await client.destroy()
		return clientId
	} catch (e) {
		console.log(
			'Error connecting Discord Bot with config:',
			config,
			'Error message:',
			e
		)
	}

	return null
}

export default Discord
