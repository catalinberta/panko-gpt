import { useMutation } from '@tanstack/react-query';
import apiClient from '@/services/api';
import { DiscordConfig, Settings } from '@/services/api/types';
import { CompanionConfig } from '@/global';

export const useUpdateCompanion = () => {
	return useMutation({
		mutationFn: ({ companionId, values, apiPath }: { companionId: string; values: Settings; apiPath: string }) =>
			apiClient.patch<CompanionConfig>(`${apiPath}/${companionId}`, values)
	});
};

export const useCreateCompanion = () => {
	return useMutation({
		mutationFn: ({ values, apiPath }: { values: Settings; apiPath: string }) =>
			apiClient.post<DiscordConfig>(`${apiPath}`, values)
	});
};

export const useDeleteCompanion = () => {
	return useMutation({
		mutationFn: ({ companionId, apiPath }: { companionId: string; apiPath: string }) =>
			apiClient.delete<DiscordConfig>(`${apiPath}/${companionId}`)
	});
};
