import 'dotenv/config';
import atlasClient, { AtlasClient } from 'mongodb-atlas-api-client';
import { atlasDefaults } from '../../constants';
import { createAtlasSearchIndex, getAtlasSearchIndex } from '.';
import { updateSettings } from '../../models/Settings';
import mongoose from 'mongoose';

const atlasConfigurator = async (): Promise<string | undefined> => {
	console.log('Init MongoDB Atlas Configurator');
	const client = atlasClient({
		publicKey: process.env.MONGO_ATLAS_PUBLIC_KEY!,
		privateKey: process.env.MONGO_ATLAS_PRIVATE_KEY!,
		projectId: process.env.MONGO_ATLAS_PROJECT_ID!,
		baseUrl: 'https://cloud.mongodb.com/api/atlas/v1.0'
	});

	const usersResponse = await client.user.getAll();
	if ('error' in usersResponse) {
		console.error('Atlas API Error - Could not get all users', usersResponse.error);
		return;
	}
	let pankoUsername = usersResponse.results.find(result => result.username === atlasDefaults.username);
	if (!pankoUsername) {
		console.error('MongoDB: No username found. Creating...');

		const username = await createUsername(client);
		console.log('MongoDB: Created username:', username);
	} else {
		updateUsername(client);
	}
	const usernameResponse = await getUsername(client);
	if ('error' in usernameResponse) {
		console.error(`Could not get ${atlasDefaults.username} username data`, usernameResponse.error);
		return;
	}
	console.log('MongoDB: Username found:', usernameResponse.username);
	const customClusterName = process.env.MONGO_ATLAS_CLUSTER_NAME;
	const clustersResponse = await client.cluster.getAll();
	let cluster;
	if ('error' in clustersResponse) {
		console.error(`Atlas API Error - Could not get clusters`, clustersResponse.error);
		return;
	}
	const clusters = clustersResponse.results;
	if (customClusterName) {
		cluster = clusters.find(cluster => cluster.name === customClusterName);
		if (!cluster) {
			console.error(
				`Atlas API Error - Could not find cluster ${customClusterName}. Please ensure you specified the correct atlas cluster name`
			);
			return;
		}
		console.log('MongoDB: Using specified cluster:', customClusterName);
	} else {
		if (clusters.length) {
			cluster = clusters[0];
			console.log('MongoDB: Using first available cluster:', cluster.name);
		} else {
			console.error('No clusters found. Please create a cluster in the Atlas account first.');
			return;
		}
	}
	const clusterUrl = cluster.srvAddress.replace('mongodb+srv://', '');
	const mongoDbUrl = `mongodb+srv://${usernameResponse.username}:${process.env.MONGO_ATLAS_PRIVATE_KEY}@${clusterUrl}/?retryWrites=true&w=majority&appName=${cluster.name}`;
	await attemptDbConnection(mongoDbUrl, usernameResponse.username);
	return mongoDbUrl;
};

const getUsername = async (client: AtlasClient) => {
	return await client.user.get(atlasDefaults.username);
};

const createUsername = async (client: AtlasClient) => {
	return await client.user.create({
		username: atlasDefaults.username,
		password: process.env.MONGO_ATLAS_PRIVATE_KEY!,
		roles: [
			{
				roleName: 'atlasAdmin',
				databaseName: 'admin'
			}
		],
		groupId: process.env.MONGO_ATLAS_PROJECT_ID!,
		databaseName: 'admin'
	});
};

const updateUsername = async (client: AtlasClient) => {
	return await client.user.update(atlasDefaults.username, {
		password: process.env.MONGO_ATLAS_PRIVATE_KEY
	});
};

const attemptDbConnection = async (mongoDbUrl: string, username: string) => {
	return new Promise((resolve, reject) => {
		const dbName = process.env.MONGO_ATLAS_DB_NAME || atlasDefaults.databaseName;
		async function connectWithRetry(url: string, maxAttempts = 10) {
			let attempt = 0;
			const connect = async () => {
				attempt++;
				const retryTimeout = Math.min(30, Math.pow(2, attempt));
				try {
					console.log(`MongoDB: Attempt ${attempt}/${maxAttempts} to connect using username: ${username}`);
					await mongoose.connect(url, {
						dbName,
						connectTimeoutMS: 30_000,
						socketTimeoutMS: 30_000,
						maxIdleTimeMS: 30_000,
						serverSelectionTimeoutMS: 0
					});
					console.log(`MongoDB: Successfully connected using username: ${username}`);
					resolve(true);
				} catch (error) {
					if (attempt < maxAttempts) {
						console.log(
							`Attempt ${attempt}/${maxAttempts} failed with username ${username}. Reason of failure: ${error}`
						);
						console.log(`MongoDB: Retrying in ${retryTimeout} seconds...`);
						setTimeout(connect, retryTimeout * 1000);
					} else {
						reject(`All attempts to connect to db using username ${username} failed. Reason: ${error}`);
					}
				}
			};
			connect();
		}
		connectWithRetry(mongoDbUrl);
	});
};

export const configureIndex = async () => {
	let index = await getAtlasSearchIndex();

	if (!index) {
		console.log('MongoDB: No index found, creating one...');
		index = await createAtlasSearchIndex();
	}
	if ('error' in index) {
		updateSettings({ hasVectorDataSearchIndex: false });
		console.error('Could not create panko index:', index);
		return;
	} else if (index) {
		updateSettings({ hasVectorDataSearchIndex: true });
		console.log('MongoDB: Using index:', index.name);
	} else {
		updateSettings({ hasVectorDataSearchIndex: false });
	}
	return index;
};

export default atlasConfigurator;
