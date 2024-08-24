export interface Settings {
	openAiKey?: string
	atlasPublicKey?: string
	atlasPrivateKey?: string
	atlasProjectId?: string
	atlasCluster?: string
	hasVectorDataSearchIndex?: boolean
}

export interface DiscordConfig {
	_id: string
	clientId?: string
	botName: string
	key: string
	enabled: boolean
	context: string
	internalName?: string
	botStatusText?: string
	detectLanguages?: string[]
	hasVectorSearchIndex?: boolean
}
export interface TelegramConfig {
	_id: string
	botName: string
	key: string
	enabled: boolean
	context: string
	internalName?: string
	botStatusText?: string
	detectLanguages?: string[]
}
export interface WhatsappConfig {
	_id: string
	botName: string
	key: string
	enabled: boolean
	context: string
	onlyContacts: boolean;
	internalName?: string
	botStatusText?: string
	detectLanguages?: string[]
	linked: boolean;
	qrcode?: string;
}

export interface AtlasSearchIndexDefinition {
	collectionName: string
	database: string
	indexID: string
	mappings: { dynamic: boolean; fields: object }
	name: string
	status: 'IN_PROGRESS' | 'STEADY' | 'FAILED' | 'MIGRATING'
	synonyms: []
}
