import { Request, Response } from 'express';
import { createTelegramClient, restartTelegramClient, stopTelegramClient } from '..';
import {
	getTelegramConfigs,
	getTelegramConfigById,
	createTelegramConfig,
	updateTelegramConfigById,
	deleteTelegramConfigById
} from '../models/TelegramConfig';

export const getTelegramConfigsController = async (req: Request, res: Response) => {
	try {
		const telegramConfigs = await getTelegramConfigs();
		return res.json(telegramConfigs);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const getTelegramConfigByIdController = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await getTelegramConfigById(req.params.id);
		return res.json(telegramConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const createTelegramConfigController = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await createTelegramConfig(req.body);
		telegramConfig.enabled && createTelegramClient(telegramConfig);
		return res.json(telegramConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const updateTelegramConfigController = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await updateTelegramConfigById(req.params.id, req.body);
		if (req.body.enabled) {
			await restartTelegramClient(req.params.id);
		} else {
			await stopTelegramClient(req.params.id);
		}
		return res.json(telegramConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const deleteTelegramConfigByIdController = async (req: Request, res: Response) => {
	try {
		const telegramConfig = await deleteTelegramConfigById(req.params.id);
		await stopTelegramClient(req.params.id);
		return res.json(telegramConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};
