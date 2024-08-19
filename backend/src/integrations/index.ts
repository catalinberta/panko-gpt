import discord from './discord'
import telegram from './telegram'
import whatsapp from './whatsapp'

const integrations = () => {
	discord()
	telegram()
	whatsapp();
}

export default integrations
