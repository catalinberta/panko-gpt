import mongoose from 'mongoose'
import { TelegramBotConfig } from '../../../integrations/telegram/types'
import { BaseConfigSchema, updateKnowledgebase } from '../../../db/BaseConfig'
import { migrateCollectionsToUUIDv4 } from '../../../db/migrations'
const TelegramConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	botName: { type: String, required: true },
	botKey: { type: String, required: true }
})

export const TelegramConfigModel = mongoose.model(
	'TelegramConfig',
	TelegramConfigSchema
)

const changeStream = TelegramConfigModel.watch()
changeStream.on('change', async function (change) {
	const config = await TelegramConfigModel.findById(change.documentKey._id)
	if (
		change.updateDescription &&
		change.updateDescription.updatedFields.knowledgebase !== undefined
	) {
		updateKnowledgebase(
			change.documentKey._id,
			change.updateDescription.updatedFields.knowledgebase,
			//@ts-ignore
			config?.openAiKey
		)
	}
})

export const getTelegramConfigs = () =>
	TelegramConfigModel.find().lean() as unknown as Promise<TelegramBotConfig[]>
export const getTelegramConfigById = (id: string) =>
	TelegramConfigModel.findById(
		id
	).lean() as unknown as Promise<TelegramBotConfig>
export const createTelegramConfig = (values: Record<string, any>) =>
	new TelegramConfigModel(values).save().then(user => user.toObject())
export const deleteTelegramConfigById = (_id: string) =>
	TelegramConfigModel.findOneAndDelete({ _id })
export const updateTelegramConfigById = (
	id: string,
	values: Record<string, any>
) => TelegramConfigModel.findByIdAndUpdate(id, values)

migrateCollectionsToUUIDv4(TelegramConfigModel).catch(err => {
	console.error('Migration failed:', err)
})
