import mongoose from 'mongoose'
import { WhatsappBotConfig } from '../types'
import { BaseConfigSchema, updateKnowledgebase } from '../../../db/BaseConfig'
import { migrateCollectionsToUUIDv4 } from '../../../db/migrations'
const WhatsappConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	linked: { type: Boolean, default: false },
	qrcode: { type: String, default: ''}
})

export const WhatsappConfigModel = mongoose.model(
	'WhatsappConfig',
	WhatsappConfigSchema
)

const changeStream = WhatsappConfigModel.watch()
changeStream.on('change', async function (change) {
	const config = await WhatsappConfigModel.findById(change.documentKey._id)
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

export const getWhatsappConfigs = () =>
	WhatsappConfigModel.find().lean() as unknown as Promise<WhatsappBotConfig[]>
export const getWhatsappConfigById = (id: string) =>
	WhatsappConfigModel.findById(
		id
	).lean() as unknown as Promise<WhatsappBotConfig>
export const createWhatsappConfig = (values: Record<string, any>) =>
	new WhatsappConfigModel(values).save().then(user => user.toObject())
export const deleteWhatsappConfigById = (_id: string) =>
	WhatsappConfigModel.findOneAndDelete({ _id })
export const updateWhatsappConfigById = (
	id: string,
	values: Record<string, any>
) => WhatsappConfigModel.findByIdAndUpdate(id, values)

migrateCollectionsToUUIDv4(WhatsappConfigModel).catch(err => {
	console.error('Migration failed:', err)
})
