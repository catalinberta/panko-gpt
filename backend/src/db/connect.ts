import { updateSettings } from '../models/Settings';
import connectToMongoDB from '../services/mongodb';
import { sleep } from '../utils';
import { atlasDefaults } from '../constants';
import logger from '../services/logger';

const dbMaxAttempts = 10;
const attemptDuration = 3000;
let dbCurrentAttempts = 0;

export const connectToDb = async (mongoDbUrl: string) => {
	await sleep(attemptDuration);
	const dbName = process.env.MONGO_ATLAS_DB_NAME || atlasDefaults.databaseName;
	const clusterName = process.env.MONGO_ATLAS_CLUSTER_NAME || atlasDefaults.clusterName;
	try {
		dbCurrentAttempts++;
		if (dbCurrentAttempts <= dbMaxAttempts) {
			try {
				await connectToMongoDB(mongoDbUrl, dbName);
				await updateSettings({
					atlasPublicKey: process.env.MONGO_ATLAS_PUBLIC_KEY,
					atlasPrivateKey: process.env.MONGO_ATLAS_PRIVATE_KEY,
					atlasProjectId: process.env.MONGO_ATLAS_PROJECT_ID,
					atlasCluster: clusterName,
					atlasDatabase: dbName
				});
				logger.info(`Using database: ${dbName}`);
			} catch (e) {
				logger.error(`Error connecting to MongoDB: ${e}`);
				process.exit(1);
			}
		} else {
			logger.error(`Could not connect to MongoDB after ${dbMaxAttempts} attempts. Exiting...`);
			process.exit(1);
		}
		logger.info('Server ready!');
	} catch (e: any) {
		if (dbCurrentAttempts === dbMaxAttempts) {
			logger.error(`Max attempts reached. Error: ${e}` );
		}
		logger.info(
			`Retrying to connect to MongoDB after ${attemptDuration} ms. Attempt ${dbCurrentAttempts}/${dbMaxAttempts}. Error: ${e?.message}`
		);

		await connectToDb(mongoDbUrl);
	}
};
