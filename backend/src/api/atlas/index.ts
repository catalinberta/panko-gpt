import express, { Request, Response } from 'express'
import { getAtlasApiClient } from '../../services/mongodb'
import { AtlasSearchIndexDefinition } from '../types'
import { GetClusterResponse } from 'mongodb-atlas-api-client'
import { getSettings, updateSettings } from '../../db/Settings'
import { atlasDefaults } from '../../constants'

export default (router: express.Router) => {
	router.get('/atlas-index', getAtlasIndexHandler)
	router.post('/atlas-index', createAtlasIndexHandler)
	router.get('/atlas-clusters', getAtlasClustersHandler)
}

const getAtlasIndexHandler = async (req: Request, res: Response) => {
	const settings = await getSettings()
	let pankoIndex: AtlasSearchIndexDefinition | false = false
	if (!settings?.atlasCluster || !settings?.atlasDatabase) {
		res.json(pankoIndex)
		return pankoIndex
	}
	const atlasApiClient = await getAtlasApiClient()
	if (!atlasApiClient) {
		res.json(pankoIndex)
		return pankoIndex
	}
	const indexes: AtlasSearchIndexDefinition[] =
		await atlasApiClient.atlasSearch.getAll(
			settings?.atlasCluster,
			settings?.atlasDatabase,
			'vectordatas'
		)
	indexes.forEach(index => {
		if (index.name === atlasDefaults.indexName) {
			pankoIndex = index
		}
	})
	res.json(pankoIndex)
}

const createAtlasIndexHandler = async (req: Request, res: Response) => {
	const settings = await getSettings()
	if (!settings?.atlasCluster) {
		res.json({ error: 'No atlas cluster supplied' })
		return
	}
	if (!settings?.atlasDatabase) {
		res.json({ error: 'No atlas database supplied' })
		return
	}

	const atlasApiClient = await getAtlasApiClient()
	if (!atlasApiClient) {
		res.json({ error: 'Could not get atlas client' })
		return
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
	}
	try {
		const index = await atlasApiClient.atlasSearch.create(
			settings?.atlasCluster!,
			indexBody
		)
		updateSettings({ hasVectorDataSearchIndex: true })
		console.log('create atlas index - update settings true')
		res.json(index)
	} catch (e: any) {
		console.log('error create atlas index - update settings true', e)
		updateSettings({ hasVectorDataSearchIndex: false })
		res.json({ error: e.message })
	}
}
const getAtlasClustersHandler = async (req: Request, res: Response) => {
	const atlasApiClient = await getAtlasApiClient()
	if (!atlasApiClient) {
		res.status(500).json([])
		return
	}
	const response = await atlasApiClient.cluster.getAll()
	if ('error' in response) {
		console.error('Atlas API Error:', response)
		res.status(500).json([])
		return
	}
	const clusterList = response.results.map(
		(cluster: GetClusterResponse) => cluster.name
	)
	res.json(clusterList)
}
