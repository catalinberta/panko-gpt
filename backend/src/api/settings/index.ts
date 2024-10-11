import express from 'express';
import { getSettingsController, updateSettingsController } from '../../controllers/settings';

export default (router: express.Router) => {
	router.get('/settings', getSettingsController);
	router.post('/settings', updateSettingsController);
};
