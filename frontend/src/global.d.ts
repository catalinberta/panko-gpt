export interface LabelValueObject {
	label: string;
	value: string;
}

export type BotConfig = DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig;
