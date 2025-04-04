import express, { Request, Response } from 'express';
import { getVectorData, searchVectorData } from '../../models/VectorData';
import { getEmbeddingFromString } from '../../services/chatgpt';
import logger from '../../services/logger';

export default (router: express.Router) => {
	router.get('/chunks', getChunksHandler);
	router.post('/vector-data-search', searchVectorDataHandler);
};

const searchVectorDataHandler = async (req: Request, res: Response) => {
	try {
		const { config, query } = req.body;
		const embeddingResponse = await getEmbeddingFromString(config.openAiKey, query);
		const results = await searchVectorData(embeddingResponse.embedding, config._id);
		if (!results) return res.sendStatus(404);
		return res.json(results);
	} catch (error) {
		logger.error(error);
		return res.sendStatus(400);
	}
};

const getChunksHandler = async (req: Request, res: Response) => {
	try {
		const settings = await getVectorData(req.query.botId as string);
		return res.json(settings || {});
	} catch (error) {
		logger.error(error);
		return res.sendStatus(400);
	}
};
