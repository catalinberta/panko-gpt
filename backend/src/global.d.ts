import { DiscordBotConfig } from './integrations/discord/types';
import { TelegramBotConfig } from './integrations/telegram/types';
import { WhatsappBotConfig } from './integrations/whatsapp/types';

export interface BaseConfig {
	_id: string;
	internalName?: string | null;
	openAiKey: string;
	chatGptModel: string;
	customChatGptModel: boolean;
	context: string;
	enabled?: boolean | null;
	detectLanguages?: string[] | null;
	knowledgebase?: string;
	functionUrlSummarizer?: boolean;
	functionSearchSummarizer?: boolean;
	functionSearchSummarizerKey?: string;
	functionReminders?: boolean;
	functionLanguageDetection?: boolean;
	functionLanguageDetectionWhitelist?: string;
}

export type BotConfig = DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig;

export interface MessageWithContext {
	message: string;
	context?: string;
}
