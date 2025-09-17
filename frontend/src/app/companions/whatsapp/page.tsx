import DashboardTable from '@/components/dashboard-table';
import ApiPaths from '@/constants/ApiPaths';
import RoutePaths from '@/constants/RoutePaths';
import apiClient from '@/services/api';
import { WhatsappConfig } from '@/services/api/types';
import React from 'react';

async function WhatsAppCompanionsPage() {
	const whatsAppConfigs = await apiClient.get<WhatsappConfig[]>(ApiPaths.WhatsappConfigs);

	return (
		<DashboardTable
			title="WhatsApp (Deprecated)"
			routePath={RoutePaths.CompanionsWhatsApp}
			configs={whatsAppConfigs.data}
		/>
	);
}

export default WhatsAppCompanionsPage;
