import { Control, FieldValues, SubmitHandler, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ApiPaths from '../../constants/ApiPaths';
import { DiscordConfig, Settings } from '../../services/api/types';
import apiClient from '../../services/api';
import { useNavigate, useParams } from 'react-router-dom';
import { ChangeEvent, MouseEvent, ReactElement, useEffect, useMemo, useState } from 'react';
import RoutePaths from '../../constants/RoutePaths';
import { Cog6ToothIcon, CogIcon, RectangleStackIcon } from '@heroicons/react/24/outline';
import SideMenu from '../../components/side-menu';
import WebpageContent from '@components/_functions/webpagecontent';
import CurrentTime from '@components/_functions/currenttime';
import Dropdown from '@components/dropdown';
import KnowledgebaseModal from '../../components/_modals/KnowledgebaseModal';

const schema = z.object({
	enabled: z.boolean(),
	botName: z.string().min(1, 'This field is required'),
	internalName: z.string(),
	botStatusText: z.string(),
	openAiKey: z.string().min(1, 'This field is required'),
	chatGptModel: z.string().min(1, 'This field is required'),
	customChatGptModel: z.boolean(),
	botKey: z.string().min(1, 'This field is required'),
	context: z.string().min(1, 'This field is required'),
	knowledgebase: z.string(),
	functionInternet: z.boolean(),
	functionTime: z.boolean()
});

type FormFields = z.infer<typeof schema>;

const formDefaultValues = {
	enabled: true,
	botName: '',
	internalName: '',
	botStatusText: '',
	openAiKey: '',
	chatGptModel: '',
	customChatGptModel: false,
	botKey: '',
	context: '',
	knowledgebase: '',
	functionInternet: true,
	functionTime: true
};

export interface FormStep {
	value: string;
	label: string;
	url: string;
	icon: ReactElement;
	isActive?: boolean;
	soon?: boolean;
	disabled?: boolean | string;
	tooltip?: ReactElement;
}

const DiscordBotForm: React.FC = () => {
	const [formStep, setFormStep] = useState<FormStep | null>(null);
	const [settings, setSettings] = useState<Settings | null>(null);
	const [clientId, setClientId] = useState<string | null>(null);
	const [chatgptModels, setChatgptModels] = useState<string[]>([]);
	const [showKnowledgebaseModal, setShowKnowledgebaseModal] = useState(false);
	const [showFormSuccess, setShowFormSuccess] = useState(false);
	const navigate = useNavigate();
	const {
		register,
		formState: { errors, isSubmitting, dirtyFields },
		reset,
		watch,
		setValue,
		getValues,
		handleSubmit,
		control
	} = useForm<FormFields>({
		defaultValues: formDefaultValues,
		resolver: zodResolver(schema)
	});

	const params = useParams();
	const botId = params.id || 'new';
	const formStepParam = params['form-step'];

	const { openAiKey, chatGptModel, customChatGptModel } = watch();

	const isFormDirty = Object.keys(dirtyFields).length;

	const formSteps = useMemo(
		() => [
			{
				value: 'general',
				label: 'General',
				icon: <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${botId}/general`,
				isActive: formStepParam === 'general'
			},
			{
				value: 'vector-search',
				label: 'Vector search',
				icon: <CogIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${botId}/vector-search`,
				isActive: formStepParam === 'vector-search',
				disabled: botId === 'new' ? 'First create the bot to enable this section' : false,
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
				url: `/discord-bot-form/${botId}/functions`
			},
			{
				value: 'skills',
				label: 'Skills',
				icon: <RectangleStackIcon className="h-6 w-6" aria-hidden="true" />,
				url: `/discord-bot-form/${botId}/skills`,
				soon: true
			}
		],
		[formStepParam, botId]
	);

	const onGlobalOpenAiKeyChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target;
		setValue('openAiKey', checked && settings?.openAiKey ? settings?.openAiKey : '');
	};

	const onGlobalChatGptModelChange = (e: ChangeEvent<HTMLInputElement>) => {
		const { checked } = e.target;
		checked && setValue('chatGptModel', settings?.chatGptModel || '');
	};

	useEffect(() => {
		getAllChatgptModels();
	}, []);

	const getAllChatgptModels = () => {
		apiClient
			.get<string[]>(`${ApiPaths.ChatgptModels}`)
			.then(response => {
				const models = response.data;
				models.unshift('');
				setChatgptModels(models);
			})
			.catch(error => {
				console.error('Error fetching chatgpt models', error);
			});
	};

	useEffect(() => {
		const formStep = formSteps.find(formStep => formStep.value === formStepParam);
		setFormStep(formStep ? formStep : formSteps[0]);
	}, [formStepParam, formSteps]);

	useEffect(() => {
		if (botId !== 'new') {
			apiClient
				.get<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${botId}`)
				.then(response => {
					reset(response.data);
					response.data.clientId && setClientId(response.data.clientId);
				})
				.catch(error => {
					console.error('Error:', error);
				});
		} else {
			reset(formDefaultValues);
		}
	}, [botId, reset]);

	useEffect(() => {
		apiClient.get<Settings>(ApiPaths.Settings).then(response => {
			setSettings(response.data);
		});
	}, []);

	const closeKnowledgebaseModal = () => {
		setShowKnowledgebaseModal(false);
	};

	const onViewChunks = (e: MouseEvent<HTMLAnchorElement>) => {
		e.preventDefault();
		setShowKnowledgebaseModal(true);
	};

	const showFormSuccessToast = () => {
		setShowFormSuccess(true);
		setTimeout(() => {
			setShowFormSuccess(false);
		}, 2000);
	};

	const deleteBot = async (id: string) => {
		await apiClient.delete<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${id}`);
		navigate(`${RoutePaths.Integrations}/discord`);
	};
	const onUpdate: SubmitHandler<FormFields> = async data => {
		await apiClient.patch<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${botId}`, data);
		reset(getValues(), { keepDirty: false });
		showFormSuccessToast();
	};
	const onCreate: SubmitHandler<FormFields> = async data => {
		data.botStatusText = data.botStatusText || 'Hello World!';
		const response = await apiClient.post<DiscordConfig>(ApiPaths.DiscordConfigs, data);
		navigate(`${RoutePaths.DiscordBotForm}/${response.data._id}`);
	};

	return (
		<div className="flex flex-1 flex-row flex-wrap py-4">
			<SideMenu steps={formSteps} />
			<main role="main" className="w-full flex flex-1 flex-col sm:w-2/3 md:w-3/4 pt-1 px-2">
				<h1 className="text-2xl text-yellow-500" id="home">
					Configuration
				</h1>
				<form className="pb-10 flex flex-1 flex-col" onSubmit={handleSubmit(onCreate)}>
					{formStep?.value === 'general' && (
						<div className="flex-1">
							<label className="inline-flex items-center mt-10 cursor-pointer">
								<input type="checkbox" className="sr-only peer" {...register('enabled')} />
								<div
									className={`relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white rounded-full peer bg-gray-600 peer-checked:bg-yellow-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600`}
								></div>
								<span className="ms-3 text-sm font-medium text-gray-300">Enabled</span>
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
											<div className="mt-1 text-red-500 text-xs">{errors.botName.message}</div>
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
											Name to differentiate between bots that might have the same public name.
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
											<div className="mt-1 text-red-500 text-xs">{errors.openAiKey.message}</div>
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
									{!customChatGptModel && (
										<Dropdown
											name="chatGptModel"
											label="ChatGPT Model"
											control={control}
											error={errors.chatGptModel}
											register={register}
											options={chatgptModels.map(model => ({
												label: model,
												value: model
											}))}
											hint="Hint: Specify the OpenAI Key in Settings to automatically fetch all ChatGPT models for this dropdown"
										/>
									)}
									{customChatGptModel && (
										<div className="col-span-full">
											<label
												htmlFor="street-address"
												className="block text-sm font-medium leading-6 text-gray-300"
											>
												ChatGPT Model
											</label>
											<div className="mt-2">
												<input
													type="text"
													placeholder="gpt-4o"
													className={`block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2  focus:ring-yellow-300 focus:ring-inset sm:text-sm sm:leading-6`}
													{...register('chatGptModel')}
												/>
											</div>
											{errors.chatGptModel && (
												<div className="mt-1 text-red-500 text-xs">
													{errors.chatGptModel.message}
												</div>
											)}
										</div>
									)}
									<div className="col-span-full -mt-5 flex items-center">
										<input
											className="w-4 h-4 text-blue-600  rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
											id="specify-custom-model"
											type="checkbox"
											{...register('customChatGptModel')}
										/>
										<label
											htmlFor="specify-custom-model"
											className="ms-2 text-sm font-medium text-gray-300"
										>
											Specify custom ChatGPT model
										</label>
									</div>
									{settings?.chatGptModel && (
										<div className="col-span-full flex items-center -mt-5 mb-4">
											<input
												className="w-4 h-4 text-blue-600  rounded focus:ring-blue-600 ring-offset-gray-800 focus:ring-2 bg-gray-700 border-gray-600"
												id="global-chatgpt-model"
												type="checkbox"
												onChange={onGlobalChatGptModelChange}
												checked={settings.chatGptModel === chatGptModel}
											/>
											<label
												htmlFor="global-chatgpt-model"
												className="ms-2 text-sm font-medium text-gray-300"
											>
												Use Global ChatGPT Model
											</label>
										</div>
									)}
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
											<div className="mt-1 text-red-500 text-xs">{errors.botKey.message}</div>
										)}
										<p className="mt-1 text-sm leading-6 text-gray-400">
											Head over to{' '}
											<a
												className="text-blue-400 hover:text-blue-300"
												href="https://discord.com/developers/applications"
											>
												Discord Developer Applications
											</a>{' '}
											create a bot, and from the Bot section: Enable all intents and then paste
											the token here.
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
											<div className="mt-1 text-red-500 text-xs">{errors.context.message}</div>
										)}
										<p className="mt-3 text-sm leading-6 text-gray-400">
											It helps if you properly format multiple instructions with a start and end,
											for example:
										</p>
										<p className="text-sm leading-6 text-gray-400">
											- You could start all of your instructions with a dash and end them with a
											semi-colon;
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
												Click here to join your bot into a server
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
									onClick={() => navigate(`${RoutePaths.Settings}/vector-search`)}
								>
									Enable Vector Search
								</button>
								<p className="-mb-3 mt-3 text-gray-500 text-sm max-w-xxl text-center px-10">
									This will redirect you to Settings in order to create the search index
								</p>
							</div>
						)}
					{formStep?.value === 'vector-search' && settings && settings.hasVectorDataSearchIndex && (
						<div className="mt-10 flex-1 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
							<div className="col-span-full">
								<div className="flex flex-1 justify-between">
									<label
										htmlFor="about"
										className="block text-sm font-medium leading-6 text-gray-300"
									>
										Knowledgebase
									</label>
									<a
										href="#"
										onClick={onViewChunks}
										className="block bg-yellow-300 hover:bg-yellow-200 rounded px-2 py-1 text-gray-900 text-xs"
									>
										View structured chunks
									</a>
								</div>
								<div className="mt-2">
									<textarea
										rows={10}
										placeholder="Sally is one of the members, she works in HR and moderates this server&#10;Jerry is ...well, Jerry"
										className="bg-gray-300 block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2 focus:ring-inset focus:ring-yellow-400 sm:text-sm sm:leading-6"
										{...register('knowledgebase')}
									></textarea>
								</div>
								<p className="text-sm leading-6 text-gray-400">
									Dump your entire knowledge base here and it will be structured into small chunks and
									served as context to the bot via vector search.
								</p>
							</div>
						</div>
					)}

					{formStep?.value === 'functions' && (
						<div className="mt-6 grid gap-y-10 gap-x-6 grid-cols-2">
							<WebpageContent
								control={control as unknown as Control<FieldValues>}
								name="functionInternet"
							/>
							<CurrentTime control={control as unknown as Control<FieldValues>} name="functionTime" />
						</div>
					)}

					<div className="mt-6 flex items-center justify-end gap-x-6">
						{botId !== 'new' && (
							<>
								<button
									type="button"
									className="text-red-500 border  focus:ring-4 focus:outline-none  font-medium rounded-md text-sm px-5 py-2 text-center border-red-500  hover:text-white hover:bg-red-600 focus:ring-red-900"
									onClick={deleteBot.bind(null, botId)}
								>
									Delete
								</button>
								<button
									onClick={handleSubmit(onUpdate)}
									disabled={isSubmitting || showFormSuccess}
									className={`rounded-md ${
										isFormDirty ? 'animation-button-pulse' : ''
									} flex items-center bg-yellow-300 px-10 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
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
									{showFormSuccess ? (
										<svg
											className="w-5 h-5"
											aria-hidden="true"
											xmlns="http://www.w3.org/2000/svg"
											fill="#537300"
											viewBox="0 0 20 20"
										>
											<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
										</svg>
									) : (
										'Edit'
									)}
								</button>
							</>
						)}

						{botId === 'new' && (
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
			<KnowledgebaseModal show={showKnowledgebaseModal} close={closeKnowledgebaseModal} botId={botId} />
		</div>
	);
};

export default DiscordBotForm;
