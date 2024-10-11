import express from 'express';
import {
	getWhatsappConfigsController,
	getWhatsappConfigByIdController,
	createWhatsappConfigController,
	updateWhatsappConfigController,
	deleteWhatsappConfigByIdController,
	unlinkWhatsappConfigByIdController
} from '../../integrations/whatsapp/controllers';

export default (router: express.Router) => {
	router.get('/whatsapp-configs', getWhatsappConfigsController);
	router.get('/whatsapp-configs/:id', getWhatsappConfigByIdController);
	router.post('/whatsapp-configs', createWhatsappConfigController);
	router.patch('/whatsapp-configs/:id', updateWhatsappConfigController);
	router.delete('/whatsapp-configs/:id', deleteWhatsappConfigByIdController);
	router.delete('/whatsapp-links/:id', unlinkWhatsappConfigByIdController);
};
