import { BaseConfig } from "../../global"

export interface TelegramBotConfig extends BaseConfig {
	botName: string
	botKey: string
	botStatusText?: string | null
}
