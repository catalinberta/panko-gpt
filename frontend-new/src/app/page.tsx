import DashboardTable from '@/components/dashboard-table';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { DiscordConfig, TelegramConfig, WhatsappConfig } from '@/services/api/types';
import React from 'react';

async function DashboardPage() {
	const discordConfigs = await apiClient.get<DiscordConfig[]>(ApiPaths.DiscordConfigs);
	const telegramConfigs = await apiClient.get<TelegramConfig[]>(ApiPaths.TelegramConfigs);
	const whatsappConfigs = await apiClient.get<WhatsappConfig[]>(ApiPaths.WhatsappConfigs);

	return (
		<>
			<DashboardTable title="Discord" configs={discordConfigs.data} />
			<DashboardTable title="Telegram" configs={telegramConfigs.data} />
			<DashboardTable title="WhatsApp" configs={whatsappConfigs.data} />
		</>
	);
}

export default DashboardPage;
