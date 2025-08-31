import DashboardTable from '@/components/dashboard-table';
import ApiPaths from '@/constants/ApiPaths';
import RoutePaths from '@/constants/RoutePaths';
import apiClient from '@/services/api';
import { DiscordConfig } from '@/services/api/types';
import React from 'react';

async function DiscordCompanionsPage() {
	const discordConfigs = await apiClient.get<DiscordConfig[]>(ApiPaths.DiscordConfigs);

	return <DashboardTable title="Discord" routePath={RoutePaths.CompanionsDiscord} configs={discordConfigs.data} />;
}

export default DiscordCompanionsPage;
