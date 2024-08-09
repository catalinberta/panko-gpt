import { Client, Guild, Message } from "discord.js";

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
}

export const getDiscordMessage = async (client: Client, message: Message): Promise<{userMessage: string; messageWithReply: string}> => {
	const guild = await client.guilds.fetch(message.guildId!);
	const member = await guild.members.fetch(message.author.id);
	const displayName = member ? member.displayName : message.author.displayName;
	const firstTagRegex = /<[^>]+>/;
	const stripedMessage = message.content.replace(firstTagRegex, '').trim();
	const userMessage = await replaceUserIdsWithNames(`${displayName}: ${stripedMessage}`, message.guild!);

	let repliedContent = "";

	try {
		if(message.reference && message.reference.messageId) {
			const referencedMessage = await message.channel.messages.fetch(message.reference.messageId);
			if(referencedMessage.content && message.mentions.repliedUser) {
				repliedContent = `${message.mentions.repliedUser.username}: ${referencedMessage.content} | `;
			}
		}
	} catch (error) {
		console.error("Could not fetch referenced message:", error);
	}
	const messageWithReply = await replaceUserIdsWithNames(repliedContent + userMessage, message.guild!)

	return {
		userMessage,
		messageWithReply,
	}
}

export const sendDiscordTypingInterval = async (message: Message) => {
	await message.channel.sendTyping();
	const sendTypingInterval = setInterval(async() => {
		await message.channel.sendTyping();
	}, 5000);
	return sendTypingInterval;
}