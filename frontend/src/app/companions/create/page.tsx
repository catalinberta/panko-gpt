'use client';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import RoutePaths from '@/constants/RoutePaths';
import { cn } from '@/lib/utils';
import { ArrowRight, MessageCircle, Send, Sparkles } from 'lucide-react';
import Link from 'next/link';

const data = [
	{
		id: '1',
		title: 'Discord',
		description: 'Integration for Discord bots and applications.',
		link: `/${RoutePaths.CompanionsDiscord}/create`,
		icon: <Sparkles size={60} strokeWidth={1} />,
		headerBg: 'bg-purple-700'
	},
	{
		id: '2',
		title: 'Telegram',
		description: 'Integration for the Telegram Bot API.',
		link: `/${RoutePaths.CompanionsTelegram}/create`,
		icon: <Send size={60} strokeWidth={1} />,
		headerBg: 'bg-blue-500'
	},
	{
		id: '3',
		title: 'WhatsApp',
		description: 'Integration with WhatsApp using Device Linking.',
		link: `/${RoutePaths.CompanionsWhatsApp}/create`,
		icon: <MessageCircle size={60} strokeWidth={1} />,
		headerBg: 'bg-green-700'
	}
];

function CreatePage() {
	return (
		<>
			<h2 className="mt-20 mb-10 text-center text-gray-500 uppercase text-sm">Choose platform</h2>
			<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 lg:gap-8">
				{data.map(item => (
					<Link
						key={item.id}
						href={item.link}
						className="transition-opacity duration-200 fade-in opacity-80 hover:opacity-100"
					>
						<Card className="grid grid-rows-[auto_auto_1fr_auto] pt-0">
							<div className={cn('aspect-16/9 flex w-full items-center justify-center', item.headerBg)}>
								{item.icon}
							</div>
							<CardHeader>
								<h3 className="text-lg font-semibold md:text-xl">{item.title}</h3>
							</CardHeader>
							<CardContent>
								<p className="text-muted-foreground">{item.description}</p>
							</CardContent>
							<CardFooter>
								Create
								<ArrowRight className="ml-2 size-4" />
							</CardFooter>
						</Card>
					</Link>
				))}
			</div>
		</>
	);
}

export default CreatePage;
