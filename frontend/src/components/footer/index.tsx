const Footer = () => {
	return (
		<footer className="bg-black mt-auto">
			<div className="container p-4 text-white mx-auto">
				<div className="flex">
					<div className="flex flex-row flex-1 justify-center items-center">
						<a
							className="mx-2 text-gray-400 hover:text-white"
							href="https://github.com/catalinberta/panko-gpt"
							target="_blank"
						>
							GitHub
						</a>
						<a
							className="mx-2 text-gray-400 hover:text-white"
							href="https://hub.docker.com/repository/docker/catalinbertadev/panko-gpt/general"
							target="_blank"
						>
							DockerHub
						</a>
						<a
							className="mx-2 text-gray-400 hover:text-white"
							href="https://eq6w.short.gy/discord-invite"
							target="_blank"
						>
							Discord
						</a>
					</div>
				</div>
				<div className="text-center text-xs py-4">
					<a className="text-gray-400 hover:text-white" href="https://catalinberta.com" target="_blank">
						developed by Cătălin Berța
					</a>
				</div>
			</div>
		</footer>
	);
};
export default Footer;
