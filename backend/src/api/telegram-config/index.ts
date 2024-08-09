import express, { Request, Response } from 'express'
import {
	createTelegramConfig,
	deleteTelegramConfigById,
	getTelegramConfigById,
	getTelegramConfigs,
	updateTelegramConfigById
} from '../../integrations/telegram/models/TelegramConfig'
import {
	createTelegramClient,
	restartTelegramClient,
	stopTelegramClient
} from '../../integrations/telegram'

export default (router: express.Router) => {
	router.get('/telegram-configs', getTelegramConfigsHandler)
	router.get('/telegram-configs/:id', getTelegramConfigByIdHandler)
	router.post('/telegram-configs', createTelegramConfigHandler)
	router.patch('/telegram-configs/:id', updateTelegramConfigHandler)
	router.delete('/telegram-configs/:id', deleteTelegramConfigByIdHandler)
}

const getTelegramConfigsHandler = async (req: Request, res: Response) => {
	try {
		const telegramConfigs = await getTelegramConfigs()
		return res.json(telegramConfigs)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const getTelegramConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await getTelegramConfigById(req.params.id)
		return res.json(telegramConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const createTelegramConfigHandler = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await createTelegramConfig(req.body)
		//@ts-ignore
		telegramConfig.enabled && createTelegramClient(telegramConfig)
		return res.json(telegramConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const updateTelegramConfigHandler = async (req: Request, res: Response) => {
	try {
		const telegramConfigs = await updateTelegramConfigById(
			req.params.id,
			req.body
		)
		if (req.body.enabled) {
			await restartTelegramClient(req.params.id)
		} else {
			await stopTelegramClient(req.params.id)
		}
		return res.json(telegramConfigs)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const deleteTelegramConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await deleteTelegramConfigById(req.params.id)
		await stopTelegramClient(req.params.id)
		return res.json(telegramConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}
