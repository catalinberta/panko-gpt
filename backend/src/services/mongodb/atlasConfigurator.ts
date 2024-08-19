import 'dotenv/config'
import atlasClient, { AtlasClient } from 'mongodb-atlas-api-client'
import { atlasDefaults } from '../../constants'
import { createAtlasSearchIndex, getAtlasSearchIndex } from '.'
import { updateSettings } from '../../db/Settings'

const atlasConfigurator = async (): Promise<string | undefined> => {
	console.log('Init Atlas Configurator')
	const client = atlasClient({
		publicKey: process.env.MONGO_ATLAS_PUBLIC_KEY!,
		privateKey: process.env.MONGO_ATLAS_PRIVATE_KEY!,
		projectId: process.env.MONGO_ATLAS_PROJECT_ID!,
		baseUrl: 'https://cloud.mongodb.com/api/atlas/v1.0'
	})

	const usersResponse = await client.user.getAll()
	if ('error' in usersResponse) {
		console.error(
			'Atlas API Error - Could not get all users',
			usersResponse.error
		)
		return
	}
	let pankoUsername = usersResponse.results.find(
		result => result.username === atlasDefaults.username
	)
	if (!pankoUsername) {
		console.error('No username found. Creating...')

		const username = await createUsername(client)
		console.log('Created username:', username)
	} else {
		updateUsername(client)
	}
	const usernameResponse = await getUsername(client)
	if ('error' in usernameResponse) {
		console.error(
			`Could not get ${atlasDefaults.username} username data`,
			usernameResponse.error
		)
		return
	}
	console.log('Username found:', usernameResponse.username)
	const customClusterName = process.env.MONGO_ATLAS_CLUSTER_NAME
	const clustersResponse = await client.cluster.getAll()
	let cluster
	if ('error' in clustersResponse) {
		console.error(
			`Atlas API Error - Could not get clusters`,
			clustersResponse.error
		)
		return
	}
	const clusters = clustersResponse.results
	if (customClusterName) {
		cluster = clusters.find(cluster => cluster.name === customClusterName)
		if (!cluster) {
			console.error(
				`Atlas API Error - Could not find cluster ${customClusterName}. Please ensure you specified the correct atlas cluster name`
			)
			return
		}
		console.log('Using specified cluster:', customClusterName)
	} else {
		if (clusters.length) {
			cluster = clusters[0]
			console.log('Using first available cluster:', cluster.name)
		} else {
			console.error(
				'No clusters found. Please create a cluster in the Atlas account first.'
			)
			return
		}
	}
	const clusterUrl = cluster.srvAddress.replace('mongodb+srv://', '')
	return `mongodb+srv://${usernameResponse.username}:${process.env.MONGO_ATLAS_PRIVATE_KEY}@${clusterUrl}/?retryWrites=true&w=majority&appName=${cluster.name}`
}

const getUsername = async (client: AtlasClient) => {
	return await client.user.get(atlasDefaults.username)
}

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
	})
}

const updateUsername = async (client: AtlasClient) => {
	return await client.user.update(atlasDefaults.username, {
		password: process.env.MONGO_ATLAS_PRIVATE_KEY
	})
}

export const configureIndex = async () => {
	let index = await getAtlasSearchIndex()

	if (!index) {
		console.log('No index found, creating one...')
		index = await createAtlasSearchIndex()
	}
	if ('error' in index) {
		updateSettings({hasVectorDataSearchIndex: false})
		console.error('Could not create panko index:', index)
		return
	} else if(index) {
		updateSettings({hasVectorDataSearchIndex: true});
		console.log('Using index:', index.name)
	} else {
		updateSettings({hasVectorDataSearchIndex: false});
	}
	return index
}

export default atlasConfigurator
