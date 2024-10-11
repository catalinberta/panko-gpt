import { Request, Response } from 'express';
import { createWhatsappClient, restartWhatsappClient, stopWhatsappClient, unlinkWhatsappClient } from '..';
import {
	getWhatsappConfigs,
	getWhatsappConfigById,
	createWhatsappConfig,
	updateWhatsappConfigById,
	deleteWhatsappConfigById
} from '../models/WhatsappConfig';

export const getWhatsappConfigsController = async (req: Request, res: Response) => {
	try {
		const whatsappConfigs = await getWhatsappConfigs();
		return res.json(whatsappConfigs);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const getWhatsappConfigByIdController = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await getWhatsappConfigById(req.params.id);
		return res.json(whatsappConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const createWhatsappConfigController = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await createWhatsappConfig(req.body);

		whatsappConfig.enabled && createWhatsappClient(whatsappConfig);
		return res.json(whatsappConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const updateWhatsappConfigController = async (req: Request, res: Response) => {
	try {
		const whatsappConfigs = await updateWhatsappConfigById(req.params.id, req.body);
		if (req.body.enabled) {
			await restartWhatsappClient(req.params.id);
		} else {
			await stopWhatsappClient(req.params.id);
		}
		return res.json(whatsappConfigs);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};

export const unlinkWhatsappConfigByIdController = async (req: Request, res: Response) => {
	try {
		const config = await updateWhatsappConfigById(req.params.id, {
			enabled: false,
			linked: false,
			qrcode: ''
		});
		await unlinkWhatsappClient(req.params.id);
		return res.json(config);
	} catch (error) {
		console.log('Error unlinking Whatsapp client', error);
		return res.sendStatus(400);
	}
};

export const deleteWhatsappConfigByIdController = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await deleteWhatsappConfigById(req.params.id);
		await unlinkWhatsappClient(req.params.id);
		return res.json(whatsappConfig);
	} catch (error) {
		console.log(error);
		return res.sendStatus(400);
	}
};
