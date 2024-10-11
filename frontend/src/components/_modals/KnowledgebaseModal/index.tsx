import ApiPaths from '@constants/ApiPaths';
import apiClient from '@services/api';
import { useRef, useState, useEffect } from 'react';

interface IKnowledgebaseModal {
	show: boolean;
	botId: string;
	close: () => void;
}
const KnowledgebaseModal = (props: IKnowledgebaseModal) => {
	const pollingIntervalRef = useRef(0);
	const [isLoading, setIsLoading] = useState(true);
	const [contextChunks, setContextChunks] = useState<string[]>([]);

	useEffect(() => {
		if (props.show) {
			setIsLoading(true);
			pollingIntervalRef.current = setInterval(() => {
				getChunks();
			}, 2000);
		} else {
			clearTimeout(pollingIntervalRef.current);
		}

		return () => {
			clearTimeout(pollingIntervalRef.current);
		};
	}, [props.show]);

	const getChunks = async () => {
		await apiClient.get<{ [key: string]: string }[]>(`${ApiPaths.Chunks}?botId=${props.botId}`).then(response => {
			const parsedChunks = response.data.map(chunk => chunk.content);
			parsedChunks.length && setIsLoading(false);
			setContextChunks(parsedChunks);
		});
	};

	const refreshChunks = async () => {
		setIsLoading(true);
		await getChunks();
	};

	return (
		<div
			className={`${props.show ? '' : 'hidden'} relative z-10`}
			aria-labelledby="modal-title"
			role="dialog"
			aria-modal="true"
		>
			<div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" aria-hidden="true"></div>
			<div className="fixed  px-10 inset-0 z-10 w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<div className="relative bg-gray-700 transform overflow-hidden rounded-lg  text-left shadow-xl transition-all sm:my-8 w-full">
						<div className="relative px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
							<div className="sm:flex sm:items-start">
								<div className="mt-3 flex flex-1 flex-col text-center sm:ml-4 sm:mt-0 sm:text-left h-fit overflow-hidden">
									<h3 className="text-base font-semibold leading-6 text-white" id="modal-title">
										Your structured data
									</h3>
									<div className="mt-2">
										<p className="text-sm text-white">
											Your knowedgebase gets structured into smaller standalone chunks and these
											are stored as vector embeddings. In this way, we can populate the bot's
											context with smaller and related content. You can view them below.
										</p>
									</div>
									{isLoading && (
										<div className="absolute flex items-center justify-center left-0 right-0 top-0 bottom-0 bg-black opacity-50">
											<div
												className="inline-block self-center h-20 w-20 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
												role="status"
											>
												<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
											</div>
										</div>
									)}
									<ul role="list" className="my-5 overflow-y-auto scrollbar w-full max-h-[800px]">
										{contextChunks.map((chunk, index) => (
											<li
												key={index}
												className="flex bg-gray-800 rounded justify-between gap-x-6 p-2 mt-1"
											>
												<div className="flex min-w-0 gap-x-4">
													<div className="min-w-0 flex-auto">
														<p className="text-xs font-semibold leading-4 text-gray-400">
															{chunk}
														</p>
													</div>
												</div>
											</li>
										))}
									</ul>

									<button
										onClick={refreshChunks}
										type="button"
										className="mx-2 w-96 z-50 self-center rounded-md bg-yellow-300 px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset  hover:bg-yellow-200"
									>
										Refresh
									</button>
								</div>
							</div>
						</div>
						<div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
							<button
								onClick={props.close}
								type="button"
								className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

export default KnowledgebaseModal;
