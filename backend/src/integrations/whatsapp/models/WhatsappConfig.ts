import mongoose from 'mongoose';
import { WhatsappBotConfig } from '../types';
import { BaseConfigSchema, updateKnowledgebase } from '../../../models/BaseConfig';

const WhatsappConfigSchema = new mongoose.Schema({
	...BaseConfigSchema.obj,
	onlyContacts: { type: Boolean, default: false },
	linked: { type: Boolean, default: false },
	qrcode: { type: String, default: '' }
});

export const WhatsappConfigModel = mongoose.model('WhatsappConfig', WhatsappConfigSchema);

const changeStream = WhatsappConfigModel.watch();
changeStream.on('change', async function (change) {
	const config = await WhatsappConfigModel.findById(change.documentKey._id);
	if (change.updateDescription && change.updateDescription.updatedFields.knowledgebase !== undefined) {
		updateKnowledgebase(
			change.documentKey._id,
			change.updateDescription.updatedFields.knowledgebase,
			//@ts-ignore
			config?.openAiKey
		);
	}
});

export const getWhatsappConfigs = (): Promise<WhatsappBotConfig[]> => WhatsappConfigModel.find().lean();
export const getWhatsappConfigById = (id: string): Promise<WhatsappBotConfig | null> =>
	WhatsappConfigModel.findById(id).lean();
export const createWhatsappConfig = (values: Record<string, any>): Promise<WhatsappBotConfig> =>
	new WhatsappConfigModel(values).save().then(user => user.toObject());
export const deleteWhatsappConfigById = (_id: string) => WhatsappConfigModel.findOneAndDelete({ _id });
export const updateWhatsappConfigById = (id: string, values: Record<string, any>): Promise<WhatsappBotConfig | null> =>
	WhatsappConfigModel.findByIdAndUpdate(id, values, { new: true });
