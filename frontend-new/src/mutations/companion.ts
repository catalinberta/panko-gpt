import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/api';
import ApiPaths from '@/constants/ApiPaths';
import { DiscordConfig, Settings } from '@/services/api/types';

export const useUpdateCompanion = () => {
	return useMutation({
		mutationFn: ({ companionId, values }: { companionId: string; values: Settings }) =>
			apiClient.patch<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${companionId}`, values)
	});
};

export const useCreateCompanion = () => {
	return useMutation({
		mutationFn: ({ values }: { values: Settings }) =>
			apiClient.post<DiscordConfig>(`${ApiPaths.DiscordConfigs}`, values)
	});
};

export const useDeleteCompanion = () => {
	return useMutation({
		mutationFn: (companionId: string) =>
			apiClient.delete<DiscordConfig>(`${ApiPaths.DiscordConfigs}/${companionId}`)
	});
};
