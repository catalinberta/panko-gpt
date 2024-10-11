import { BaseConfig } from '../../global';

export interface DiscordBotConfig extends BaseConfig {
	botName: string;
	botKey: string;
	botStatusText?: string | null;
}
