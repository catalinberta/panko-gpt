import mongoose from 'mongoose';
import { TelegramBotConfig } from '../../../integrations/telegram/types';
import { BaseConfigSchema, updateKnowledgebase } from '../../../models/BaseConfig';

const TelegramConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	botName: { type: String, required: true },
	botKey: { type: String, required: true }
});

export const TelegramConfigModel = mongoose.model('TelegramConfig', TelegramConfigSchema);

const changeStream = TelegramConfigModel.watch();
changeStream.on('change', async function (change) {
	const config = await TelegramConfigModel.findById(change.documentKey._id);
	if (change.updateDescription && change.updateDescription.updatedFields.knowledgebase !== undefined) {
		updateKnowledgebase(
			change.documentKey._id,
			change.updateDescription.updatedFields.knowledgebase,
			//@ts-ignore
			config?.openAiKey
		);
	}
});

export const getTelegramConfigs = (): Promise<TelegramBotConfig[]> => TelegramConfigModel.find().lean();
export const getTelegramConfigById = (id: string): Promise<TelegramBotConfig | null> =>
	TelegramConfigModel.findById(id).lean();
export const createTelegramConfig = (values: Record<string, any>): Promise<TelegramBotConfig> =>
	new TelegramConfigModel(values).save().then(user => user.toObject());
export const deleteTelegramConfigById = (_id: string) => TelegramConfigModel.findOneAndDelete({ _id });
export const updateTelegramConfigById = (id: string, values: Record<string, any>): Promise<TelegramBotConfig | null> =>
	TelegramConfigModel.findByIdAndUpdate(id, values, { new: true });
