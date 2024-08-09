import express, { Request, Response } from 'express'
import { getSettings, updateSettings } from '../../db/Settings'

export default (router: express.Router) => {
	router.get('/settings', getSettingsHandler)
	router.post('/settings', updateSettingsHandler)
}

const getSettingsHandler = async (req: Request, res: Response) => {
	try {
		const settings = await getSettings()
		return res.json(settings || {})
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const updateSettingsHandler = async (req: Request, res: Response) => {
	try {
		const settings = await updateSettings(req.body)
		return res.json(settings)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}
