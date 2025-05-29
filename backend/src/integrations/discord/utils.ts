import { Channel, Client, Guild, Message, AttachmentBuilder, MessageCreateOptions } from 'discord.js';
import logger from '../../services/logger';

export const replaceUserIdsWithNames = async (content: string, guild: Guild) => {
	const userIdRegex = /\d{17,19}/g;
	let replacedContent = content;
	const userIds = content.match(userIdRegex);
	if (userIds) {
		for (const userId of userIds) {
			const member = await guild.members.fetch(userId);
			if (member) {
				replacedContent = replacedContent.replace(`<@${userId}>`, member.displayName);
			}
		}
	}
	return replacedContent;
};

export const getDiscordMessage = async (
	client: Client,
	message: Message
): Promise<{ userMessage: string; messageWithReply: string }> => {
	const guild = await client.guilds.fetch(message.guildId!);
	const member = await guild.members.fetch(message.author.id);
	const displayName = member ? member.displayName : message.author.displayName;
	const firstTagRegex = /<[^>]+>/;
	const stripedMessage = message.content.replace(firstTagRegex, '').trim();
	const userMessage = await replaceUserIdsWithNames(`${displayName}: ${stripedMessage}`, message.guild!);

	let repliedContent = '';

	try {
		logger.silly(`Discord message: ${userMessage}`);
		if (message.reference && message.reference.messageId) {
			const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
			if (referencedMessage.content && message.mentions.repliedUser) {
				repliedContent = `${message.mentions.repliedUser.username}: ${referencedMessage.content} | `;
			}
		}
	} catch (error) {
		logger.error(`Could not fetch referenced message: ${error}`);
	}
	const messageWithReply = await replaceUserIdsWithNames(repliedContent + userMessage, message.guild!);

	return {
		userMessage,
		messageWithReply
	};
};

export const sendDiscordTypingInterval = async (message: Message) => {
	const sendTyping = async (channel: Channel) => {
		if (channel && 'sendTyping' in channel && typeof channel.sendTyping === 'function') {
			await channel.sendTyping();
		}
	};

	sendTyping(message.channel);
	const sendTypingInterval = setInterval(async () => {
		sendTyping(message.channel);
	}, 5000);

	return sendTypingInterval;
};

export function renderFullDiscordMessage(modelOutput: any): MessageCreateOptions {
	const { content, components, attachments } = modelOutput;
	logger.silly(`renderFullDiscordMessage: ${JSON.stringify(modelOutput, null, 2)}`);

	const renderedAttachments = (attachments || []).map((att: any) => new AttachmentBuilder(att.url).setName(att.name));

	const v2Components: any[] = [];

	if (content) {
		v2Components.push({
			type: 10,
			content: content
		});
	}

	return {
		// content: content,
		flags: 1 << 15, // Enable V2 components
		components: components || []
		// files: renderedAttachments
	};
}
