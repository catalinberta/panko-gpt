import { BaseConfig } from '../../global';

export interface WhatsappBotConfig extends BaseConfig {
	botName: string;
	linked: boolean;
	onlyContacts: boolean;
	botStatusText?: string | null;
}
