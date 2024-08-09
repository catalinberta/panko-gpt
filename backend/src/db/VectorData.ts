import mongoose, { Document } from 'mongoose'
import { atlasDefaults } from '../constants'

const VectorDataSchema = new mongoose.Schema({
	botId: { type: String, required: true },
	content: { type: String, required: true },
	content_embedding: { type: Array, required: true },
	tokens: { type: Number, required: true }
})

export const VectorDataModel = mongoose.model('VectorData', VectorDataSchema)

export const getVectorData = (botId: string) =>
	VectorDataModel.find({ botId }).lean()
export const insertVectorData = (values: Record<string, any>) =>
	new VectorDataModel(values).save().then(data => data.toObject())
export const deleteVectorDataByBotId = (botId: string) =>
	VectorDataModel.deleteMany({ botId })

export const searchVectorData = async (embedding: number[], botId: string) => {
	const workflowData: Array<Document> = await VectorDataModel.aggregate([
		{
			$vectorSearch: {
				queryVector: embedding,
				path: 'content_embedding',
				numCandidates: 10,
				limit: 5,
				index: atlasDefaults.indexName,
				filter: { botId: String(botId) }
			}
		},
		{
			$project: {
				_id: 0,
				content: 1,
				tokens: 1,
				score: { $meta: 'vectorSearchScore' }
			}
		}
	])
	return workflowData
}
