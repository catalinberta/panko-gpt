'use client';
import { PlusIcon } from 'lucide-react';
import Breadcrumbs from '../breadcrumb';
import { Button } from '../ui/button';
import { SidebarTrigger } from '../ui/sidebar';
import { Separator } from '../ui/separator';
import { useRouter } from 'next/navigation';
import RoutePaths from '@/constants/RoutePaths';

const Header = () => {
	const router = useRouter();
	return (
		<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
			<div className="flex flex-1 items-center gap-2 px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
				<Breadcrumbs />
				<Button
					onClick={() => router.push('/' + RoutePaths.CompanionsCreate)}
					size="icon"
					className="size-8 cursor-pointer color-white bg-transparent hover:bg-yellow-500 text-accent-foreground hover:text-primary-foreground transition-colors duration-200"
				>
					<PlusIcon />
				</Button>
			</div>
		</header>
	);
};

export default Header;
