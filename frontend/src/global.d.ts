export interface LabelValueObject {
	label: string;
	value: string;
}

export type CompanionConfig = DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig;

declare global {
	interface Window {
		__ENV__?: {
			API_URL?: string;
		};
	}
}
