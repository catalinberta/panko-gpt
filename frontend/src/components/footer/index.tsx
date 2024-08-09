const Footer = () => {
	return (
		<footer className="bg-black mt-auto">
			<div className="container p-4 text-white mx-auto">
				<div className="flex">
					<div className="flex-grow flex flex-col items-center">
						<a
							className="text-gray-400 hover:text-white"
							href="https://hub.docker.com/repository/docker/catalinbertadev/panko-gpt/general"
							target="_blank"
						>
							DockerHub
						</a>
						<a
							className="text-gray-400 hover:text-white"
							href="https://eq6w.short.gy/discord-invite"
							target="_blank"
						>
							Discord
						</a>
						<a
							className="text-gray-400 hover:text-white"
							href="mailto:catalinberta@gmail.com"
							target="_blank"
						>
							Contact
						</a>
					</div>
				</div>
				<div className="text-center text-xs py-4">
					<a
						className="text-gray-400 hover:text-white"
						href="https://github.com/catalinberta"
						target="_blank"
					>
						developed by Cătălin Berța
					</a>
				</div>
			</div>
		</footer>
	)
}
export default Footer
