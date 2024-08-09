import express, { Request, Response } from 'express'
import {
	createDiscordConfig,
	deleteDiscordConfigById,
	getDiscordConfigById,
	getDiscordConfigs,
	updateDiscordConfigById
} from '../../integrations/discord/models/DiscordConfig'
import {
	createDiscordClient,
	getDiscordClientId,
	restartDiscordClient,
	stopDiscordClient
} from '../../integrations/discord'
import { DiscordBotConfig } from '../../integrations/discord/types'

export default (router: express.Router) => {
	router.get('/discord-configs', getDiscordConfigsHandler)
	router.get('/discord-configs/:id', getDiscordConfigByIdHandler)
	router.post('/discord-configs', createDiscordConfigHandler)
	router.patch('/discord-configs/:id', updateDiscordConfigHandler)
	router.delete('/discord-configs/:id', deleteDiscordConfigByIdHandler)
}

const getDiscordConfigsHandler = async (req: Request, res: Response) => {
	try {
		const discordConfigs = await getDiscordConfigs()
		return res.json(discordConfigs)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const getDiscordConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const discordConfig = await getDiscordConfigById(req.params.id)
		return res.json(discordConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const createDiscordConfigHandler = async (req: Request, res: Response) => {
	try {
		let discordConfig = (await createDiscordConfig(
			req.body
		)) as unknown as DiscordBotConfig
		let clientId = null
		if (discordConfig.enabled) {
			const client = await createDiscordClient(discordConfig)
			clientId = client?.user?.id
		} else {
			clientId = await getDiscordClientId(discordConfig)
		}
		if (clientId) {
			const newDiscordConfig = await updateDiscordConfigById(
				discordConfig._id,
				{ clientId }
			)
			if (newDiscordConfig) {
				discordConfig = newDiscordConfig as unknown as DiscordBotConfig
			}
		}
		return res.json(discordConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const updateDiscordConfigHandler = async (req: Request, res: Response) => {
	try {
		await updateDiscordConfigById(req.params.id, req.body)
		if (req.body.enabled) {
			await restartDiscordClient(req.params.id)
		} else {
			await stopDiscordClient(req.params.id)
		}
		return res.json(req.body)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const deleteDiscordConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const discordConfig = await deleteDiscordConfigById(req.params.id)
		await stopDiscordClient(req.params.id)
		return res.json(discordConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}
