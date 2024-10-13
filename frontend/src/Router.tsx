import DiscordBotForm from '@screens/bot-form-discord';
import Integrations from '@screens/integrations';
import { createBrowserRouter, createRoutesFromElements, Outlet, Route } from 'react-router-dom';
import TelegramBotForm from '@screens/bot-form-telegram';
import Breadcrumbs from './components';
import Footer from '@components/footer';
import NavBar from '@components/nav-bar';
import Settings from '@screens/settings';
import WhatsappBotForm from '@screens/bot-form-whatsapp';
import apiClient from './services/api';
import { useEffect, useRef, useState } from 'react';
import ApiPaths from '@constants/ApiPaths';

const RootLayout = () => {
	const [connected, setConnected] = useState(false);
	const connectionInterval = useRef(0);
	useEffect(() => {
		if (connectionInterval.current) return;
		connectionInterval.current = setInterval(() => {
			apiClient.get(`${ApiPaths.Settings}`).then(() => {
				clearInterval(connectionInterval.current);
				setConnected(true);
			});
		}, 2000);
	}, []);

	return (
		<>
			<NavBar />
			{connected ? (
				<>
					<Breadcrumbs />
					<div className="container flex flex-1 flex-col mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
						<Outlet />
					</div>
				</>
			) : (
				<div className="flex flex-1 align-center items-center flex-col justify-center">
					<div
						className="inline-block self-center m-10 h-16 w-16 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
						role="status"
					>
						<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
					</div>
					<p className="text-lg">Connecting to database</p>
				</div>
			)}
			<Footer />
		</>
	);
};

export const Router = createBrowserRouter(
	createRoutesFromElements(
		<Route path="/" element={<RootLayout />}>
			<Route index element={<Integrations />} />
			<Route index path="/settings/:category?" element={<Settings />} />
			<Route index path="/integrations/:id?" element={<Integrations />} />
			<Route index path="/discord-bot-form/:id?/:form-step?" element={<DiscordBotForm />} />
			<Route index path="/telegram-bot-form/:id?/:form-step?" element={<TelegramBotForm />} />
			<Route index path="/whatsapp-bot-form/:id?/:form-step?" element={<WhatsappBotForm />} />
		</Route>
	)
);

export default Router;
