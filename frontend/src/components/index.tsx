import { useLocation, Link } from 'react-router-dom'
import { paramToCapitalizedString } from '../utils'

export default function Breadcrumbs() {
	const location = useLocation()

	let currentLink = ''

	const crumbs = () => {
		const breadcrumbPaths = location.pathname
			.split('/')
			.filter(crumb => crumb !== '')
		const crumbElements = breadcrumbPaths.map((crumb, index) => {
			currentLink += `/${crumb}`
			return (
				<div key={index + 1} className="flex">
					<Link className="hover:text-gray-300" to={currentLink}>
						{paramToCapitalizedString(crumb)}
					</Link>
					{index !== breadcrumbPaths.length - 1 && (
						<p className="mr-2 ml-2 select-none">/</p>
					)}
				</div>
			)
		})

		crumbElements.unshift(
			<div key={0} className="flex">
				<Link className="hover:text-gray-300" to={'/'}>
					Home
				</Link>
				{crumbElements.length ? (
					<p className="mr-2 ml-2 select-none">/</p>
				) : (
					<></>
				)}
			</div>
		)

		return crumbElements
	}

	return (
		<div className="container mt-2 text-gray-400 text-xs flex flex-row mx-auto max-w-7xl px-2 sm:px-6 lg:px-8">
			{crumbs()}
		</div>
	)
}
