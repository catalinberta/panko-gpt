import ApiPaths from '@constants/ApiPaths';
import apiClient from '@services/api';
import { WhatsappConfig } from '@services/api/types';
import QRCode from 'qrcode.react';
import { useRef, useState, useEffect } from 'react';

interface ILinkModal {
	show: boolean;
	botId: string;
	close: () => void;
	getConfig: () => void;
	config: WhatsappConfig | null;
}
const LinkModal = (props: ILinkModal) => {
	const pollingIntervalRef = useRef(0);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		if (props.show) {
			pollingIntervalRef.current = setInterval(() => {
				props.getConfig();
			}, 2000);

			props.config &&
				apiClient.patch<WhatsappConfig>(`${ApiPaths.WhatsappConfigs}/${props.config._id}`, {
					...props.config,
					enabled: true,
					linked: false,
					qrcode: ''
				});
		} else {
			clearTimeout(pollingIntervalRef.current);
		}

		return () => {
			clearTimeout(pollingIntervalRef.current);
		};
	}, [props.show]);

	useEffect(() => {
		const showLoading = !props.config?.linked;
		setIsLoading(showLoading);
	}, [props.config]);

	const isLinked = props.config?.linked && !props.config?.qrcode;
	const qrcode = props.config?.qrcode;

	return (
		<div
			className={`${props.show ? '' : 'hidden'} relative z-10`}
			aria-labelledby="modal-title"
			role="dialog"
			aria-modal="true"
		>
			<div className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity" aria-hidden="true"></div>
			<div className="fixed  lg:px-40 sm:px-10 inset-0 z-10 w-screen overflow-y-auto">
				<div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
					<div className="relative bg-gray-700 transform overflow-hidden rounded-lg  text-left shadow-xl transition-all sm:my-8 w-full">
						<div className=" px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
							<div className="sm:flex sm:items-start">
								<div className="mt-3 flex flex-1 flex-col text-center sm:ml-4 sm:mt-0 sm:text-left h-fit overflow-hidden">
									<h3 className="text-base font-semibold leading-6 text-white" id="modal-title">
										Wait for the QR Code to appear and scan it from:{' '}
										<b>Whatsapp App {'->'} Linked Devices</b>
									</h3>
									<h3 className="text-base font-semibold leading-6 text-white">
										After scan, please give it ~10 seconds to authenticate
									</h3>
									{isLoading && (
										<div
											className="inline-block self-center m-10 h-20 w-20 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-surface motion-reduce:animate-[spin_1.5s_linear_infinite] dark:text-white"
											role="status"
										>
											<span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"></span>
										</div>
									)}
									{isLinked && (
										<p className="m-10 text-xl font-semibold leading-4 text-center text-green-400">
											Successfully linked!
										</p>
									)}
									{qrcode && (
										<div className="flex my-4 justify-center bg-gray-800 rounded gap-x-6 p-2">
											{<QRCode level="L" includeMargin value={String(qrcode)} size={400} />}
										</div>
									)}
								</div>
							</div>
						</div>
						<div className="bg-gray-800 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
							<button
								onClick={() => {
									props.close();
								}}
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

export default LinkModal;
