import 'dotenv/config'
import { ActivityType, Client, GatewayIntentBits, Message } from 'discord.js'
import { getKnowledebaseContext, sendDiscordMessage } from '../../utils'
import { ChatCompletionCreateParams } from 'openai/resources/index.mjs'
import { getGptParamsObject, gptQuery } from '../../services/chatgpt'
import {
	getPreviousMessages,
	setPreviousMessage
} from '../../services/previous-messages'
import {
	getDiscordMessage,
	sendDiscordTypingInterval
} from './utils'
import { getDiscordConfigById, getDiscordConfigs } from './models/DiscordConfig'
import { DiscordBotConfig } from './types'

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
		
		const params: ChatCompletionCreateParams = getGptParamsObject(
			config
		)
		if (config.context) {
			await getKnowledebaseContext(discordMessage.userMessage, params, config)
		}
		getPreviousMessages(params, message.channelId)
		params.messages.push({
			role: 'user',
			content: discordMessage.messageWithReply
		})
		let chatgptResponse
		try {
			chatgptResponse = await gptQuery(config.openAiKey, params)
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
		if (chatgptResponse?.error) {
			message.reply(chatgptResponse.error)
			return
		}
		const assistantMessage =
			chatgptResponse?.response?.choices[0].message.content
		if (!assistantMessage) return
		await setPreviousMessage(
			config,
			message.channelId,
			discordMessage.userMessage,
			assistantMessage
		)
		try {
			sendDiscordMessage(message, assistantMessage)
		} catch (e) {
			message.reply("Discord didn't let me send my reply.")
			console.error(`Error sending message to Discord`, e)
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
