import mongoose from 'mongoose';
import { LogLevel } from '../services/logger';

interface LogEntry extends Document {
	logLevel: LogLevel;
	[key: string]: any;
}

const ReminderSchema = new mongoose.Schema<LogEntry>({
	createdAt: { type: Date, required: true },
	dueAt: { type: Date, required: true },
	platform: { type: String, required: true },
	companionId: { type: String, required: true },
	serverId: { type: String, required: true },
	channelId: { type: String, required: true },
	userId: {
		type: String,
		required: true
	},
	userName: {
		type: String,
		required: true
	},
	message: { type: String, required: true },
	completed: { type: Boolean, required: false, default: false }
});

export const ReminderModel = mongoose.model<LogEntry>('Reminders', ReminderSchema);

export const getAllReminders = () => ReminderModel.find({ completed: false }).lean();
export const getServerReminders = (serverId: string) => ReminderModel.find({ serverId, completed: false }).lean();
export const getReminderById = (_id: String) => ReminderModel.findById(_id).lean();
export const removeReminderById = (_id: String) => ReminderModel.deleteOne({ _id });
export const getAllRemindersByUserName = (username: String) =>
	ReminderModel.find({ userName: username, completed: false }).lean();
export const addReminder = (values: Record<string, any>) =>
	new ReminderModel(values).save().then(data => data.toObject());
export const updateReminder = (_id: String, values: Record<string, any>) =>
	ReminderModel.findById(_id).updateOne(values);
