import { Disclosure } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'
import PankoLogo from '../../assets/logo.png'
import Router from '../../Router'
import RoutePaths from '../../constants/RoutePaths'
import packageJson from '../../../../backend/package.json'
import { useLocation } from 'react-router-dom'

function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(' ')
}

const NavBar = () => {
	const location = useLocation()
	const navigation = [
		{
			name: 'Dashboard',
			path: RoutePaths.Home,
			isActive:
				location.pathname === RoutePaths.Home ||
				location.pathname === `${RoutePaths.Integrations}/telegram` ||
				location.pathname === `${RoutePaths.Integrations}/discord`
		},
		{
			name: 'Settings',
			path: RoutePaths.Settings,
			isActive: location.pathname.startsWith(RoutePaths.Settings)
		}
	]
	return (
		<Disclosure as="nav" className="bg-gray-800">
			{({ open }) => (
				<>
					<div className="mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
						<div className="relative flex h-16 items-center justify-between">
							<div className="absolute inset-y-0 left-0 flex items-center sm:hidden">
								<Disclosure.Button className="relative inline-flex items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white">
									<span className="absolute -inset-0.5" />
									<span className="sr-only">Open main menu</span>
									{open ? (
										<XMarkIcon className="block h-6 w-6" aria-hidden="true" />
									) : (
										<Bars3Icon className="block h-6 w-6" aria-hidden="true" />
									)}
								</Disclosure.Button>
							</div>
							<div className="flex flex-1 items-center justify-start sm:justify-end sm:items-stretch flex-row-reverse sm:flex-row">
								<div className="flex flex-col self-center flex-shrink-0 items-center">
									<img
										className="h-9 w-auto rounded-full"
										src={PankoLogo}
										alt="Logo"
									/>
								</div>
								<div className="flex items-center flex-1 ml-6 hidden sm:flex">
									<div className="flex space-x-4">
										{navigation.map(item => (
											<a
												key={item.name}
												onClick={() => Router.navigate(item.path)}
												className={classNames(
													item.isActive
														? 'bg-yellow-300 text-gray-800 cursor-default'
														: 'text-gray-300 bg-gray-700 hover:bg-gray-600 hover:text-white cursor-pointer',
													'rounded-md px-3 py-2 text-sm font-medium'
												)}
												aria-current={item.isActive ? 'page' : undefined}
											>
												{item.name}
											</a>
										))}
									</div>
								</div>
								<div className="top-1 relative scale-90">
									<div className="w-20 pointer-events-none select-none h-6 py-0.5 self-center  text-center text-white text-xs font-bold  bg-red-500 border-2 rounded-full border-red-900">
										Open Beta
									</div>
									<p className="text-xs text-center scale-90 mt-0.5">{`v${packageJson.version}`}</p>
								</div>
							</div>
						</div>
					</div>

					<Disclosure.Panel className="">
						<div className="space-y-1 px-2 pb-3 pt-2">
							{navigation.map(item => (
								<Disclosure.Button
									key={item.name}
									as="a"
									onClick={() => Router.navigate(item.path)}
									className={classNames(
										item.isActive
											? 'bg-gray-900 text-white'
											: 'text-gray-300 hover:bg-gray-700 hover:text-white',
										'block rounded-md px-3 py-2 text-base font-medium cursor-pointer'
									)}
									aria-current={item.isActive ? 'page' : undefined}
								>
									{item.name}
								</Disclosure.Button>
							))}
						</div>
					</Disclosure.Panel>
				</>
			)}
		</Disclosure>
	)
}

export default NavBar
