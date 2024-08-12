import express, { Request, Response } from 'express'
import { getSettings } from '../../db/Settings'
import OpenAI from 'openai'
import { chatGptDefaults } from '../../constants'

export default (router: express.Router) => {
	router.get('/chatgpt-models', getChatGptModels)
}

const getChatGptModels = async (req: Request, res: Response) => {
	try {
		const settings = await getSettings()
		
		if(!settings?.openAiKey) {
			res.json([chatGptDefaults.model]);
			return;
		}

		const apiKey = settings?.openAiKey;
		const openaiInstance = new OpenAI({apiKey})

		const response = await openaiInstance.models.list()

		const parsedGptModels = response.data.filter(model => model.id.startsWith('gpt'));
		const orderedGptModels = parsedGptModels.sort((a, b) => b.created - a.created);
		const parsedGptModelIds = orderedGptModels.map(model => model.id)
		
		res.json(parsedGptModelIds);
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}