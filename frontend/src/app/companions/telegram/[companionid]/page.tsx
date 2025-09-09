'use client';
import { Button } from '@/components/ui/button';
import ButtonSubmit from '@/components/_form/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { z } from 'zod';
import { useEffect, useState } from 'react';
import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import TextInput from '@/components/_form/text-input';
import Select from '@/components/_form/select';
import useChatgptStore from '@/store/chatgpt';
import Textarea from '@/components/_form/textarea';
import Checkbox from '@/components/_form/checkbox';
import { useFetchTelegramConfig } from '@/queries/companions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateCompanion, useDeleteCompanion, useUpdateCompanion } from '@/mutations/companion';
import RoutePaths from '@/constants/RoutePaths';
import { extractErrorMessage } from '@/lib/utils';
import Switch from '@/components/_form/switch';
import TabVectorSearch from './TabVectorSearch';
import TabFunctions from './TabFunctions';
import ApiPaths from '@/constants/ApiPaths';
import useSettingsStore from '@/store/settings';

const formSchema = z
	.object({
		enabled: z.boolean(),
		botName: z.string(),
		internalName: z.string().min(1, 'This field is required'),
		openAiKey: z.string().min(1, 'This field is required'),
		chatGptModel: z.string().min(1, 'This field is required'),
		customChatGptModel: z.boolean(),
		botKey: z.string().min(1, 'This field is required'),
		context: z.string().min(1, 'This field is required'),
		knowledgebase: z.string(),
		functionUrlSummarizer: z.boolean(),
		functionSearchSummarizer: z.boolean(),
		functionSearchSummarizerKey: z.string(),
		functionReminders: z.boolean(),
		functionLanguageDetection: z.boolean(),
		functionLanguageDetectionWhitelist: z.string()
	})
	.superRefine((data, ctx) => {
		if (data.functionSearchSummarizer && !data.functionSearchSummarizerKey.trim()) {
			ctx.addIssue({
				path: ['functionSearchSummarizerKey'],
				message: 'To enable Search Summarizer, please provide a Brave API Key',
				code: z.ZodIssueCode.custom
			});
		}
	});

const defaultValues = {
	enabled: true,
	botName: '',
	internalName: '',
	openAiKey: '',
	chatGptModel: '',
	customChatGptModel: false,
	botKey: '',
	context: '',
	knowledgebase: '',
	functionUrlSummarizer: true,
	functionSearchSummarizer: false,
	functionSearchSummarizerKey: '',
	functionReminders: false,
	functionLanguageDetection: false,
	functionLanguageDetectionWhitelist: ''
};

function CompanionFormPage() {
	const [formSubmitting, setFormSubmitting] = useState(false);
	const [showFormSuccess, setShowFormSuccess] = useState(false);
	const [generalError, setGeneralError] = useState<string | null>(null);
	const chatgptModels = useChatgptStore(state => state.models);
	const { companionid: companionId }: { companionid: string } = useParams();
	const { data: config } = useFetchTelegramConfig(companionId);
	const updateCompanion = useUpdateCompanion();
	const createCompanion = useCreateCompanion();
	const deleteCompanion = useDeleteCompanion();
	const settings = useSettingsStore(state => state.settings);

	const isNewCompanion = companionId === 'create';

	const router = useRouter();
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues
	});

	const customChatGptModel = form.watch('customChatGptModel');

	const showChatgptModelsDropdown = !customChatGptModel && chatgptModels.length;

	const isFormDirty = form.formState.isDirty;

	useEffect(() => {
		if (settings.openAiKey) {
			form.setValue('openAiKey', settings.openAiKey);
		}
	}, []);

	useEffect(() => {
		if (!config) return;
		form.reset({
			...defaultValues,
			...config
		});
	}, [config]);

	const onDelete = async () => {
		await deleteCompanion.mutateAsync({ companionId, apiPath: ApiPaths.TelegramConfigs });
		router.push('/' + RoutePaths.Dashboard);
	};

	const showFormSuccessToast = () => {
		setShowFormSuccess(true);
		setTimeout(() => {
			setShowFormSuccess(false);
		}, 2000);
	};

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setGeneralError(null);
		setFormSubmitting(true);
		values.botName = values.internalName; // botName is not yet used
		try {
			if (isNewCompanion) {
				const response = await createCompanion.mutateAsync({ values, apiPath: ApiPaths.TelegramConfigs });
				router.push(`/${RoutePaths.CompanionsTelegram}/${response.data._id}`);
			} else {
				await updateCompanion.mutateAsync({ companionId, values, apiPath: ApiPaths.TelegramConfigs });
			}
			form.reset(form.getValues(), { keepDirty: false });
			showFormSuccessToast();
		} catch (error) {
			const errorMessage = extractErrorMessage(error);
			setGeneralError(errorMessage);
		} finally {
			setFormSubmitting(false);
		}
	};

	return (
		<>
			<h2 className="text-lg font-semibold leading-none tracking-tight mt-5">Companion form</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)}>
					<Tabs defaultValue="general">
						<TabsList>
							<TabsTrigger className="cursor-pointer" value="general">
								General
							</TabsTrigger>
							<TabsTrigger className="cursor-pointer" value="vector-search">
								Vector Search
							</TabsTrigger>
							<TabsTrigger className="cursor-pointer" value="functions">
								Functions
							</TabsTrigger>
						</TabsList>
						<TabsContent value="general">
							<div className="space-y-8 mt-5">
								<Switch name="enabled" label="Enabled" vertical control={form.control} />
								<TextInput
									name="internalName"
									control={form.control}
									label="Internal name"
									description={'Name to internally differentiate between multiple companions'}
								/>
								<TextInput name="openAiKey" control={form.control} label="OpenAI key" />
								{!showChatgptModelsDropdown && (
									<TextInput
										className="mb-2"
										name="chatGptModel"
										control={form.control}
										label="Custom ChatGPT model"
									/>
								)}
								{showChatgptModelsDropdown && (
									<Select
										className="mb-2"
										name="chatGptModel"
										control={form.control}
										label="Global ChatGPT model"
										placeholder="ChatGPT Models"
										description="Hint: Specify the OpenAI Key in Settings to automatically fetch and see all ChatGPT models available here."
										data={chatgptModels.map(value => ({
											label: value,
											value: value
										}))}
									/>
								)}
								<Checkbox
									name="customChatGptModel"
									control={form.control}
									label="Custom ChatGPT model"
								/>
								<TextInput name="botKey" control={form.control} label="Telegram bot key" />
								<Textarea
									className="mb-2"
									name="context"
									control={form.control}
									label="Context & instructions"
									description={
										<>
											<span>
												It helps if you properly format multiple instructions with a start and
												end, for example:
											</span>
											<br />
											<span>
												- You could start all of your instructions with a dash and end them with
												a semi-colon;
											</span>
										</>
									}
								/>
							</div>
						</TabsContent>
						<TabsContent value="vector-search">
							<TabVectorSearch control={form.control} companionId={companionId} />
						</TabsContent>
						<TabsContent value="functions">
							<TabFunctions control={form.control} />
						</TabsContent>
					</Tabs>
					<p className="mt-5 text-sm text-red-400">{generalError}</p>
					<div className="flex justify-end mt-10 space-x-5">
						{!isNewCompanion && (
							<Button
								className="cursor-pointer"
								variant="destructive"
								disabled={formSubmitting}
								type="button"
								onClick={onDelete}
							>
								Delete
							</Button>
						)}
						<ButtonSubmit
							label={isNewCompanion ? 'Submit' : 'Update'}
							pulse={!!isFormDirty}
							onClick={form.handleSubmit(onSubmit)}
							disabled={formSubmitting || showFormSuccess}
							isSubmitting={formSubmitting}
							success={showFormSuccess}
						/>
					</div>
				</form>
			</Form>
		</>
	);
}

export default CompanionFormPage;
