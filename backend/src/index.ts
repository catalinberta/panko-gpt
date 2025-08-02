import integrations from './integrations';
import express from 'express';
import http from 'http';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import cors from 'cors';
import router from './api/router';
import path from 'path';
import atlasConfigurator, { configureIndex } from './services/mongodb/atlasConfigurator';
import { connectToDb } from './db/connect';
import { hideCredentialsFromMongoDbUrl } from './utils';
import logger, { setLogLevel } from './services/logger';
import { getSettings } from './models/Settings';

const app = express();

app.use(
	cors({
		credentials: true
	})
);

app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use('/api', router());

const pathToFrontend = path.join(__dirname, '../../frontend/dist');
app.use(express.static(pathToFrontend));
app.use((req, res, next) => {
	if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
		next();
	} else {
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
		res.header('Expires', '-1');
		res.header('Pragma', 'no-cache');
		res.sendFile(path.join(pathToFrontend, 'index.html'));
	}
});

process.on('unhandledRejection', (reason: Error, promise) => {
	if (reason.name === 'ProtocolError') {
		logger.error(`Unhandled ProtocolError: ${reason.message}`);
	} else {
		logger.error(`Unhandled Rejection at: ${promise} | reason: ${reason}`);
	}
});

const server = http.createServer(app);
const serverPort = 5004;

server.listen(serverPort, () => {
	logger.info(`API running on http://localhost:${serverPort}`);
});

const init = async () => {
	const settings = await getSettings();
	setLogLevel(settings?.logLevel!);
};

(async () => {
	try {
		const mongoDbUrl = await atlasConfigurator();
		if (!mongoDbUrl) {
			logger.error('Could not get MongoDB URL');
			return;
		}
		logger.info(`Connecting to MongoDB URL ${hideCredentialsFromMongoDbUrl(mongoDbUrl)}`);
		await connectToDb(mongoDbUrl);
	} catch (e) {
		logger.error(`Failed to connect to MongoDB Atlas. ${e}. Exiting...`);
		process.exit(1);
	}
	init();
	integrations();
	await configureIndex();
})();
