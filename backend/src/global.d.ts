import { DiscordBotConfig } from './integrations/discord/types'
import { TelegramBotConfig } from './integrations/telegram/types'
import { WhatsappBotConfig } from './integrations/whatsapp/types'

export type BotConfig = DiscordBotConfig | TelegramBotConfig | WhatsappBotConfig