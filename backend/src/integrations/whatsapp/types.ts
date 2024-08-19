export interface WhatsappBotConfig {
	_id: string
	botName: string
	internalName?: string | null
	linked: boolean
	openAiKey: string
	context: string
	botStatusText?: string | null
	enabled?: boolean | null
	detectLanguages?: string[] | null
	knowledgebase?: string
	functionInternet?: boolean;
	functionTime?: boolean;
}
