import {
	PhoneIcon,
	ChatBubbleLeftIcon,
	ChatBubbleOvalLeftIcon,
	PaperAirplaneIcon,
	EnvelopeIcon
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import RoutePaths from '../../constants/RoutePaths'

interface SidebarProps {
	activeItem?: string
}

const Sidebar = (props: SidebarProps) => {
	const navigate = useNavigate()
	return (
		<aside className="w-full sm:w-1/3 md:w-1/4 px-2">
			<div className="sticky top-0">
				<ul className="nav flex flex-col overflow-hidden">
					<li className="nav-item mb-3">
						<button
							onClick={() => navigate(`${RoutePaths.Integrations}/discord`)}
							className={`flex justify-start items-center space-x-6 hover:text-white ${
								props.activeItem === 'discord' ? 'bg-gray-700' : ''
							}  hover:bg-gray-700 text-gray-300 rounded px-3 py-2  w-full md:w-52`}
						>
							<ChatBubbleLeftIcon className="h-6 w-6" aria-hidden="true" />
							<p className="text-base leading-4">Discord</p>
						</button>
					</li>
					<li className="nav-item mb-3">
						<button
							onClick={() => navigate(`${RoutePaths.Integrations}/telegram`)}
							className={`flex justify-start items-center space-x-6 hover:text-white  hover:bg-gray-700 text-gray-300 rounded px-3 py-2  w-full md:w-52 ${
								props.activeItem === 'telegram' ? 'bg-gray-700' : ''
							}`}
						>
							<PaperAirplaneIcon className="h-6 w-6" aria-hidden="true" />
							<p className="text-base leading-4">Telegram</p>
						</button>
					</li>
					<li className="nav-item mb-3">
						<button
							disabled
							className={`flex justify-start items-center space-x-6  text-gray-500 rounded px-3 py-2  w-full md:w-52 `}
						>
							<PhoneIcon className="h-6 w-6" aria-hidden="true" />
							<p className="text-base leading-4">WhatsApp</p>
							<span className="text-xs mb-2 text-yellow-500">soon</span>
						</button>
					</li>
					<li className="nav-item mb-3">
						<button
							disabled
							className="flex justify-start items-center space-x-6  text-gray-500 rounded px-3 py-2  w-full md:w-52"
						>
							<ChatBubbleOvalLeftIcon className="h-6 w-6" aria-hidden="true" />
							<p className="text-base leading-4">Messenger</p>
							<span className="text-xs mb-2 text-yellow-500">soon</span>
						</button>
					</li>
					<li className="nav-item mb-3">
						<button
							disabled
							className="flex justify-start items-center space-x-6  text-gray-500 rounded px-3 py-2  w-full md:w-52"
						>
							<EnvelopeIcon className="h-6 w-6" aria-hidden="true" />
							<p className="text-base leading-4">Outlook</p>
							<span className="text-xs mb-2 text-yellow-500">soon</span>
						</button>
					</li>
				</ul>
			</div>
		</aside>
	)
}

export default Sidebar
