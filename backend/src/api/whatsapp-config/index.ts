import express, { Request, Response } from 'express'
import {
	createWhatsappConfig,
	deleteWhatsappConfigById,
	getWhatsappConfigById,
	getWhatsappConfigs,
	updateWhatsappConfigById
} from '../../integrations/whatsapp/models/WhatsappConfig'
import {
	createWhatsappClient,
	restartWhatsappClient,
	stopWhatsappClient,
	unlinkWhatsappClient
} from '../../integrations/whatsapp'

export default (router: express.Router) => {
	router.get('/whatsapp-configs', getWhatsappConfigsHandler)
	router.get('/whatsapp-configs/:id', getWhatsappConfigByIdHandler) 
	router.post('/whatsapp-configs', createWhatsappConfigHandler)
	router.patch('/whatsapp-configs/:id', updateWhatsappConfigHandler)
	router.delete('/whatsapp-configs/:id', deleteWhatsappConfigByIdHandler)
	router.delete('/whatsapp-links/:id', unlinkWhatsappConfigByIdHandler)
}

const getWhatsappConfigsHandler = async (req: Request, res: Response) => {
	try {
		const whatsappConfigs = await getWhatsappConfigs()
		return res.json(whatsappConfigs)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const getWhatsappConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await getWhatsappConfigById(req.params.id)
		return res.json(whatsappConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const createWhatsappConfigHandler = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await createWhatsappConfig(req.body)
		//@ts-ignore
		whatsappConfig.enabled && createWhatsappClient(whatsappConfig)
		return res.json(whatsappConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const updateWhatsappConfigHandler = async (req: Request, res: Response) => {
	try {
		const whatsappConfigs = await updateWhatsappConfigById(
			req.params.id,
			req.body
		)
		if (req.body.enabled) {
			await restartWhatsappClient(req.params.id)
		} else {
			await stopWhatsappClient(req.params.id)
		}
		return res.json(whatsappConfigs)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}


const unlinkWhatsappConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const config = await updateWhatsappConfigById(req.params.id, {
			enabled: false,
			linked: false,
			qrcode: ''
		})
		await unlinkWhatsappClient(req.params.id)
		return res.json(config)
	} catch (error) {
		console.log('Error unlinking Whatsapp client', error)
		return res.sendStatus(400);
	}
}


const deleteWhatsappConfigByIdHandler = async (req: Request, res: Response) => {
	try {
		const whatsappConfig = await deleteWhatsappConfigById(req.params.id)
		await stopWhatsappClient(req.params.id)
		return res.json(whatsappConfig)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}
