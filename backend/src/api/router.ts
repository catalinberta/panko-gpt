import express from 'express';

const router = express.Router();
import discordConfigs from './discord-config';
import telegramConfigs from './telegram-config';
import whatsappConfigs from './whatsapp-config';
import vectorData from './vector-data';
import settings from './settings';
import atlas from './atlas';
import openai from './openai';

export default (): express.Router => {
	settings(router);
	atlas(router);
	vectorData(router);
	discordConfigs(router);
	telegramConfigs(router);
	whatsappConfigs(router);
	openai(router);
	return router;
};
