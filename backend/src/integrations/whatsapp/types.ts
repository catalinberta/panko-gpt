import { BaseConfig } from '../../global';

export interface WhatsappBotConfig extends BaseConfig {
	botName: string;
	linked: boolean;
	onlyContacts: boolean;
	contactsFilterType: string;
	contactsWhitelist: string[];
	contactsBlacklist: string[];
	botStatusText?: string | null;
}

export enum WhatsappContactsFilterType {
	ALL = 'all',
	WHITELIST = 'whitelist',
	BLACKLIST = 'blacklist'
}
