import { Control, FieldValues, SubmitHandler, useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import ApiPaths from '../../constants/ApiPaths'
import { DiscordConfig, Settings } from '../../services/api/types'
import apiClient from '../../services/api'
import { useNavigate, useParams } from 'react-router-dom'
import { ChangeEvent, MouseEvent, ReactElement, useEffect, useMemo, useState } from 'react'
import RoutePaths from '../../constants/RoutePaths'
import {
	Cog6ToothIcon,
	CogIcon,
	RectangleStackIcon
} from '@heroicons/react/24/outline'
import SideMenu from '../../components/side-menu'
import WebpageContent from '@components/_functions/webpagecontent'
import CurrentTime from '@components/_functions/currenttime'

const schema = z.object({
	enabled: z.boolean(),
	botName: z.string().min(1),
	internalName: z.string(),
	botStatusText: z.string(),
	openAiKey: z.string().min(1),
	botKey: z.string().min(1),
	context: z.string().min(1),
	knowledgebase: z.string(),
	functionInternet: z.boolean(),
	functionTime: z.boolean()
})

type FormFields = z.infer<typeof schema>

const formDefaultValues = {
	enabled: true,
	botName: '',
	internalName: '',
	botStatusText: '',
	openAiKey: '',
	botKey: '',
	context: '', 
	knowledgebase: '',
	functionInternet: true,
	functionTime: true
}

export interface FormStep {
	value: string
	label: string
	url: string
	icon: ReactElement
	isActive?: boolean
	soon?: boolean
	disabled?: boolean | string
	tooltip?: ReactElement
}

const DiscordBotForm: React.FC = () => {
	const [formStep, setFormStep] = useState<FormStep | null>(null)
	const [settings, setSettings] = useState<Settings | null>(null)
	const [clientId, setClientId] = useState<string | null>(null)
	const [contextChunks, setContextChunks] = useState<string[]>([]);
	const [contextChunksLoading, setContextChunksLoading] = useState(false);
	const [showChunksModal, setShowChunksModal] = useState(false);
	const navigate = useNavigate()
	const {
		register,
		formState: { errors, isSubmitting },
		reset,
		watch,
		setValue,
		handleSubmit,
		control
	} = useForm<FormFields>({
		defaultValues: formDefaultValues,
		resolver: zodResolver(schema)
	})
	
	const params = useParams()
	const editBotId = params.id || 'new'
	const formStepParam = params['form-step']

	const { openAiKey } = watch()

	const formSteps = useMemo(
		() => [
			{
				value: 'general',
				label: 'General',
				icon: <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${editBotId}/general`,
				isActive: formStepParam === 'general'
			},
			{
				value: 'vector-search',
				label: 'Vector search',
				icon: <CogIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${editBotId}/vector-search`,
				isActive: formStepParam === 'vector-search',
				disabled:
					editBotId === 'new'
						? 'First create the bot to enable this section'
						: false,
				tooltip: (
					<div
						id="vector-search-tooltip"
						role="tooltip"
						className="absolute z-10 invisible inline-block px-3 py-2 text-sm font-medium text-white transition-opacity duration-300 rounded-lg shadow-sm opacity-0 tooltip bg-gray-700"
					>
						Tooltip content
						<div className="tooltip-arrow" data-popper-arrow></div>
					</div>
				)
			},
			{
				value: 'functions',
				label: 'Functions',
				icon: <RectangleStackIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${editBotId}/functions`
			},
			{
				value: 'skills',
				label: 'Skills',
				icon: <RectangleStackIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${editBotId}/skills`,
				soon: true
			}
		],
		[formStepParam, editBotId]
	)

	const onGlobalOpenAiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target
		setValue(
			'openAiKey',
			checked && settings?.openAiKey ? settings?.openAiKey : ''
		)
	}

	useEffect(() => {
		const formStep = formSteps.find(
			formStep => formStep.value === formStepParam
		)
		setFormStep(formStep ? formStep : formSteps[0])
	}, [formStepParam, formSteps])

	useEffect(() => {
		if (editBotId !== 'new') {
			apiClient
				.get<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${editBotId}`)
				.then(response => {
					reset(response.data)
					response.data.clientId && setClientId(response.data.clientId)
				})
				.catch(error => {
					console.error('Error:', error)
				})
		} else {
			reset(formDefaultValues)
		}
	}, [editBotId, reset])

	useEffect(() => {
		apiClient.get<Settings>(ApiPaths.Settings).then(response => {
			setSettings(response.data)
		})
		getChunks();
	}, [])

	const getChunks = () => {
		setContextChunksLoading(true);
		apiClient.get<{[key: string]: string}[]>(`${ApiPaths.Chunks}?botId=${editBotId}`).then(response => {
			const parsedChunks = response.data.map(chunk => chunk.content)
			setContextChunks(parsedChunks)
			setContextChunksLoading(false);
		})
	}

	const onViewChunks = (e: MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		getChunks();
		setShowChunksModal(true);
	}
	const onToggleChunksModal = () => {
		setShowChunksModal(!showChunksModal);
	}

	const deleteBot = async (id: string) => {
		await apiClient.delete<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${id}`)
		navigate(`${RoutePaths.Integrations}/discord`)
	}
	const onUpdate: SubmitHandler<FormFields> = async data => {
		const response = await apiClient.patch<DiscordConfig>(
			`${ApiPaths.DiscordConfigs}/${editBotId}`,
			data
		)
		setClientId(response.data.clientId || null)
	}
	const onCreate: SubmitHandler<FormFields> = async data => {
		data.botStatusText = data.botStatusText || 'Hello World!'
		const response = await apiClient.post<DiscordConfig>(
			ApiPaths.DiscordConfigs,
			data
		)
		navigate(`${RoutePaths.DiscordBotForm}/${response.data._id}`)
	}

	return (
		<div className="flex flex-1 flex-row flex-wrap py-4">
			<SideMenu steps={formSteps} />
			<main
				role="main"
				className="w-full flex flex-1 flex-col sm:w-2/3 md:w-3/4 pt-1 px-2"
			>
				<h1 className="text-2xl text-yellow-500" id="home">
					Configuration
				</h1>
				<form
					className="pb-10 flex flex-1 flex-col"
					onSubmit={handleSubmit(onCreate)}
				>
					{formStep?.value === 'general' && (
						<div className="flex-1">
							<label className="inline-flex items-center mt-10 cursor-pointer">
								<input
									type="checkbox"
									className="sr-only peer"
									{...register('enabled')}
								/>
								<div
									className={`relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white rounded-full peer bg-gray-600 peer-checked:bg-yellow-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600`}
								></div>
								<span className="ms-3 text-sm font-medium text-gray-300">
									Enabled
								</span>
							</label>
							<div className="border-b border-gray-900/10 pb-12">
								<div className="mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
									<div className="col-span-full">
										<label
											htmlFor="street-address"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Public name
										</label>
										<div className="mt-2">
											<input
												type="text"
												autoComplete="botName"
												placeholder="PankoGPT"
												className={`block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2  focus:ring-yellow-300 focus:ring-inset sm:text-sm sm:leading-6`}
												{...register('botName')}
											/>
										</div>
										{errors.botName && (
											<div className="mt-1 text-red-500 text-xs">
												{errors.botName.message}
											</div>
										)}
										<p className="mt-1 text-sm leading-6 text-gray-400">
											Name that will appear in Discord.
										</p>
									</div>
									<div className="col-span-full">
										<label
											htmlFor="street-address"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Internal name
										</label>
										<div className="mt-2">
											<input
												type="text"
												id="internal-name"
												autoComplete="internal-name"
												placeholder="MyServerPankoGPT"
												className="block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-300 sm:text-sm sm:leading-6"
												{...register('internalName')}
											/>
										</div>
										<p className="mt-1 text-sm leading-6 text-gray-400">
											Name to differentiate between bots that might have the
											same public name.
										</p>
									</div>
									<div className="col-span-full">
										<label
											htmlFor="bot-status"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Bot status
										</label>
										<div className="mt-2">
											<input
												type="text"
												id="bot-status"
												autoComplete="bot-status"
												placeholder="Hello World!"
												className="block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-300 sm:text-sm sm:leading-6"
												{...register('botStatusText')}
											/>
										</div>
										<p className="mt-1 text-sm leading-6 text-gray-400">
											Bot status that appears on Discord
										</p>
									</div>
									<div className="col-span-full">
										<label
											htmlFor="street-address"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											OpenAI Key
										</label>
										<div className="mt-2">
											<input
												type="text"
												id="open-ai-key"
												autoComplete="open-ai-key"
												placeholder="sk-bbjC55Gs..."
												className="block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-300 sm:text-sm sm:leading-6"
												{...register('openAiKey')}
											/>
										</div>
										{errors.openAiKey && (
											<div className="mt-1 text-red-500 text-xs">
												{errors.openAiKey.message}
											</div>
										)}
										{settings?.openAiKey && (
											<div className="mt-2 flex items-center mb-4">
												<input
													className="w-4 h-4 text-blue-600  rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
													id="global-open-ai-key"
													type="checkbox"
													onChange={onGlobalOpenAiKeyChange}
													checked={settings.openAiKey === openAiKey}
												/>
												<label
													htmlFor="global-open-ai-key"
													className="ms-2 text-sm font-medium text-gray-300"
												>
													Use Global OpenAI Key
												</label>
											</div>
										)}
									</div>
									<div className="col-span-full">
										<label
											htmlFor="street-address"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Discord Bot Key
										</label>
										<div className="mt-2">
											<input
												type="text"
												id="bot-key"
												autoComplete="bot-key"
												placeholder="MTIyMDQxMTE3Mz..."
												className="block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-300 sm:text-sm sm:leading-6"
												{...register('botKey')}
											/>
										</div>
										{errors.botKey && (
											<div className="mt-1 text-red-500 text-xs">
												{errors.botKey.message}
											</div>
										)}
										<p className="mt-1 text-sm leading-6 text-gray-400">
											Head over to{' '}
											<a
												className="text-blue-400 hover:text-blue-300"
												href="https://discord.com/developers/applications"
											>
												Discord Developer Applications
											</a>{' '}
											create a bot, and from the Bot section: Enable all intents
											and then paste the token here.
										</p>
									</div>
								</div>
								<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
									<div className="col-span-full">
										<label
											htmlFor="about"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Context & Instructions
										</label>
										<div className="mt-2">
											<textarea
												rows={3}
												placeholder="- Your name is PankoGPT and you will answer general questions in a funny way;"
												className="bg-gray-300 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-400 sm:text-sm sm:leading-6"
												{...register('context')}
											></textarea>
										</div>
										{errors.context && (
											<div className="mt-1 text-red-500 text-xs">
												{errors.context.message}
											</div>
										)}
										<p className="mt-3 text-sm leading-6 text-gray-400">
											Properly format each instruction with a start and end, for
											example:
										</p>
										<p className="text-sm leading-6 text-gray-400">
											- You could start all of your instructions with a dash and
											end them with a semi-colon;
										</p>
									</div>
								</div>
								{clientId && (
									<div className="col-span-full">
										<span className="mt-5 inline-flex rounded-md bg-gray-900 px-4 py-2 text-xs font-bold text-white ring-1 ring-inset ring-gray-900">
											<a
												className="text-blue-200 hover:text-white"
												href={`https://discord.com/oauth2/authorize?client_id=${clientId}&permissions=2048&scope=bot`}
												target="_blank"
											>
												Make your bot join a server by clicking this link
											</a>
										</span>
									</div>
								)}
							</div>
						</div>
					)}
					{formStep?.value === 'vector-search' &&
						settings &&
						!settings.hasVectorDataSearchIndex &&
						formStep?.value === 'vector-search' && (
							<div className="mt-4 flex flex-1 flex-col justify-center items-center bg-gray-900 rounded-xl">
								<button
									type="button"
									className="rounded-md bg-green-300 disabled:bg-gray-200 px-10 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-green-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 "
									onClick={() =>
										navigate(`${RoutePaths.Settings}/vector-search`)
									}
								>
									Enable Vector Search
								</button>
								<p className="-mb-3 mt-3 text-gray-500 text-sm max-w-xxl text-center px-10">
									This will redirect you to Settings in order to create the
									search index
								</p>
							</div>
						)}
					{formStep?.value === 'vector-search' &&
						settings &&
						settings.hasVectorDataSearchIndex && (
							<div className="mt-10 flex-1 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
								<div className="col-span-full">
									<div className="flex flex-1 justify-between">
										<label
											htmlFor="about"
											className="block text-sm font-medium leading-6 text-gray-300"
										>
											Knowledgebase
										</label>
										<a href="#" onClick={onViewChunks} className="block bg-yellow-300 hover:bg-yellow-200 rounded px-2 py-1 text-gray-900 text-xs">View structured chunks</a>
									</div>
									<div className="mt-2">
										<textarea
											rows={10}
											placeholder="- Sally is one of the members, she works in HR and moderates this server;"
											className="bg-gray-300 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-400 sm:text-sm sm:leading-6"
											{...register('knowledgebase')}
										></textarea>
									</div>
									<p className="text-sm leading-6 text-gray-400">
										Dump your entire knowledge base here and it will be
										structured into small chunks and served as context to the
										bot via vector search.
									</p>
								</div>
							</div>
						)}

					{formStep?.value === 'functions' && (
						<div className="mt-6 grid gap-y-10 gap-x-6 grid-cols-2">
							<WebpageContent control={(control as unknown) as Control<FieldValues>} name="functionInternet" />
							<CurrentTime control={(control as unknown) as Control<FieldValues>} name="functionTime" />
						</div>
					)}

					<div className="mt-6 flex items-center justify-end gap-x-6">
						{editBotId !== 'new' && (
							<>
								<button
									type="button"
									className="text-red-500 border  focus:ring-4 focus:outline-none  font-medium rounded-md text-sm px-5 py-2 text-center border-red-500  hover:text-white hover:bg-red-600 focus:ring-red-900"
									onClick={deleteBot.bind(null, editBotId)}
								>
									Delete
								</button>
								<button
									onClick={handleSubmit(onUpdate)}
									disabled={isSubmitting}
									className="rounded-md flex items-center bg-yellow-300 disabled:bg-gray-200 px-10 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
								>
									{isSubmitting && (
										<svg
											aria-hidden="true"
											role="status"
											className="inline w-4 h-4 me-3 text-white animate-spin"
											viewBox="0 0 100 101"
											fill="none"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path
												d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
												fill="#E5E7EB"
											/>
											<path
												d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
												fill="currentColor"
											/>
										</svg>
									)}
									Edit
								</button>
							</>
						)}

						{editBotId === 'new' && (
							<button
								onClick={handleSubmit(onCreate)}
								disabled={isSubmitting}
								className="rounded-md bg-yellow-300 disabled:bg-gray-200 px-10 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
							>
								{isSubmitting && (
									<svg
										aria-hidden="true"
										role="status"
										className="inline w-4 h-4 me-3 text-white animate-spin"
										viewBox="0 0 100 101"
										fill="none"
										xmlns="http://www.w3.org/2000/svg"
									>
										<path
											d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
											fill="#E5E7EB"
										/>
										<path
											d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
											fill="currentColor"
										/>
									</svg>
								)}
								Create
							</button>
						)}
					</div>
				</form>
			</main>

			<div className={`${showChunksModal ? '' : 'hidden'} relative z-10`} aria-labelledby="modal-title" role="dialog" aria-modal="true">
				<div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" aria-hidden="true"></div>
				<div className="fixed  px-10 inset-0 z-10 w-screen overflow-y-auto">
					<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
						<div className="relative bg-gray-700 transform overflow-hidden rounded-lg  text-left shadow-xl transition-all sm:my-8 w-full">
							<div className=" px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
								<div className="sm:flex sm:items-start">
									<div className="mt-3 flex flex-1 flex-col text-center sm:ml-4 sm:mt-0 sm:text-left h-fit overflow-hidden">
										<h3 className="text-base font-semibold leading-6 text-white" id="modal-title">Your structured data</h3>
										<div className="mt-2">
											<p className="text-sm text-white">Your knowedgebase gets structured into smaller standalone chunks and these are stored as vector embeddings. In this way, we can populate the bot's context with smaller and related content. You can view them below.</p>
											</div>
										{contextChunksLoading ? (
											<div
												className="inline-block self-center m-10 h-20 w-20 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
												role="status">
												<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
											</div>
										) : (
											<ul role="list" className="my-5 overflow-y-auto scrollbar w-full max-h-[800px]">
												{contextChunks.map(chunk => (
													<li className="flex bg-gray-800 rounded justify-between gap-x-6 p-2 mt-1">
														<div className="flex min-w-0 gap-x-4">
															<div className="min-w-0 flex-auto">
																<p className="text-xs font-semibold leading-4 text-gray-400">{chunk}</p>
															</div>
														</div>
													</li>
												))}
											</ul>
										)}
										<button onClick={getChunks} type="button" className="mx-2 w-96 self-center rounded-md bg-yellow-300 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset  hover:bg-gray-50">Refresh</button>
									</div>
								</div>
							</div>
							<div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
								<button onClick={onToggleChunksModal} type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto">Close</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default DiscordBotForm
