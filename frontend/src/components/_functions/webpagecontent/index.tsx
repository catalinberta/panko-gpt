import { useController, UseControllerProps } from "react-hook-form";

 
interface IWebpageContentProps extends UseControllerProps {
	
}

const WebpageContent = (props: IWebpageContentProps) => {
	const { field } = useController(props);

	return (
		<div className="relative flex flex-col bg-clip-border rounded-xl bg-gray-700 text-gray-700 shadow-md">
			<div className="bg-clip-border mx-4 rounded-lg overflow-hidden bg-gradient-to-tr from-purple-700 to-purple-500 text-white shadow-purple-600/40 shadow-lg absolute right-2 -mt-2 grid h-8 px-3 place-items-center">
				Webpage Access
			</div>
			<div className="p-4">
				<p className="block antialiased font-sans text-md font-bold leading-normal text-white">Webpage Access</p>
				<h4 className="block antialiased mt-2 tracking-normal font-sans text-sm font-semibold leading-snug text-white">This enables the bot to both access urls inside messages and also access the internet as it sees fit in order to supply more up-to-date answers.</h4>
			</div>
			
			<div className="border-t border-blue-gray-50 p-4">
				<div className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600 text-right">
					<label className="inline-flex items-center mt-6 cursor-pointer flex-row-reverse">
						<input
							type="checkbox"
							className="sr-only peer"
							{...props.control?.register('functionInternet')}
						/>
						<div
							className={`relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white rounded-full peer bg-gray-600 peer-checked:bg-yellow-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600`}
						></div>
						<span className={`text-sm mr-2 font-medium ${field.value ? 'text-yellow-400' : 'text-gray-400' }`}>
							{field.value ? "Enabled" : "Disabled"}
						</span>
					</label>
				</div>
			</div>
			
		</div>
	)
}
export default WebpageContent;