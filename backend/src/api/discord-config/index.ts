import express from 'express';
import {
	getDiscordConfigsController,
	getDiscordConfigByIdController,
	createDiscordConfigController,
	updateDiscordConfigController,
	deleteDiscordConfigByIdController
} from '../../integrations/discord/controllers';

export default (router: express.Router) => {
	router.get('/discord-configs', getDiscordConfigsController);
	router.get('/discord-configs/:id', getDiscordConfigByIdController);
	router.post('/discord-configs', createDiscordConfigController);
	router.patch('/discord-configs/:id', updateDiscordConfigController);
	router.delete('/discord-configs/:id', deleteDiscordConfigByIdController);
};
