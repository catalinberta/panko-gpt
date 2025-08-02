'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbSeparator,
	BreadcrumbList,
	BreadcrumbPage
} from '@/components/ui/breadcrumb';
import React from 'react';

const toTitleCase = (str: string) => str.replace(/-/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
const segmentLabelMap: Record<string, string> = {
	chatgpt: 'ChatGPT'
};

const Breadcrumbs = () => {
	const pathname = usePathname();

	const segments = pathname.split('/').filter(Boolean);
	const breadcrumbs = segments.map((segment, i) => {
		const href = '/' + segments.slice(0, i + 1).join('/');
		const isLast = i === segments.length - 1;

		const label = segmentLabelMap[segment] || toTitleCase(segment);

		return {
			name: label,
			href,
			isLast
		};
	});

	return (
		<Breadcrumb className="flex flex-1">
			<BreadcrumbList>
				<BreadcrumbItem>
					<Link href="/">Dashboard</Link>
				</BreadcrumbItem>
				{breadcrumbs.map(({ name, href, isLast }) => (
					<React.Fragment key={href}>
						<BreadcrumbSeparator key={`${href}-sep`} />
						<BreadcrumbItem key={href}>
							{isLast ? <BreadcrumbPage>{name}</BreadcrumbPage> : <Link href={href}>{name}</Link>}
						</BreadcrumbItem>
					</React.Fragment>
				))}
			</BreadcrumbList>
		</Breadcrumb>
	);
};

export default Breadcrumbs;
