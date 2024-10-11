import express from 'express';
import {
	getTelegramConfigsController,
	getTelegramConfigByIdController,
	createTelegramConfigController,
	updateTelegramConfigController,
	deleteTelegramConfigByIdController
} from '../../integrations/telegram/controllers';

export default (router: express.Router) => {
	router.get('/telegram-configs', getTelegramConfigsController);
	router.get('/telegram-configs/:id', getTelegramConfigByIdController);
	router.post('/telegram-configs', createTelegramConfigController);
	router.patch('/telegram-configs/:id', updateTelegramConfigController);
	router.delete('/telegram-configs/:id', deleteTelegramConfigByIdController);
};
