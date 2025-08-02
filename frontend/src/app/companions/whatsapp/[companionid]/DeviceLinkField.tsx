import WhatsAppLinkModal from '@/components/_modals/whatsapp-link';
import { Dialog } from '@/components/ui/dialog';
import { WhatsappConfig } from '@/services/api/types';
import { useState } from 'react';

interface DeviceLinkFieldProps {
	config?: WhatsappConfig;
	refetchConfig: () => void;
}

const DeviceLinkField: React.FC<DeviceLinkFieldProps> = ({ config, refetchConfig }) => {
	const [showLinkModal, setShowLinkModal] = useState(false);
	return (
		<div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6 ">
			<div className="col-span-full">
				<div className="flex items-center justify-between bg-input/40 border-input border rounded-md p-3 mt-2">
					{config?.linked ? (
						<>
							<p className="text-md text-tertiary font-medium text-[var(--tertiary)]">
								Linked to a device
							</p>
							<div>
								<button
									type="button"
									className="bg-[var(--tertiary)] hover:bg-[var(--tertiary)] text-[var(--tertiary-foreground)] rounded-md  disabled:bg-gray-200 ml-4 px-5 py-2 text-sm font-semibold shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
									onClick={() => setShowLinkModal(true)}
								>
									Check link
								</button>
							</div>
						</>
					) : (
						<>
							<p className="text-md text-red-400 font-medium">Not linked to a device</p>

							<button
								type="button"
								className="rounded-md bg-[var(--tertiary)] text-[var(--tertiary-foreground)] disabled:bg-gray-200 px-10 py-2 text-sm font-semibold shadow-sm hover:bg-green-200 focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer"
								onClick={() => setShowLinkModal(true)}
							>
								Link device
							</button>
						</>
					)}
					<Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
						<WhatsAppLinkModal open={showLinkModal} config={config} refetchConfig={refetchConfig} />
					</Dialog>
				</div>
				<p className="mt-3 text-sm leading-6 text-gray-400">
					Whether the companion has been linked to a WhatsApp account
				</p>
			</div>
		</div>
	);
};

export default DeviceLinkField;
