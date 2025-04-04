import mongoose from 'mongoose';
import { chatGptDefaults, LogLevels } from '../constants';
import { LogLevel } from '../services/logger';

const globalOpenAiKey = process.env.GLOBAL_OPEN_AI_KEY || '';

interface LogEntry extends Document {
	logLevel: LogLevel;
	[key: string]: any;
  }

const SettingsSchema = new mongoose.Schema<LogEntry>({
	openAiKey: { type: String, required: false, default: globalOpenAiKey },
	customChatGptModel: { type: Boolean, required: false, default: false },
	chatGptModel: {
		type: String,
		required: false,
		default: chatGptDefaults.model
	},
	atlasPublicKey: { type: String, required: false, default: '' },
	atlasPrivateKey: { type: String, required: false, default: '' },
	atlasProjectId: { type: String, required: false, default: '' },
	atlasCluster: { type: String, required: false, default: '' },
	atlasDatabase: { type: String, required: false, default: '' },
	hasVectorDataSearchIndex: { type: Boolean, required: false, default: false },
	logLevel: {type: String, required: true, default: LogLevels.Info}
});

export const SettingsModel = mongoose.model<LogEntry>('Settings', SettingsSchema);

export const getSettings = async () => {
	const settings = await SettingsModel.findOne();
	return settings;
};
export const updateSettings = async (values: Record<string, any>) => {
	const currentCollection = await SettingsModel.findOne().lean();
	if (!currentCollection) {
		return await new SettingsModel(values).save().then(data => data.toObject());
	}
	return SettingsModel.findOneAndUpdate(values);
};
