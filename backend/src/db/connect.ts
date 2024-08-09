import { updateSettings } from './Settings'
import connectToMongoDB from '../services/mongodb'
import { sleep } from '../utils'
import { atlasDefaults } from '../constants'

const dbMaxAttempts = 10
const attemptDuration = 3000
let dbCurrentAttempts = 0

export const connectToDb = async (mongoDbUrl: string) => {
	await sleep(attemptDuration)
	const dbName = process.env.MONGO_ATLAS_DB_NAME || atlasDefaults.databaseName
	const clusterName =
		process.env.MONGO_ATLAS_CLUSTER_NAME || atlasDefaults.clusterName
	try {
		dbCurrentAttempts++
		if (dbCurrentAttempts <= dbMaxAttempts) {
			await connectToMongoDB(mongoDbUrl, dbName)
			await updateSettings({
				atlasPublicKey: process.env.MONGO_ATLAS_PUBLIC_KEY,
				atlasPrivateKey: process.env.MONGO_ATLAS_PRIVATE_KEY,
				atlasProjectId: process.env.MONGO_ATLAS_PROJECT_ID,
				atlasCluster: clusterName,
				atlasDatabase: dbName
			})
			console.log('Using database:', dbName)
		} else {
			console.error(
				`Could not connect to MongoDB after ${dbMaxAttempts} attempts. Exiting...`
			)
			process.exit(1)
		}
		console.log('Server ready!')
	} catch (e: any) {
		if (dbCurrentAttempts === dbMaxAttempts) {
			console.error('Max attempts reached. Error:', e)
		}
		console.log(
			`Retrying to connect to MongoDB after ${attemptDuration} ms. Attempt ${dbCurrentAttempts}/${dbMaxAttempts}. Error: ${e?.message}	`
		)

		await connectToDb(mongoDbUrl)
	}
}