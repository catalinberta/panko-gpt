export const atlasDefaults = {
	username: 'pankogpt',
	roleName: 'pankogpt',
	databaseName: 'pankogpt',
	clusterName: 'pankogpt',
	indexName: 'pankogpt',
	vectorsCollectionName: 'vectordatas'
};

export const chatGptDefaults = {
	model: 'gpt-5',
	smallModel: 'gpt-5-mini'
};

export enum Platforms {
	Discord = 'Discord',
	Telegram = 'Telegram',
	Whatsapp = 'Whatsapp'
}

export enum LogLevels {
	Error = 'error',
	Warn = 'warn',
	Info = 'info',
	Http = 'http',
	Verbose = 'verbose',
	Debug = 'debug',
	Silly = 'silly'
}
