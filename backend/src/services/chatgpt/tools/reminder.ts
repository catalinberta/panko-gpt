import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
	addReminder,
	getServerReminders,
	getReminderById,
	removeReminderById,
	updateReminder
} from '../../../models/Reminder';
import { Platforms } from '../../../constants';
import logger from '../../logger';

const schema = z.object({
	createdAt: z
		.string()
		.min(1, { message: 'createdAt is required' })
		.describe('Current Full Date with hour for reminder'),
	dueAt: z
		.string()
		.min(1, { message: 'dueAt is required' })
		.describe(
			"User's current timezone converted to Full Date in UTC. e.g. if user is from Germany, than we subtract 1h to get UTC"
		),
	message: z.string().min(1, { message: 'message is required' }).describe('Description of the reminder'),
	companionId: z.string().optional().default('').describe('Optional, companionId is post-added'),
	platform: z
		.string()
		.min(1, { message: 'Platform is required' })
		.describe(`Platform user is asking reminder on, can be ${Platforms.Discord} or ${Platforms.Telegram}`),
	serverId: z.string().min(1, { message: 'serverId is required' }).describe('Server unique ID'),
	channelId: z.string().min(1, { message: 'channelId is required' }).describe('Channel unique ID'),
	userId: z.string().min(1, { message: 'userId is required' }).describe('User unique ID'),
	userName: z.string().min(1, { message: 'userName is required' }).describe('User name'),
	completed: z.boolean().describe('Whether reminder has been completed')
});
const schemaExtendedWithId = schema.extend({
	_id: z.string().describe('_id from existing entry.')
});
const schemaId = z.object({
	_id: z.string().describe('_id property from the getAllReminders or getRemindersById tools')
});
const schemaServer = z.object({
	serverId: z.string().min(1, { message: 'serverId is required' }).describe('Server unique ID')
});
const getAllRemindersFormatted = async ({ serverId }: any) => {
	let reminders;

	try {
		reminders = await getServerReminders(serverId);
	} catch (e) {
		logger.error(e);
		return `Error adding reminder: ${String(e)}`;
	}
	if (!reminders.length) return 'No reminders found.';
	return JSON.stringify(reminders);
};

const getReminderByIdFormatted = async ({ _id }: z.infer<typeof schemaExtendedWithId>) => {
	let reminder;
	try {
		reminder = await getReminderById(_id);
	} catch (e) {
		logger.error(e);
	}
	return JSON.stringify(reminder);
};

const updateReminderFormatted = async (props: z.infer<typeof schemaExtendedWithId>) => {
	try {
		await updateReminder(props._id, props);
	} catch (e) {
		logger.error(e);
		return `Error updating reminder: ${String(e)}`;
	}
	return `Reminder with id ${props._id} updated.`;
};

const addReminderFormatted = async (configId: string, props: z.infer<typeof schema>) => {
	props.companionId = configId;
	let response;
	try {
		logger.silly(`Adding reminder: ${JSON.stringify(props)}`);
		response = await addReminder(props);
	} catch (e) {
		logger.error(e);
		return `Error adding reminder: ${String(e)}`;
	}
	return `Reminder added for ${props.userName} with _id ${response._id}.`;
};

const removeReminderByIdFormatted = async ({ _id }: z.infer<typeof schemaId>) => {
	try {
		await removeReminderById(_id);
	} catch (e) {
		logger.error(e);
		return String(e);
	}
	return 'Reminded removed';
};

export const getAllRemindersTool = () =>
	tool(getAllRemindersFormatted, {
		name: 'getAllReminders',
		description:
			"Get a list of all reminders with value of _id property included in the response and the time converted to user's timezone e.g. if user is from Germany, then we add 1h.",
		schema: schemaServer
	});

export const getReminderByIdTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for getReminderById';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return getReminderByIdFormatted(parseResult.data);
		},
		{
			name: 'getReminderById',
			description: 'Get a reminder by _id that always includes the _id value in the response',
			schema: schemaExtendedWithId
		}
	);

export const addReminderTool = (configId: string) =>
	tool(
		async (input: unknown) => {
			const parseResult = schema.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for addReminderTool:';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return addReminderFormatted(configId, parseResult.data);
		},
		{
			name: 'addReminder',
			description:
				'Add a new reminder if the user explicitly requests it (e.g., using phrases like "add a reminder for", "create a reminder at", or "set a reminder"). Do not call this for vague mentions of dates, times, or events without clear intent to create one. Always include a descriptive title or note if provided; default to a generic one if not.',
			schema
		}
	);
export const updateReminderTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for updateReminderTool';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return updateReminderFormatted(parseResult.data);
		},
		{
			name: 'updateReminder',
			description:
				"Update an existing reminder ONLY if the user explicitly requests changes (e.g., 'update reminder X to...', 'change my reminder for...",
			schema: schemaExtendedWithId
		}
	);
export const removeReminderTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for removeReminderTool';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return removeReminderByIdFormatted(parseResult.data);
		},
		{
			name: 'removeReminder',
			description:
				"Remove a reminder ONLY if the user explicitly asks to delete it (e.g., 'delete reminder ID X', 'remove my reminder for...",
			schema: schemaId
		}
	);
