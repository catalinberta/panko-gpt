import { Request, Response } from 'express';
import { getSettings, updateSettings } from '../../models/Settings';
import logger, { setLogLevel } from '../../services/logger';

export const getSettingsController = async (req: Request, res: Response) => {
	try {
		const settings = await getSettings();
		return res.json(settings || {});
	} catch (error) {
		logger.error(error);
		return res.sendStatus(400);
	}
};

export const updateSettingsController = async (req: Request, res: Response) => {
	try {
		const settings = await updateSettings(req.body);
		setLogLevel(req.body.logLevel);
		return res.json(settings);
	} catch (error) {
		logger.info(error);
		return res.sendStatus(400);
	}
};
