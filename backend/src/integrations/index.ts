import discord from './discord'
import telegram from './telegram'

const integrations = () => {
	discord()
	telegram()
}

export default integrations
