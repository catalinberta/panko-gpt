import mongoose from 'mongoose';
import { DiscordBotConfig } from '../types';
import { BaseConfigSchema, updateKnowledgebase } from '../../../models/BaseConfig';

const DiscordConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	botName: { type: String, required: true },
	botKey: { type: String, required: true },
	clientId: { type: String, required: false },
	botStatusText: { type: String, required: false }
});

export const DiscordConfigModel = mongoose.model('DiscordConfig', DiscordConfigSchema);

const changeStream = DiscordConfigModel.watch();
changeStream.on('change', async function (change) {
	const config = await DiscordConfigModel.findById(change.documentKey._id);
	if (change.updateDescription && change.updateDescription.updatedFields.knowledgebase !== undefined) {
		updateKnowledgebase(
			change.documentKey._id,
			change.updateDescription.updatedFields.knowledgebase,
			//@ts-ignore
			config?.openAiKey
		);
	}
});

export const getDiscordConfigs = (): Promise<DiscordBotConfig[]> => DiscordConfigModel.find().lean();
export const getDiscordConfigById = (id: string): Promise<DiscordBotConfig | null> => DiscordConfigModel.findById(id);
export const createDiscordConfig = (values: Record<string, any>): Promise<DiscordBotConfig> =>
	new DiscordConfigModel(values).save().then(user => user.toObject());
export const deleteDiscordConfigById = (_id: string) => DiscordConfigModel.findOneAndDelete({ _id });
export const updateDiscordConfigById = (id: string, values: Record<string, any>): Promise<DiscordBotConfig | null> =>
	DiscordConfigModel.findByIdAndUpdate(id, values, { new: true });
