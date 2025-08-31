'use client';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Settings } from '@/services/api/types';
import { z } from 'zod';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { useEffect, useState } from 'react';
import React from 'react';
import { Loader2Icon } from 'lucide-react';
import TextInput from '@/components/_form/text-input';
import useSettingsStore from '@/store/settings';
import Checkbox from '@/components/_form/checkbox';
import Select from '@/components/_form/select';
import useChatgptStore from '@/store/chatgpt';

const formSchema = z.object({
	openAiKey: z.string(),
	chatGptModel: z.string(),
	customChatGptModel: z.boolean()
});

const defaultValues = {
	openAiKey: '',
	chatGptModel: '',
	customChatGptModel: false
};

function ChatgptSettingsPage() {
	const [formSubmitting, setFormSubmitting] = useState(false);
	const settings = useSettingsStore(state => state.settings);
	const chatgptModels = useChatgptStore(state => state.models);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues
	});

	const customChatGptModel = form.watch('customChatGptModel');

	useEffect(() => {
		if (!Object.keys(settings).length || !chatgptModels.length) return;
		form.reset({ ...defaultValues, ...settings });
	}, [form, settings, chatgptModels]);

	useEffect(() => {
		form.setValue('customChatGptModel', customChatGptModel);
	}, [form, customChatGptModel]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setFormSubmitting(true);
		await apiClient.post<Settings>(ApiPaths.Settings, values);
		setFormSubmitting(false);
	};

	return (
		<>
			<h2 className="text-lg font-semibold leading-none tracking-tight mt-5">ChatGPT</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
					<TextInput
						name="openAiKey"
						control={form.control}
						label="Global ChatGPT Key"
						placeholder="sk-..."
						description="Default key - can be overwritten by each companion individually."
					/>
					{customChatGptModel && (
						<TextInput
							name="chatGptModel"
							control={form.control}
							label="Custom ChatGPT Model"
							description="Custom ChatGPT Model (i.e. custom trained models)."
						/>
					)}
					{!customChatGptModel && (
						<Select
							name="chatGptModel"
							control={form.control}
							label="Global ChatGPT Model"
							description="If you add an OpenAI Key, all ChatGPT models will be fetched automatically."
							placeholder="ChatGPT Models"
							data={chatgptModels.map(value => ({
								label: value,
								value: value
							}))}
						/>
					)}
					<Checkbox
						name="customChatGptModel"
						control={form.control}
						label="Custom ChatGPT Model"
						description="Custom ChatGPT Model (i.e. custom trained models)"
					/>
					<Button className="cursor-pointer" disabled={formSubmitting} type="submit">
						{formSubmitting && <Loader2Icon className="animate-spin" />} Submit
					</Button>
				</form>
			</Form>
		</>
	);
}

export default ChatgptSettingsPage;
