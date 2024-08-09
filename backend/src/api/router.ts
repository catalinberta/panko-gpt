import express from 'express'

const router = express.Router()
import discordConfigs from './discord-config'
import telegramConfigs from './telegram-config'
import vectorData from './vector-data'
import settings from './settings'
import atlas from './atlas'

export default (): express.Router => {
	settings(router)
	atlas(router)
	vectorData(router)
	discordConfigs(router)
	telegramConfigs(router)
	return router
}
