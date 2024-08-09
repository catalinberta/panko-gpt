import { useNavigate } from 'react-router-dom'
import { FormStep } from '../../screens/bot-form-discord'

interface SideMenuProps {
	activeItem?: string
	steps: FormStep[]
}

const SideMenu = (props: SideMenuProps) => {
	const navigate = useNavigate()
	return (
		<aside className="w-full sm:w-1/3 md:w-1/4 px-2">
			<div className="sticky top-0">
				<ul className="nav flex flex-col overflow-hidden">
					{props.steps.map((step, index) => (
						<li key={index} className="nav-item mb-3" >
							<button
								data-tooltip-target={`${step.value}-tooltip`}
								onClick={() => navigate(step.url)}
								className={`flex justify-start items-center space-x-6 hover:text-white   hover:bg-gray-700 rounded px-3 py-2  w-full md:w-52
								${step.isActive ? 'bg-gray-700' : ''}
								${
									step.soon || step.disabled
										? 'text-gray-500 hover:bg-transparent hover:text-gray-500 pointer-events-none cursor-default'
										: 'text-gray-300'
								} `}
							>
								{step.icon}
								<p className="text-base leading-4">{step.label}</p>
								{step.soon && (
									<span className="text-xs mb-2 text-yellow-500">soon</span>
								)}
							</button>
							{step.tooltip ? step.tooltip : null}
						</li>
					))}
				</ul>
			</div>
		</aside>
	)
}

export default SideMenu
