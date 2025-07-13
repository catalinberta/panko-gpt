'use client';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form'; // ✅ Correct: use your UI wrapper
import { Settings } from '@/services/api/types';
import { z } from 'zod';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { useEffect, useState } from 'react';
import React from 'react';
import { Loader2Icon } from 'lucide-react';
import Select from '@/components/_form/select';
import { LogLevels } from '@/constants/LogLevels';
import useSettingsStore from '@/store/settings';

const formSchema = z.object({
	logLevel: z.string()
});

const defaultValues = {
	logLevel: LogLevels.Info
};

const logLevels = Object.keys(LogLevels).map(value => ({
	label: value,
	value: value.toLowerCase()
}));

function SystemSettingsPage() {
	const [formSubmitting, setFormSubmitting] = useState(false);
	const settings = useSettingsStore(state => state.settings);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues
	});

	useEffect(() => {
		if (!Object.keys(settings).length) return;
		form.reset({ ...defaultValues, ...settings });
	}, [form, settings]);

	const onSubmit = async (values: z.infer<typeof formSchema>) => {
		setFormSubmitting(true);
		await apiClient.post<Settings>(ApiPaths.Settings, values);
		setFormSubmitting(false);
	};

	return (
		<>
			<h2 className="text-lg font-semibold leading-none tracking-tight mt-5">ChatGPT Settings</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
					<Select name="logLevel" control={form.control} label="Log Level" data={logLevels} />

					<Button className="cursor-pointer" disabled={formSubmitting} type="submit">
						{formSubmitting && <Loader2Icon className="animate-spin" />} Submit
					</Button>
				</form>
			</Form>
		</>
	);
}

export default SystemSettingsPage;
