import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
});

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
});

export const metadata: Metadata = {
	title: 'Panko',
	description: 'Self-hosted AI Companions',
	icons: {
		icon: '/logo.png'
	}
};

import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@radix-ui/react-separator';
import { ReactQuery } from './react-query';
import AppLoader from '@/app/app-loader';
import { Suspense } from 'react';
import PageLoader from '@/components/page-loader';
import Breadcrumbs from '@/components/breadcrumb';
import { PlusIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ReactQuery>
			<html lang="en">
				<body className={`${geistSans.variable} ${geistMono.variable} dark antialiased`}>
					<SidebarProvider>
						<AppSidebar />
						<SidebarInset>
							<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
								<div className="flex flex-1 items-center gap-2 px-4">
									<SidebarTrigger className="-ml-1" />
									<Separator
										orientation="vertical"
										className="mr-2 data-[orientation=vertical]:h-4"
									/>
									<Breadcrumbs />
									<Button size="icon" className="size-8 cursor-pointer">
										<PlusIcon />
									</Button>
								</div>
							</header>
							<div className="flex flex-1 flex-col gap-4 p-4 pt-0">
								<Suspense fallback={<PageLoader />}>
									<AppLoader>{children}</AppLoader>
								</Suspense>
							</div>
						</SidebarInset>
					</SidebarProvider>
				</body>
			</html>
		</ReactQuery>
	);
}
