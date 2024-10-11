import { Request, Response } from 'express';
import { getSettings, updateSettings } from '../../models/Settings';

export const getSettingsController = async (req: Request, res: Response) => {
	try {
		const settings = await getSettings();
		return res.json(settings || {});
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const updateSettingsController = async (req: Request, res: Response) => {
	try {
		const settings = await updateSettings(req.body);
		return res.json(settings);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};
