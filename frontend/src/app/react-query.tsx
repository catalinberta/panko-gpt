'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export function ReactQuery({ children }: { children: React.ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {}
				}
			})
	);
	return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
