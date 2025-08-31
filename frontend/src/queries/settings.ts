import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import ApiPaths from '@/constants/ApiPaths';
import { Settings } from '@/services/api/types';

export const fetchSettings = async (): Promise<Settings> => {
	const { data } = await apiClient.get<Settings>(ApiPaths.Settings);
	return data;
};

export const useSettingsQuery = () => {
	return useQuery({
		queryKey: ['settings'],
		queryFn: fetchSettings
	});
};
