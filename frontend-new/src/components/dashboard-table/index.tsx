import { DiscordConfig, TelegramConfig, WhatsappConfig } from '@/services/api/types';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

import React from 'react';
import { Badge } from '../ui/badge';
import { CardTitle } from '../ui/card';

interface DashboardTableProps {
	title: string;
	configs: DiscordConfig[] | TelegramConfig[] | WhatsappConfig[];
}

const DashboardTable = async ({ title, configs }: DashboardTableProps) => {
	return (
		<>
			<CardTitle className="mt-5 text-lg">{title}</CardTitle>
			<div className="bg-muted/50 rounded-xl">
				<div className="p-4">
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="w-10"></TableHead>
								<TableHead className="w-40">Name</TableHead>
								<TableHead className="width-[100%]">ID</TableHead>
								<TableHead className="text-center">Action</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{configs.map(config => (
								<TableRow key={config._id}>
									<TableCell className="text-center">
										<Badge
											className={`h-3 min-w-3 rounded-full mt-1 p-0 font-mono tabular-nums ${
												config.enabled ? 'bg-green-400' : 'bg-red-400'
											}`}
										></Badge>
									</TableCell>
									<TableCell className="font-medium">
										{config.internalName || config.botName}
									</TableCell>
									<TableCell>{config._id}</TableCell>
									<TableCell className="text-center">
										<Button size="sm">View</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</div>
			</div>
		</>
	);
};

export default DashboardTable;
