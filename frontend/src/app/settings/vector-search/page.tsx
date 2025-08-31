'use client';
import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { AtlasSearchIndexDefinition } from '@/services/api/types';
import { z } from 'zod';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { useCallback, useEffect, useState } from 'react';
import React from 'react';
import { LogLevels } from '@/constants/LogLevels';
import useSettingsStore from '@/store/settings';
import { Loader2Icon } from 'lucide-react';

const formSchema = z.object({
	logLevel: z.string()
});

const defaultValues = {
	logLevel: LogLevels.Info
};

function VectorSearchSettingsPage() {
	const [formSubmitting, setFormSubmitting] = useState(false);
	const settings = useSettingsStore(state => state.settings);
	const [pankoIndex, setPankoIndex] = useState<AtlasSearchIndexDefinition | false | null>(null);
	const [indexLoadingStatus, setIndexLoadingStatus] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues
	});

	useEffect(() => {
		if (!Object.keys(settings).length) return;
		form.reset({ ...defaultValues, ...settings });
	}, [form, settings]);

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

	useEffect(() => {
		if (!settings.atlasPrivateKey || !settings.atlasPublicKey || !settings.atlasProjectId) {
			return;
		}
		getIndex();
	}, [getIndex, settings]);

	const onSubmit = async () => {
		setFormSubmitting(true);
		await createIndex();
		setFormSubmitting(false);
	};

	return (
		<>
			<h2 className="text-lg font-semibold leading-none tracking-tight mt-5">Vector Search Index</h2>
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 mt-5">
					<div className="flex">
						<div className="w-full flex flex-row items-center justify-between p-5 shrink-0 rounded-sm border-2">
							<p className="text-gray-400">
								Search Index: <b className="text-white">pankogpt</b>
							</p>
							<div className="ml-4 flex-shrink-0">
								{pankoIndex === null && (
									<span className="inline-flex items-center rounded-md font-bold bg-blue-50 px-4 py-2 text-xs text-gray-700 ring-1 ring-inset ring-gray-600/20">
										<Loader2Icon size={16} className="animate-spin mr-1" /> SEARCHING
									</span>
								)}
								{pankoIndex === false && (
									<span className="inline-flex items-center rounded-md font-bold bg-red-50 px-4 py-2 text-xs text-red-700 ring-1 ring-inset ring-red-600/20">
										NOT FOUND
									</span>
								)}
								{pankoIndex && (
									<span className="inline-flex items-center rounded-md font-bold bg-green-50 px-4 py-2 text-xs text-green-800 ring-1 ring-inset ring-green-600/20">
										FOUND
									</span>
								)}
							</div>
						</div>
					</div>
					{pankoIndex && pankoIndex.status === 'STEADY' && (
						<>
							<div className="text-center mb-5">
								<span className="inline-flexitems-center rounded-md bg-green-50 px-10 py-2 text-xs font-bold text-green-800 ring-1 ring-inset ring-green-600/20">
									You are all set!
								</span>
							</div>
							<div className="text-center">
								<span className="inline-flex items-center rounded-md bg-green-50 px-10 py-2 text-xs font-bold text-green-800 ring-1 ring-inset ring-green-600/20">
									You can now go to each bot configuration and add your knowledge base in the Vector
									Search section
								</span>
							</div>
						</>
					)}
					{pankoIndex && pankoIndex.status === 'FAILED' && (
						<div className="text-center">
							<span className="mt-5 inline-flex items-center rounded-md bg-red-50 px-10 py-2 text-xs font-bold text-red-800 ring-1 ring-inset ring-red-600/20">
								There was an error creating the index.
							</span>
						</div>
					)}
					{pankoIndex && pankoIndex.status === 'IN_PROGRESS' && (
						<div className="text-center">
							<span className="mt-5 inline-flex items-center rounded-md font-bold bg-blue-50 px-10 py-2 text-xs text-blue-700 ring-1 ring-inset ring-blue-600/20">
								The index is being created! Come back in a few minutes.
							</span>
						</div>
					)}
					{pankoIndex === false && (
						<Button disabled={indexLoadingStatus} type="submit">
							{formSubmitting && <Loader2Icon className="animate-spin" />} Create Search Index
						</Button>
					)}
				</form>
			</Form>
		</>
	);
}

export default VectorSearchSettingsPage;
