import { Cog6ToothIcon, CogIcon } from '@heroicons/react/24/outline';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import RoutePaths from '../../constants/RoutePaths';
import SideMenu from '../../components/side-menu';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useParams } from 'react-router-dom';
import ApiPaths from '../../constants/ApiPaths';
import apiClient from '../../services/api';
import { AtlasSearchIndexDefinition, Settings as SettingsType } from '../../services/api/types';
import Dropdown from '@components/dropdown';
import { chatgptDefaults } from '@constants/chatgpt';

const schema = z.object({
	openAiKey: z.string().optional(),
	chatGptModel: z.string().min(1, 'This field is required'),
	customChatGptModel: z.boolean(),
	atlasPublicKey: z.string(),
	atlasPrivateKey: z.string(),
	atlasProjectId: z.string(),
	atlasCluster: z.string()
});

type FormFields = z.infer<typeof schema>;

const defaultValues = {
	atlasPublicKey: '',
	atlasPrivateKey: '',
	atlasProjectId: '',
	atlasCluster: '',
	atlasDatabase: '',
	openAiKey: '',
	chatGptModel: chatgptDefaults.model,
	customChatGptModel: false
};

const Settings: React.FC = () => {
	const [settings, setSettings] = useState<SettingsType>(defaultValues);
	const [chatgptModels, setChatgptModels] = useState<string[]>([]);
	const [pankoIndex, setPankoIndex] = useState<AtlasSearchIndexDefinition | false | null>(null);
	const [indexLoadingStatus, setIndexLoadingStatus] = useState(false);
	const {
		register,
		reset,
		control,
		watch,
		formState: { errors, isSubmitting },
		handleSubmit
	} = useForm<FormFields>({
		defaultValues,
		resolver: zodResolver(schema)
	});
	const params = useParams();
	const settingsCategoryParam = params.category || 'gpt';
	const { openAiKey, customChatGptModel } = watch();
	const formSteps = useMemo(
		() => [
			{
				value: 'gpt',
				label: 'ChatGPT',
				icon: <CogIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Settings}/gpt`,
				isActive: settingsCategoryParam === 'gpt'
			},
			{
				value: 'vector-search',
				label: 'Vector Search',
				icon: <Cog6ToothIcon className="h-6 w-6" aria-hidden="true" />,
				url: `${RoutePaths.Settings}/vector-search`,
				isActive: settingsCategoryParam === 'vector-search'
			}
		],
		[settingsCategoryParam]
	);

	const getIndex = useCallback(() => {
		apiClient
			.get<AtlasSearchIndexDefinition | false>(`${ApiPaths.AtlasIndex}`)
			.then(response => {
				setPankoIndex(response.data);
				if (response.data && response.data.status === 'IN_PROGRESS') {
					setTimeout(() => {
						getIndex();
					}, 5000);
				}
			})
			.catch(error => {
				setPankoIndex(false);
				console.error('Error:', error);
			});
	}, []);

	const createIndex = async () => {
		setIndexLoadingStatus(true);
		await apiClient
			.post<AtlasSearchIndexDefinition>(`${ApiPaths.AtlasIndex}`)
			.then(() => {
				getIndex();
			})
			.catch(error => {
				console.error('Error creating index', error);
			});
		setIndexLoadingStatus(false);
	};

	const getSettings = React.useCallback(async () => {
		const response = await apiClient.get<SettingsType>(`${ApiPaths.Settings}`);
		setSettings(response.data);
		reset(response.data);
	}, [reset]);

	useEffect(() => {
		getAllChatgptModels();
	}, [openAiKey]);

	useEffect(() => {
		getSettings();
	}, [getSettings]);

	useEffect(() => {
		if (settingsCategoryParam !== 'vector-search') return;
		if (!settings.atlasPrivateKey || !settings.atlasPublicKey || !settings.atlasProjectId) {
			return;
		}
		getIndex();
	}, [settingsCategoryParam, getIndex, settings]);

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

	const onSubmit: SubmitHandler<FormFields> = async data => {
		await apiClient.post<SettingsType>(ApiPaths.Settings, data);
		await getSettings();
		getAllChatgptModels();
	};

	return (
		<div className="flex flex-row flex-wrap py-4">
			<SideMenu steps={formSteps} />
			<main role="main" className="w-full sm:w-2/3 md:w-3/4 pt-1 px-2">
				<form>
					<div>
						<div className="border-b border-gray-900/10 pb-12">
							<div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
								{settingsCategoryParam === 'gpt' && (
									<>
										<div className="col-span-full">
											<h1 className="text-2xl text-yellow-500" id="home">
												ChatGPT
											</h1>
											<div className="mt-5 col-span-full">
												<label
													htmlFor="street-address"
													className="block text-sm font-medium leading-6 text-gray-300"
												>
													Global OpenAI Key
												</label>
												<div className="mt-2">
													<input
														type="text"
														placeholder="sk-bbjC55Gs..."
														className={`block w-full rounded-md bg-gray-300 border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-500 focus:ring-2  focus:ring-yellow-300 focus:ring-inset sm:text-sm sm:leading-6`}
														{...register('openAiKey')}
													/>
												</div>
												{errors.openAiKey && (
													<div className="mt-1 text-red-500 text-xs">
														{errors.openAiKey.message}
													</div>
												)}
											</div>
										</div>
										{!customChatGptModel && (
											<Dropdown
												name="chatGptModel"
												label="Global ChatGPT Model"
												control={control}
												error={errors.chatGptModel}
												register={register}
												options={chatgptModels.map(model => ({
													label: model,
													value: model
												}))}
												hint="Hint: Specify the Global OpenAI Key at the top to automatically fetch all ChatGPT models for this dropdown"
											/>
										)}
										{customChatGptModel && (
											<div className="col-span-full">
												<label
													htmlFor="street-address"
													className="block text-sm font-medium leading-6 text-gray-300"
												>
													Global ChatGPT Model
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

										<div className="col-span-full -mt-5 flex items-center mb-4">
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
												Manually specify Global ChatGPT model
											</label>
										</div>
									</>
								)}
								{settingsCategoryParam === 'vector-search' && (
									<div className="col-span-full">
										<h1 className="text-2xl text-yellow-500" id="home">
											Vector Search Index
										</h1>
										<div
											className={`col-span-full ${
												settings.atlasCluster
													? ''
													: 'opacity-30 pointer-events-none select-none'
											}`}
										>
											<div className="flex flex-1 flex-col items-center pb-10">
												<div className="mt-3 flex flex-1 self-stretch bg-gray-900 justify-between py-4 pl-4 pr-5 text-sm leading-6">
													<div className="flex w-0 flex-1 items-center">
														<div className="ml-4 flex min-w-0 flex-1 gap-2">
															<span className="truncate text-gray-400">Search Index</span>
															<span className="flex-shrink-0 font-bold text-white">
																pankogpt
															</span>
														</div>
													</div>
													<div className="ml-4 flex-shrink-0">
														{pankoIndex === null && (
															<span className="inline-flex items-center rounded-md font-bold bg-blue-50 px-2 py-1 text-xs text-blue-700 ring-1 ring-inset ring-blue-600/20">
																SEARCHING
															</span>
														)}
														{pankoIndex === false && (
															<span className="inline-flex items-center rounded-md font-bold bg-red-50 px-2 py-1 text-xs text-red-700 ring-1 ring-inset ring-red-600/20">
																NOT FOUND
															</span>
														)}
														{pankoIndex && (
															<span className="inline-flex items-center rounded-md font-bold bg-green-50 px-2 py-1 text-xs text-green-700 ring-1 ring-inset ring-green-600/20">
																FOUND
															</span>
														)}
													</div>
												</div>
												{pankoIndex && pankoIndex.status === 'STEADY' && (
													<>
														<div className="col-span-full text-center">
															<span className="mt-5 inline-flex items-center rounded-md bg-green-50 px-10 py-2 text-xs font-bold text-green-800 ring-1 ring-inset ring-green-600/20">
																You are all set!
															</span>
														</div>
														<div className="col-span-full text-center">
															<span className="mt-1 inline-flex items-center rounded-md bg-green-50 px-10 py-2 text-xs font-bold text-green-800 ring-1 ring-inset ring-green-600/20">
																You can now go to each bot configuration and add your
																knowledge base in the Vector Search section
															</span>
														</div>
													</>
												)}
												{pankoIndex && pankoIndex.status === 'FAILED' && (
													<div className="col-span-full text-center">
														<span className="mt-5 inline-flex items-center rounded-md bg-red-50 px-10 py-2 text-xs font-bold text-red-800 ring-1 ring-inset ring-red-600/20">
															There was an error creating the index.
														</span>
													</div>
												)}
												{pankoIndex && pankoIndex.status === 'IN_PROGRESS' && (
													<div className="col-span-full text-center">
														<span className="mt-5 inline-flex items-center rounded-md font-bold bg-blue-50 px-10 py-2 text-xs text-blue-700 ring-1 ring-inset ring-blue-600/20">
															The index is being created! Come back in a few minutes.
														</span>
													</div>
												)}
												{pankoIndex === false && (
													<div className="mt-5 justify-center">
														<button
															type="button"
															disabled={indexLoadingStatus}
															className="rounded-md bg-green-300 disabled:bg-gray-200 px-10 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-green-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
															onClick={handleSubmit(async () => await createIndex())}
														>
															Create Search Index
														</button>
													</div>
												)}
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					</div>
				</form>

				<div className="mt-5 mb-5 flex items-center justify-end gap-x-6">
					<button
						type="submit"
						disabled={isSubmitting}
						className="rounded-md bg-yellow-300 px-10 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-yellow-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
						onClick={handleSubmit(onSubmit)}
					>
						Save
					</button>
				</div>
			</main>
		</div>
	);
};

export default Settings;
