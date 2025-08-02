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
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ReactQuery } from './react-query';
import AppLoader from '@/app/app-loader';
import { Suspense } from 'react';
import PageLoader from '@/components/page-loader';
import Header from '@/components/header';

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ReactQuery>
			<html lang="en">
				<body
					className={`${geistSans.variable} ${geistMono.variable} dark antialiased selection:bg-primary selection:text-primary-foreground flex flex-col items-center`}
				>
					<SidebarProvider className="max-w-7xl">
						<AppSidebar />
						<SidebarInset>
							<Header />
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
