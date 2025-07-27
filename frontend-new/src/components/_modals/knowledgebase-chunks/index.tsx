'use client';
import { Button } from '@/components/ui/button';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { useRef, useState, useEffect, useCallback } from 'react';

interface IKnowledgebaseModal {
	show: boolean;
	botId: string;
	close: () => void;
}
const KnowledgebaseModal = (props: IKnowledgebaseModal) => {
	const pollingIntervalRef = useRef<NodeJS.Timeout | number>(0);
	const [isLoading, setIsLoading] = useState(true);
	const [contextChunks, setContextChunks] = useState<string[]>([]);

	const getChunks = useCallback(async () => {
		await apiClient.get<{ [key: string]: string }[]>(`${ApiPaths.Chunks}?botId=${props.botId}`).then(response => {
			const parsedChunks = response.data.map(chunk => chunk.content);
			if (parsedChunks.length) setIsLoading(false);
			setContextChunks(parsedChunks);
		});
	}, [props.botId]);

	useEffect(() => {
		if (props.show) {
			setIsLoading(true);
			pollingIntervalRef.current = setInterval(() => {
				getChunks();
			}, 2000);
		} else {
			if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
		}

		return () => {
			if (pollingIntervalRef.current) clearTimeout(pollingIntervalRef.current);
		};
	}, [props.show, getChunks]);

	const refreshChunks = async () => {
		setIsLoading(true);
		await getChunks();
	};

	return (
		<DialogContent className="!max-w-[80vw] !max-h-80vh">
			<DialogHeader>
				<DialogTitle>Your structured data</DialogTitle>
				<DialogDescription>
					Your knowedgebase gets structured into smaller standalone chunks and these are stored as vector
					embeddings. In this way, we can populate the bot&apos;s context with smaller and related content.
					You can view them below.
				</DialogDescription>
			</DialogHeader>

			<div className="flex flex-1 max-h-[70vh] flex-col text-left h-fit rounded-lg overflow-hidden">
				{isLoading && (
					<div className="absolute flex items-center justify-center left-0 right-0 top-0 bottom-0 bg-black rounded-md opacity-50">
						<div
							className="inline-block self-center h-10 w-10 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
							role="status"
						>
							<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
						</div>
					</div>
				)}
				<ul role="list" className="my-5 overflow-y-auto scrollbar w-full max-h-[800px]">
					{contextChunks.map((chunk, index) => (
						<div key={index} className="flex items-center">
							<span className="min-w-5 mr-1 text-muted text-right">{index + 1}.</span>
							<li className="flex flex-1 bg-muted rounded justify-between gap-x-6 p-2 my-1">
								<div className="flex min-w-0 gap-x-4">
									<div className="min-w-0 flex-auto">
										<p className="text-xs font-semibold leading-4 text-gray-400">{chunk}</p>
									</div>
								</div>
							</li>
						</div>
					))}
				</ul>

				<Button onClick={refreshChunks} type="button" className="w-full max-w-100 self-center">
					Refresh
				</Button>
			</div>
		</DialogContent>
	);
};

export default KnowledgebaseModal;
