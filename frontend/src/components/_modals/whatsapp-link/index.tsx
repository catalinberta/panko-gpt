'use client';
import { QRCodeSVG } from 'qrcode.react';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import ApiPaths from '@/constants/ApiPaths';
import apiClient from '@/services/api';
import { WhatsappConfig } from '@/services/api/types';
import { useRef, useState, useEffect } from 'react';
import { Loader2Icon } from 'lucide-react';

interface IWhatsAppLinkModal {
	open: boolean;
	refetchConfig: () => void;
	config?: WhatsappConfig;
}
const WhatsAppLinkModal: React.FC<IWhatsAppLinkModal> = ({ open, config, refetchConfig }) => {
	const pollingIntervalRef = useRef<NodeJS.Timeout>(undefined);
	const [isLoading, setIsLoading] = useState(true);
	const [isNewConfig, setIsNewConfig] = useState(false);

	useEffect(() => {
		if (open) {
			pollingIntervalRef.current = setInterval(() => {
				refetchConfig();
			}, 2000);

			if (config) {
				apiClient.patch<WhatsappConfig>(`${ApiPaths.WhatsappConfigs}/${config._id}`, {
					...config,
					enabled: true,
					linked: false,
					qrcode: ''
				});
			}
		} else {
			clearTimeout(pollingIntervalRef.current);
		}

		return () => {
			clearTimeout(pollingIntervalRef.current);
		};
	}, [open]);

	useEffect(() => {
		if (!open) {
			setIsNewConfig(false);
			return;
		}
		const showLoading = !config?.linked || !isNewConfig;
		setIsLoading(showLoading);
	}, [open, config]);

	useEffect(() => {
		if (!isNewConfig) {
			setIsNewConfig(config?.linked === false);
		}
		if (isNewConfig && config?.linked) {
			clearTimeout(pollingIntervalRef.current);
		}
	}, [config]);

	const isLinked = config?.linked && !config?.qrcode;
	const qrcode = config?.qrcode;

	return (
		<DialogContent className="max-w-[90vw] max-h-90vh lg:!max-w-[60vw] lg:!max-h-60vh">
			<DialogHeader>
				<DialogTitle>Link your Device</DialogTitle>
				<DialogDescription>
					Wait for the QR Code to appear and scan it from: <b>Whatsapp App {'->'} Linked Devices</b> <br />
					After scan, please give it up to a minute to authenticate
				</DialogDescription>
			</DialogHeader>

			<div className="flex flex-1 flex-col text-left h-fit rounded-lg overflow-hidden">
				<div className="flex flex-col text-center sm:text-left h-fit overflow-hidden">
					{isLoading && !qrcode && (
						<div className="flex justify-center p-5">
							<Loader2Icon className="animate-spin" strokeWidth={1} size="100" />
						</div>
					)}
					{!isLoading && isLinked && (
						<p className="text-xl font-semibold leading-10 text-center text-[var(--tertiary)]">
							Device is linked!
						</p>
					)}
					{qrcode && (
						<div className="flex justify-center p-5">
							{<QRCodeSVG level="L" includeMargin value={String(qrcode)} size={300} />}
						</div>
					)}
				</div>
			</div>
		</DialogContent>
	);
};

export default WhatsAppLinkModal;
