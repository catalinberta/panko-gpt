import express, { Request, Response } from 'express'
import { getSettings } from '../../db/Settings'
import { chatGptDefaults } from '../../constants'
import * as https from 'https';

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
		getModelsFromOpenAI(apiKey, models => {
			const parsedGptModels = models.filter(model => model.id.startsWith('gpt'));
			const orderedGptModels = parsedGptModels.sort((a, b) => b.created - a.created);
			const parsedGptModelIds = orderedGptModels.map(model => model.id)
			
			res.json(parsedGptModelIds);
		});
	

	} catch (error) {
		console.log(error)
		return res.sendStatus(400)
	}
}

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
			'Authorization': `Bearer ${apiKey}` // Replace `YOUR_API_KEY` with your actual OpenAI API key
		  }
	  };
	  
	  const req = https.request(options, (res) => {
		let response = '';
	  
		res.on('data', (chunk: string) => {
		  response += chunk;
		});
	  
		res.on('end', () => {
		  cb(JSON.parse(response).data)
		});
	  });
	  
	  req.on('error', (e: Error) => {
		console.error(`Problem with openai models request: ${e.message}`);
	  });
	  
	  req.end();
}