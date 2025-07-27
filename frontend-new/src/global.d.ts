export interface LabelValueObject {
	label: string;
	value: string;
}

export type CompanionConfig = DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig;
