import express, { Request, Response } from 'express'
import { getVectorData, searchVectorData } from '../../db/VectorData'
import { getEmbeddingFromString } from '../../services/chatgpt'

export default (router: express.Router) => {
	router.get('/chunks', getChunksHandler)
	router.post('/vector-data-search', searchVectorDataHandler)
}

const searchVectorDataHandler = async (req: Request, res: Response) => {
	try {
		const { config, query } = req.body
		const embeddingResponse = await getEmbeddingFromString(
			config.openAiKey,
			query
		)
		const results = await searchVectorData(
			embeddingResponse.embedding,
			config._id
		)
		if (!results) return res.sendStatus(404)
		return res.json(results)
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

const getChunksHandler = async (req: Request, res: Response) => {
	try {
		const settings = await getVectorData(req.query.botId as string)
		return res.json(settings || {})
	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}