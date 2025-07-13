'use client';

import {
	SidebarGroup,
	SidebarGroupLabel,
	SidebarMenu,
	SidebarMenuAction,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarMenuSub,
	SidebarMenuSubButton,
	SidebarMenuSubItem
} from '@/components/ui/sidebar';
import RoutePaths from '@/constants/RoutePaths';
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';

import { Bot, ChevronRight, Settings2 } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Collapsible, CollapsibleContent } from '../ui/collapsible';

const CompanionsMenu = [
	{
		title: 'Discord',
		path: '/companions/discord',
		link: `/${RoutePaths.Dashboard}`
	},
	{
		title: 'Vector Search',
		path: '/companions/telegram',
		link: `/${RoutePaths.Dashboard}`
	},
	{
		title: 'System',
		path: '/companions/whatsapp',
		link: `/${RoutePaths.Dashboard}`
	}
];

const SettingsMenu = [
	{
		title: 'ChatGPT',
		path: '/settings/chatgpt',
		link: `/${RoutePaths.SettingsChatgpt}`
	},
	{
		title: 'Vector Search',
		path: '/settings/vector-search',
		link: `/${RoutePaths.SettingsVectorSearch}`
	},
	{
		title: 'System',
		path: '/settings/system',
		link: `/${RoutePaths.SettingsSystem}`
	}
];

export function NavMain() {
	const router = useRouter();
	const pathname = usePathname();

	const isRouteCompanions = pathname === '/';
	const isRouteSettings = pathname.startsWith('/settings');

	return (
		<SidebarGroup>
			<SidebarGroupLabel>Platform</SidebarGroupLabel>
			<SidebarMenu>
				<Collapsible asChild open={isRouteCompanions} defaultOpen={false}>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => router.push('/')}
							className="rounded-tl-none rounded-bl-none cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Bot />
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">Companions</span>
							</div>
						</SidebarMenuButton>
						<CollapsibleTrigger asChild>
							<SidebarMenuAction className="data-[state=open]:rotate-90 cursor-pointer">
								<ChevronRight />
								<span className="sr-only">Toggle</span>
							</SidebarMenuAction>
						</CollapsibleTrigger>
						<CollapsibleContent>
							{CompanionsMenu.map(menu => (
								<SidebarMenuSub key={menu.path}>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link href={menu.link}>
												<span
													className={menu.path === pathname ? 'font-bold' : 'text-gray-400'}
												>
													{menu.title}
												</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							))}
						</CollapsibleContent>
					</SidebarMenuItem>
				</Collapsible>
				<Collapsible asChild open={isRouteSettings} defaultOpen={false}>
					<SidebarMenuItem>
						<SidebarMenuButton
							onClick={() => router.push(`/${RoutePaths.SettingsChatgpt}`)}
							className="rounded-tl-none rounded-bl-none cursor-pointer data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<Settings2 />
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate  font-medium">Settings</span>
							</div>
						</SidebarMenuButton>
						<CollapsibleTrigger asChild>
							<SidebarMenuAction className="data-[state=open]:rotate-90 cursor-pointer">
								<ChevronRight />
								<span className="sr-only">Toggle</span>
							</SidebarMenuAction>
						</CollapsibleTrigger>
						<CollapsibleContent>
							{SettingsMenu.map(menu => (
								<SidebarMenuSub key={menu.path}>
									<SidebarMenuSubItem>
										<SidebarMenuSubButton asChild>
											<Link href={menu.link}>
												<span
													className={menu.path === pathname ? 'font-bold' : 'text-gray-400'}
												>
													{menu.title}
												</span>
											</Link>
										</SidebarMenuSubButton>
									</SidebarMenuSubItem>
								</SidebarMenuSub>
							))}
						</CollapsibleContent>
					</SidebarMenuItem>
				</Collapsible>
			</SidebarMenu>
		</SidebarGroup>
	);
}
