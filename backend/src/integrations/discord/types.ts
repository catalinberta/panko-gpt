export interface DiscordBotConfig {
	_id: string
	botName: string
	internalName?: string | null
	botKey: string
	openAiKey: string
	context: string
	botStatusText?: string | null
	enabled?: boolean | null
	detectLanguages?: string[] | null
	knowledgebase?: string
	functionInternet?: boolean;
	functionTime?: boolean;
}
