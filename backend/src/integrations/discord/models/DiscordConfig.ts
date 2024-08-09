import mongoose from 'mongoose'
import { DiscordBotConfig } from '../types'
import { BaseConfigSchema, updateKnowledgebase } from '../../../db/BaseConfig'
import { migrateCollectionsToUUIDv4 } from '../../../db/migrations'

const DiscordConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	botKey: { type: String, required: true },
	clientId: { type: String, required: false },
	botStatusText: { type: String, required: false }
})

export const DiscordConfigModel = mongoose.model(
	'DiscordConfig',
	DiscordConfigSchema
)

const changeStream = DiscordConfigModel.watch()
changeStream.on('change', async function (change) {
	const config = await DiscordConfigModel.findById(change.documentKey._id)
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

export const getDiscordConfigs = () =>
	DiscordConfigModel.find().lean() as unknown as Promise<DiscordBotConfig[]>
export const getDiscordConfigById = (id: string) =>
	DiscordConfigModel.findById(id).lean() as unknown as Promise<DiscordBotConfig>
export const createDiscordConfig = (values: Record<string, any>) =>
	new DiscordConfigModel(values).save().then(user => user.toObject())
export const deleteDiscordConfigById = (_id: string) =>
	DiscordConfigModel.findOneAndDelete({ _id })
export const updateDiscordConfigById = (
	id: string,
	values: Record<string, any>
) => DiscordConfigModel.findByIdAndUpdate(id, values).lean()

migrateCollectionsToUUIDv4(DiscordConfigModel).catch(err => {
	console.error('Migration failed:', err)
})
