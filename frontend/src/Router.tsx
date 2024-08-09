import DiscordBotForm from '@screens/bot-form-discord'
import Integrations from '@screens/integrations'
import {
	createBrowserRouter,
	createRoutesFromElements,
	Outlet,
	Route
} from 'react-router-dom'
import TelegramBotForm from '@screens/bot-form-telegram'
import Breadcrumbs from './components'
import Footer from '@components/footer'
import NavBar from '@components/nav-bar'
import Settings from '@screens/settings'

const RootLayout = () => {
	return (
		<>
			<NavBar />
			<Breadcrumbs />
			<div className="container flex flex-1 flex-col mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
				<Outlet />
			</div>
			<Footer />
		</>
	)
}

export const Router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/" element={<RootLayout />}>
			<Route index element={<Integrations />} />
			<Route index path="/settings/:category?" element={<Settings />} />
			<Route index path="/integrations/:id?" element={<Integrations />} />
			<Route
				index
				path="/discord-bot-form/:id?/:form-step?"
				element={<DiscordBotForm />}
			/>
			<Route
				index
				path="/telegram-bot-form/:id?/:form-step?"
				element={<TelegramBotForm />}
			/>
		</Route>
	)
)

export default Router
