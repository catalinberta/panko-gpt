import express, { Request, Response } from 'express';
import { getSettings } from '../../models/Settings';
import { chatGptDefaults } from '../../constants';
import * as https from 'https';
import logger from '../../services/logger';

export default (router: express.Router) => {
	router.get('/chatgpt-models', getChatGptModels);
};

const getChatGptModels = async (req: Request, res: Response) => {
	try {
		const settings = await getSettings();

		if (!settings?.openAiKey) {
			res.json([chatGptDefaults.model]);
			return;
		}

		const apiKey = settings?.openAiKey;
		getModelsFromOpenAI(apiKey, models => {
			const parsedGptModels = models.filter(model => model.id.startsWith('gpt'));
			const orderedGptModels = parsedGptModels.sort((a, b) => b.created - a.created);
			const parsedGptModelIds = orderedGptModels.map(model => model.id);

			res.json(parsedGptModelIds);
		});
	} catch (error) {
		logger.error(error);
		return res.sendStatus(400);
	}
};

interface OpenAIModel {
	id: string;
	object: string;
	created: number;
	owned_by: string;
}

const getModelsFromOpenAI = (apiKey: string, cb: (models: OpenAIModel[]) => void) => {
	const options = {
		hostname: 'api.openai.com',
		path: '/v1/models',
		method: 'GET',
		headers: {
			Authorization: `Bearer ${apiKey}`
		}
	};

	const req = https.request(options, res => {
		let response = '';

		res.on('data', (chunk: string) => {
			response += chunk;
		});
		res.on('end', () => {
			const error = JSON.parse(response).error;
			const defaultResponse = [{
				id: chatGptDefaults.model,
				object: 'model',
				created: Date.now(),
				owned_by: ''
			}]
			if(error) {
				logger.error(`Error fetching openai models: ${error.message}`);
				cb(defaultResponse)
			}else {
				cb(JSON.parse(response).data);
			}
		});
	});

	req.on('error', (e: Error) => {
		logger.error(`Error with openai models request: ${e.message}`);
	});

	req.end();
};
