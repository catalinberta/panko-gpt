import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api'; // your axios wrapper or fetch util
import ApiPaths from '@/constants/ApiPaths';
import { DiscordConfig } from '@/services/api/types';

const fetchDiscordConfig = async (companionid: string): Promise<DiscordConfig> => {
	const { data } = await apiClient.get<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${companionid}`);
	return data;
};

export const useFetchDiscordConfig = (companionid: string) => {
	return useQuery({
		queryKey: ['fetchCompanionConfig', companionid],
		queryFn: () => fetchDiscordConfig(companionid)
	});
};
