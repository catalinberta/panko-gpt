import DashboardTable from '@/components/dashboard-table';
import ApiPaths from '@/constants/ApiPaths';
import RoutePaths from '@/constants/RoutePaths';
import apiClient from '@/services/api';
import { DiscordConfig, TelegramConfig, WhatsappConfig } from '@/services/api/types';
import React from 'react';

async function DashboardPage() {
	const discordConfigs = await apiClient.get<DiscordConfig[]>(ApiPaths.DiscordConfigs);
	const telegramConfigs = await apiClient.get<TelegramConfig[]>(ApiPaths.TelegramConfigs);
	const whatsappConfigs = await apiClient.get<WhatsappConfig[]>(ApiPaths.WhatsappConfigs);

	return (
		<>
			<DashboardTable title="Discord" routePath={RoutePaths.CompanionsDiscord} configs={discordConfigs.data} />
			<DashboardTable title="Telegram" routePath={RoutePaths.CompanionsTelegram} configs={telegramConfigs.data} />
			<DashboardTable title="WhatsApp" routePath={RoutePaths.CompanionsWhatsApp} configs={whatsappConfigs.data} />
		</>
	);
}

export default DashboardPage;
