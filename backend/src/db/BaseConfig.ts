import mongoose, { Schema } from 'mongoose'
import { insertVectorData, deleteVectorDataByBotId } from './VectorData'
import {
	getEmbeddingFromString,
	parseTextToChunksArray
} from '../services/chatgpt'
import { v4 as uuidv4 } from 'uuid'
import { sleep } from '../utils'

export const BaseConfigSchema = new mongoose.Schema({
	_id: { type: Schema.Types.Mixed, default: uuidv4 },
	openAiKey: { type: String, required: true },
	chatGptModel: { type: String, required: true },
	customChatGptModel: { type: Boolean, default: false },
	context: { type: String, required: true },
	internalName: { type: String, required: false },
	knowledgebase: { type: String, required: false },
	detectLanguages: { type: Array, required: false },
	enabled: { type: Boolean, required: false },
	functionInternet: { type: Boolean, required: false, default: true },
	functionTime: { type: Boolean, required: false, default: true }
})

export const BaseConfigModel = mongoose.model('BaseConfig', BaseConfigSchema)

const changeStream = BaseConfigModel.watch()
changeStream.on('change', async function (change) {
	const config = await BaseConfigModel.findById(change.documentKey._id)
	if (
		change.updateDescription &&
		change.updateDescription.updatedFields.knowledgebase !== undefined
	) {
		updateKnowledgebase(
			change.documentKey._id,
			change.updateDescription.updatedFields.knowledgebase,
			config?.openAiKey
		)
	}
})

export const updateKnowledgebase = async (
	id: string,
	content: string,
	openAiKey?: string
) => {
	if (!id || !content || !openAiKey) return
	try {
		await deleteVectorDataByBotId(id)
		const knowledgeChunks = await parseTextToChunksArray(openAiKey, content)
		for (const knowledgeChunk of knowledgeChunks) {
			await sleep(500)
			const embeddingResponse = await getEmbeddingFromString(
				openAiKey,
				knowledgeChunk
			)
			const data = {
				botId: id,
				content: knowledgeChunk,
				content_embedding: embeddingResponse.embedding,
				tokens: embeddingResponse.tokens
			}
			await insertVectorData(data)
		}
	} catch (error) {
		console.log(error)
	}
}
