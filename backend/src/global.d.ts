import { DiscordBotConfig } from './integrations/discord/types'
import { TelegramBotConfig } from './integrations/telegram/types'

export type BotConfig = DiscordBotConfig | TelegramBotConfig
