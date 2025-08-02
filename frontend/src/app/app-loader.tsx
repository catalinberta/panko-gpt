'use client';
import { fetchChatGptModels } from '@/queries/chatgpt';
import { fetchSettings } from '@/queries/settings';
import useChatgptStore from '@/store/chatgpt';
import useSettingsStore from '@/store/settings';
import { useSuspenseQuery } from '@tanstack/react-query';
import { ReactNode } from 'react';

const AppLoader = ({ children }: { children: ReactNode }) => {
	const { data: settings } = useSuspenseQuery({
		queryKey: ['settings'],
		queryFn: fetchSettings
	});
	const { data: models } = useSuspenseQuery({
		queryKey: ['chatgptModels'],
		queryFn: fetchChatGptModels
	});
	const updateModels = useChatgptStore(state => state.updateModels);
	const updateSettings = useSettingsStore(state => state.updateSettings);

	if (settings) {
		updateSettings(settings);
	}
	if (models) {
		updateModels(models);
	}
	return children;
};

export default AppLoader;
