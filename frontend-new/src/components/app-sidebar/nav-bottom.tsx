'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';

export function NavUser() {
	return (
		<SidebarMenu>
			<SidebarGroupLabel>Support</SidebarGroupLabel>
			<SidebarMenuItem>
				<a
					href="https://github.com/catalinberta/panko-gpt"
					target="_blank"
					rel="noopener noreferrer"
					className=""
				>
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarFallback className="rounded-lg">G</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{'Github'}</span>
						</div>
					</SidebarMenuButton>
				</a>
			</SidebarMenuItem>
			<SidebarMenuItem>
				<a href="https://eq6w.short.gy/discord-invite" target="_blank" rel="noopener noreferrer" className="">
					<SidebarMenuButton
						size="lg"
						className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
					>
						<Avatar className="h-8 w-8 rounded-lg">
							<AvatarFallback className="rounded-lg">D</AvatarFallback>
						</Avatar>
						<div className="grid flex-1 text-left text-sm leading-tight">
							<span className="truncate font-medium">{'Discord'}</span>
						</div>
					</SidebarMenuButton>
				</a>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
