import { GetClusterResponse } from 'mongodb-atlas-api-client';
import { AtlasSearchIndexDefinition } from '../../api/types';
import { atlasDefaults } from '../../constants';
import { getSettings, updateSettings } from '../../models/Settings';
import { getAtlasApiClient } from '../../services/mongodb';
import { Request, Response } from 'express';

export const getAtlasIndexController = async (req: Request, res: Response) => {
	const settings = await getSettings();
	let pankoIndex: AtlasSearchIndexDefinition | false = false;
	if (!settings?.atlasCluster || !settings?.atlasDatabase) {
		res.json(pankoIndex);
		return pankoIndex;
	}
	const atlasApiClient = await getAtlasApiClient();
	if (!atlasApiClient) {
		res.json(pankoIndex);
		return pankoIndex;
	}
	const indexes: AtlasSearchIndexDefinition[] = await atlasApiClient.atlasSearch.getAll(
		settings?.atlasCluster,
		settings?.atlasDatabase,
		'vectordatas'
	);
	indexes.forEach(index => {
		if (index.name === atlasDefaults.indexName) {
			pankoIndex = index;
		}
	});
	res.json(pankoIndex);
};

export const createAtlasIndexController = async (req: Request, res: Response) => {
	const settings = await getSettings();
	if (!settings?.atlasCluster) {
		res.json({ error: 'No atlas cluster supplied' });
		return;
	}
	if (!settings?.atlasDatabase) {
		res.json({ error: 'No atlas database supplied' });
		return;
	}

	const atlasApiClient = await getAtlasApiClient();
	if (!atlasApiClient) {
		res.json({ error: 'Could not get atlas client' });
		return;
	}
	const indexBody = {
		name: atlasDefaults.indexName,
		collectionName: 'vectordatas',
		database: settings?.atlasDatabase,
		mappings: {
			dynamic: true,
			fields: {
				botId: {
					type: 'token'
				},
				content_embedding: {
					dimensions: 1536,
					similarity: 'cosine',
					type: 'knnVector'
				}
			}
		}
	};
	try {
		const index = await atlasApiClient.atlasSearch.create(settings?.atlasCluster!, indexBody);
		updateSettings({ hasVectorDataSearchIndex: true });
		console.log('create atlas index - update settings');
		res.json(index);
	} catch (e: any) {
		console.log('error create atlas index - update settings', e);
		updateSettings({ hasVectorDataSearchIndex: false });
		res.json({ error: e.message });
	}
};
export const getAtlasClustersController = async (req: Request, res: Response) => {
	const atlasApiClient = await getAtlasApiClient();
	if (!atlasApiClient) {
		res.status(500).json([]);
		return;
	}
	const response = await atlasApiClient.cluster.getAll();
	if ('error' in response) {
		console.error('Atlas API Error:', response);
		res.status(500).json([]);
		return;
	}
	const clusterList = response.results.map((cluster: GetClusterResponse) => cluster.name);
	res.json(clusterList);
};
