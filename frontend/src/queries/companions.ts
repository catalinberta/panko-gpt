import { useQuery } from '@tanstack/react-query';
import apiClient from '@/services/api';
import ApiPaths from '@/constants/ApiPaths';
import { DiscordConfig, TelegramConfig, WhatsappConfig } from '@/services/api/types';

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

const fetchTelegramConfig = async (companionid: string): Promise<TelegramConfig> => {
	const { data } = await apiClient.get<TelegramConfig>(`${ApiPaths.TelegramConfigs}/${companionid}`);
	return data;
};
export const useFetchTelegramConfig = (companionid: string) => {
	return useQuery({
		queryKey: ['fetchCompanionConfig', companionid],
		queryFn: () => fetchTelegramConfig(companionid)
	});
};

const fetchWhatsAppConfig = async (companionid: string): Promise<WhatsappConfig> => {
	const { data } = await apiClient.get<WhatsappConfig>(`${ApiPaths.WhatsappConfigs}/${companionid}`);
	return data;
};
export const useFetchWhatsAppConfig = (companionid: string) => {
	return useQuery({
		queryKey: ['fetchCompanionConfig', companionid],
		queryFn: () => fetchWhatsAppConfig(companionid)
	});
};
