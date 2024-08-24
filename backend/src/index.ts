import integrations from './integrations'
import express from 'express'
import http from 'http'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import compression from 'compression'
import cors from 'cors'
import router from './api/router'
import path from 'path'
import atlasConfigurator, {
	configureIndex
} from './services/mongodb/atlasConfigurator'
import { connectToDb } from './db/connect'

const isDev = process.env.NODE_ENV === 'development'
const app = express()

app.use(
	cors({
		credentials: true
	})
)

app.use(compression())
app.use(cookieParser())
app.use(bodyParser.json())
app.use('/api', router())

const pathToFrontend = path.join(
	__dirname,
	'../../frontend/dist'
)
app.use((req, res, next) => {
	if (/(.ico|.js|.css|.jpg|.png|.map)$/i.test(req.path)) {
		next()
	} else {
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate')
		res.header('Expires', '-1')
		res.header('Pragma', 'no-cache')
		res.sendFile(path.join(pathToFrontend, 'index.html'))
	}
})
app.use(express.static(pathToFrontend))

const server = http.createServer(app)
const serverPort = 5002

server.listen(serverPort, () => {
	console.log(`API running on http://localhost:${serverPort}`)
});

(async () => {
	const mongoDbUrl = await atlasConfigurator()
	if (!mongoDbUrl) {
		console.error('Could not get MongoDB URL')
		return
	}
	console.log('Using MongoDB URL', mongoDbUrl)
	await connectToDb(mongoDbUrl)
	integrations()
	await configureIndex()
})();
