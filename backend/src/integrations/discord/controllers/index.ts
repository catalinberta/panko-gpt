import { Request, Response } from 'express';
import { createDiscordClient, getDiscordClientId, restartDiscordClient, stopDiscordClient } from '..';
import {
	getDiscordConfigs,
	getDiscordConfigById,
	createDiscordConfig,
	updateDiscordConfigById,
	deleteDiscordConfigById
} from '../models/DiscordConfig';
import logger from '../../../services/logger';

export const getDiscordConfigsController = async (req: Request, res: Response) => {
	try {
		const discordConfigs = await getDiscordConfigs();
		return res.json(discordConfigs);
	} catch (error) {
		logger.error(error);
		return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
	}
};

export const getDiscordConfigByIdController = async (req: Request, res: Response) => {
	try {
		const discordConfig = await getDiscordConfigById(req.params.id);
		return res.json(discordConfig);
	} catch (error) {
		logger.error(error);
		return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
	}
};

export const createDiscordConfigController = async (req: Request, res: Response) => {
	try {
		let discordConfig = await createDiscordConfig(req.body);
		let clientId = null;
		if (discordConfig.enabled) {
			const client = await createDiscordClient(discordConfig);
			clientId = client?.user?.id;
		} else {
			clientId = await getDiscordClientId(discordConfig);
		}
		if (clientId) {
			const newDiscordConfig = await updateDiscordConfigById(discordConfig._id, { clientId });
			if (newDiscordConfig) {
				discordConfig = newDiscordConfig;
			}
		}
		return res.json(discordConfig);
	} catch (error) {
		logger.error(error);
		return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
	}
};

export const updateDiscordConfigController = async (req: Request, res: Response) => {
	try {
		let config = await updateDiscordConfigById(req.params.id, req.body);
		let clientId = null;
		if (config) {
			clientId = await getDiscordClientId(config);
			if (clientId) {
				const newDiscordConfig = await updateDiscordConfigById(config._id, { clientId });
				if (newDiscordConfig) {
					config = newDiscordConfig;
				}
			}
		}
		if (req.body.enabled) {
			await restartDiscordClient(req.params.id);
		} else {
			await stopDiscordClient(req.params.id);
		}
		return res.json(config);
	} catch (error) {
		logger.error(error);
		return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
	}
};

export const deleteDiscordConfigByIdController = async (req: Request, res: Response) => {
	try {
		const discordConfig = await deleteDiscordConfigById(req.params.id);
		await stopDiscordClient(req.params.id);
		return res.json(discordConfig);
	} catch (error) {
		logger.error(error);
		return res.status(400).json({ error: error instanceof Error ? error.message : String(error) });
	}
};
