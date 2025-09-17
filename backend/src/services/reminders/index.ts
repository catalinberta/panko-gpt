import cron from 'node-cron';
import { getAllReminders, updateReminder } from '../../models/Reminder';
import logger from '../logger';
import ClientManager from '../client-manager';
import { queryGPT } from '../chatgpt';
import { getDiscordConfigById } from '../../integrations/discord/models/DiscordConfig';
import { Platforms } from '../../constants';
import { getTelegramConfigById } from '../../integrations/telegram/models/TelegramConfig';

const sendReminder = async (reminder: any) => {
	if (reminder.platform === Platforms.Discord) {
		sendDiscordReminder(reminder);
	}
	if (reminder.platform === Platforms.Telegram) {
		sendTelegramReminder(reminder);
	}
};

const sendDiscordReminder = async (reminder: any) => {
	let config = await getDiscordConfigById(reminder.companionId);
	if (!config?.functionReminders) return;

	const defaultMessage = `<@${reminder.userId}> Reminder: ${reminder.message}`;
	const client = ClientManager.get(reminder.companionId);

	try {
		if (!config) {
			logger.error('No config found for companion id ' + reminder.companionId);
			return;
		}
		let message = '';
		try {
			const response = await queryGPT(
				config,
				{
					message: `
					- A user's reminder is now active;
					- Reminder message: ${reminder.message}; 
					- Write in a reminder format, an emoji personalized message for the user;
				`
				},
				reminder.channelId,
				undefined,
				undefined,
				undefined,
				true
			);

			message = `<@${reminder.userId}> ${response.response}`;
		} catch (e) {
			message = defaultMessage;
		}

		const channel = await client.channels.fetch(reminder.channelId);
		await channel.send(message);

		await updateReminder(reminder._id, { completed: true });
	} catch (error) {
		logger.error('Error running reminder: ' + String(error));
	}
};

const sendTelegramReminder = async (reminder: any) => {
	let config = await getTelegramConfigById(reminder.companionId);
	if (!config?.functionReminders) return;

	const defaultMessage = `@${reminder.userName} Reminder: ${reminder.message}`;
	const client = ClientManager.get(reminder.companionId);

	try {
		if (!config) {
			logger.error('No config found for companion id ' + reminder.companionId);
			return;
		}
		let message = '';
		try {
			const response = await queryGPT(
				config,
				{
					message: `
					- A user's reminder is now active;
					- Reminder message: ${reminder.message}; 
					- Write in a reminder format, an emoji personalized message for the user;
				`
				},
				reminder.channelId,
				undefined,
				undefined,
				undefined,
				true
			);

			message = `@${reminder.userName} ${response.response}`;
			if (reminder.userId === reminder.channelId) {
				message = response.response;
			}
		} catch (e) {
			message = defaultMessage;
		}

		await client.telegram.sendMessage(reminder.channelId, message);

		await updateReminder(reminder._id, { completed: true });
	} catch (error) {
		logger.error('Error running reminder: ' + String(error));
	}
};

const remindersScheduler = cron.schedule('* * * * *', async () => {
	const now = new Date();

	const reminders = await getAllReminders();

	reminders.map(reminder => {
		const reminderDate = new Date(reminder.dueAt);
		if (reminderDate < now) {
			sendReminder(reminder);
		}
	});
});

export const startRemindersScheduler = () => {
	remindersScheduler.start();
	logger.info('Reminders Scheduler Started!');
};
