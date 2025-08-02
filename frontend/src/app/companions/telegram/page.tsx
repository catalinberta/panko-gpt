import DashboardTable from '@/components/dashboard-table';
import ApiPaths from '@/constants/ApiPaths';
import RoutePaths from '@/constants/RoutePaths';
import apiClient from '@/services/api';
import { TelegramConfig } from '@/services/api/types';
import React from 'react';

async function TelegramCompanionsPage() {
	const telegramConfigs = await apiClient.get<TelegramConfig[]>(ApiPaths.TelegramConfigs);

	return <DashboardTable title="Telegram" routePath={RoutePaths.CompanionsTelegram} configs={telegramConfigs.data} />;
}

export default TelegramCompanionsPage;
