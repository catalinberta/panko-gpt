import mongoose from 'mongoose'
import { chatGptDefaults } from '../constants'

const globalOpenAiKey = process.env.GLOBAL_OPEN_AI_KEY || '';

const SettingsSchema = new mongoose.Schema({
	openAiKey: { type: String, required: false, default: globalOpenAiKey },
	chatGptModel: { type: String, required: false, default: chatGptDefaults.model },
	atlasPublicKey: { type: String, required: false, default: '' },
	atlasPrivateKey: { type: String, required: false, default: '' },
	atlasProjectId: { type: String, required: false, default: '' },
	atlasCluster: { type: String, required: false, default: '' },
	atlasDatabase: { type: String, required: false, default: '' },
	hasVectorDataSearchIndex: { type: Boolean, required: false, default: false }
})

export const SettingsModel = mongoose.model('Settings', SettingsSchema)

export const getSettings = async () => {
	const settings = await SettingsModel.findOne().lean()
	return settings
}
export const updateSettings = async (values: Record<string, any>) => {
	const currentCollection = await SettingsModel.findOne().lean()
	if (!currentCollection) {
		return await new SettingsModel(values).save().then(data => data.toObject())
	}
	return SettingsModel.findOneAndUpdate(values)
}
