import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import apiClient from '../../services/api'
import { DiscordConfig, TelegramConfig, WhatsappConfig } from '../../services/api/types'
import ApiPaths from '../../constants/ApiPaths'
import SideMenu from '../../components/side-menu'
import {
	ChatBubbleLeftIcon,
	ChatBubbleOvalLeftIcon,
	EnvelopeIcon,
	PaperAirplaneIcon,
	PhoneIcon
} from '@heroicons/react/24/outline'
import RoutePaths from '../../constants/RoutePaths'

const Integrations = () => {
	const params = useParams()
	const navigate = useNavigate()
	const [configs, setConfigs] = useState<DiscordConfig[]>([])
	const integrationName = params.id || 'discord'

	const formSteps = useMemo(
		() => [
			{
				value: 'discord',
				label: 'Discord',
				icon: <ChatBubbleLeftIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Integrations}/discord`,
				isActive: integrationName === 'discord'
			},
			{
				value: 'telegram',
				label: 'Telegram',
				icon: <PaperAirplaneIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Integrations}/telegram`,
				isActive: integrationName === 'telegram'
			},
			{
				value: 'whatsapp',
				label: 'WhatsApp',
				icon: <PhoneIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Integrations}/whatsapp`,
				isActive: integrationName === 'whatsapp'
			},
			{
				value: 'messenger',
				label: 'Messenger',
				icon: <ChatBubbleOvalLeftIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Integrations}/telegram`,
				soon: true
			},
			{
				value: 'outlook',
				label: 'Outlook',
				icon: <EnvelopeIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Integrations}/telegram`,
				soon: true
			}
		],
		[integrationName]
	)

	useEffect(() => {
		if (!params.id || params.id === 'discord') {
			apiClient
				.get<DiscordConfig[]>(ApiPaths.DiscordConfigs)
				.then(response => {
					setConfigs(response.data)
				})
				.catch(error => {
					console.error('Error:', error)
				})
			return
		}

		if (params.id === 'discord') {
			apiClient
				.get<DiscordConfig[]>(ApiPaths.DiscordConfigs)
				.then(response => {
					setConfigs(response.data)
				})
				.catch(error => {
					console.error('Error:', error)
				})
		}
		if (params.id === 'telegram') {
			apiClient
				.get<TelegramConfig[]>(ApiPaths.TelegramConfigs)
				.then(response => {
					setConfigs(response.data)
				})
				.catch(error => {
					console.error('Error:', error)
				})
		}
		if (params.id === 'whatsapp') {
			apiClient
				.get<WhatsappConfig[]>(ApiPaths.WhatsappConfigs)
				.then(response => {
					setConfigs(response.data)
				})
				.catch(error => {
					console.error('Error:', error)
				})
		}
	}, [params.id])

	return typeof configs !== 'object' ? (
		<></>
	) : (
		<div className="flex flex-row flex-wrap py-4">
			<SideMenu steps={formSteps} />
			<div className="relative flex flex-col overflow-x-auto sm:rounded-lg w-full sm:w-2/3 md:w-3/4">
				<table className="w-full shadow-md text-sm text-left rtl:text-right text-gray-400">
					<thead className="text-xs uppercase bg-gray-700 text-gray-400">
						<tr>
							<th scope="col" className="px-3 py-3 w-0"></th>

							<th scope="col" className="px-1 py-3 w-0">
								Name
							</th>
							<th scope="col" className="px-6 py-3">
								Id
							</th>
							<th scope="col" className="px-6 py-3  text-right">
								Action
							</th>
						</tr>
					</thead>
					<tbody>
						{configs.map((config, index) => (
							<tr
								key={index}
								className="border-b bg-gray-800 border-gray-700 hover:bg-gray-600"
							>
								<td className="px-4 py-4">
									<span className="sr-only">Status</span>
									{config.enabled ? (
										<div className="w-4 h-4 text-xs font-bold  bg-green-500 border-2 rounded-full border-green-900"></div>
									) : (
										<div className="w-4 h-4 text-xs font-bold  bg-red-500 border-2 rounded-full border-red-900"></div>
									)}
								</td>
								<th
									scope="row"
									className="px-1 py-4 font-medium whitespace-nowrap text-white"
								>
									{config.internalName || config.botName}
								</th>
								<td className="px-6 py-4">{config._id}</td>
								<td className="px-6 py-4 text-right">
									<button
										type="button"
										onClick={() => {
											if (!params.id || params.id === 'discord')
												navigate(`/discord-bot-form/${config._id}`)
											params.id === 'telegram' &&
												navigate(`/telegram-bot-form/${config._id}`)
											params.id === 'whatsapp' &&
												navigate(`/whatsapp-bot-form/${config._id}`)
										}}
										className="text-gray-900 bg-gradient-to-r bg-yellow-300 hover:bg-yellow-200 focus:ring-4 focus:outline-none focus:ring-transparent shadow-lg rounded-md px-3 py-1 text-center"
									>
										View
									</button>
								</td>
							</tr>
						))}
						{!configs.length && (
							<tr className="bg-gray-800 border-b  border-gray-700 hover:bg-gray-600">
								<td colSpan={4}>
									<p className="text-center py-3">NO BOTS CREATED.</p>
								</td>
							</tr>
						)}
					</tbody>
				</table>
				<button
					type="button"
					onClick={() => {
						if (!params.id || params.id === 'discord') {
							navigate('/discord-bot-form')
						}
						params.id === 'telegram' && navigate('/telegram-bot-form')
						params.id === 'whatsapp' && navigate('/whatsapp-bot-form')
					}}
					className="mt-10 text-gray-900 self-center bg-gradient-to-r bg-yellow-300 hover:bg-yellow-200 focus:ring-4 focus:outline-none focus:ring-transparent shadow-lg rounded-md px-3 py-1 text-center"
				>
					{(!params.id || params.id === 'discord') && 'New Discord Bot'}
					{params.id === 'telegram' && 'New Telegram Bot'}
					{params.id === 'whatsapp' && 'New Whatsapp Bot'}
				</button>
			</div>
		</div>
	)
}

export default Integrations
