import { useController, UseControllerProps } from 'react-hook-form';

interface SummarizerSearchProps extends UseControllerProps {}

const SummarizerSearch = (props: SummarizerSearchProps) => {
	const { field } = useController(props);
	const { fieldState: functionSearchSummarizerKeyFieldState  } = useController({...props, name: "functionSearchSummarizerKey"});

	const apiKeyErrorMessage = functionSearchSummarizerKeyFieldState.error?.message;

	return (
		<div className="relative flex flex-col bg-clip-border rounded-xl bg-gray-700 text-gray-700 shadow-md">
			<div className="bg-clip-border mx-4 rounded-lg overflow-hidden bg-gradient-to-tr from-purple-700 to-purple-500 text-white shadow-purple-600/40 shadow-lg absolute right-2 -mt-2 grid h-8 px-3 place-items-center">
				Search Summarizer
			</div>
			<div className="p-4">
				<p className="block antialiased font-sans text-md font-bold leading-normal text-white">
				Summarize Search
				</p>
				<h4 className="block antialiased mt-2 tracking-normal font-sans text-sm font-semibold leading-snug text-white">
					Use Brave Search AI Summarizer to get up-to-date information.
				</h4>
				<input
					type="text"
					id="api-key"
					autoComplete="api-key"
					placeholder="API Key"
					className={`block w-full rounded-md bg-transparent border-0 mt-2 py-1 text-gray-400 shadow-sm ring-1 ring-inset ${apiKeyErrorMessage ? 'ring-red-500 placeholder:text-red-500 focus:ring-red-500 ' : 'ring-gray-500 placeholder:text-gray-500 focus:ring-white ' }  focus:ring-2 focus:ring-inset sm:text-xs sm:leading-6`}
					{...props.control?.register('functionSearchSummarizerKey')}
				/>
			</div>
			<div className="border-t border-blue-gray-50 p-4">
				<div className="block antialiased font-sans text-base leading-relaxed font-normal text-blue-gray-600 text-right">
					<label className="inline-flex items-center mt-6 cursor-pointer flex-row-reverse">
						<input
							type="checkbox"
							className="sr-only peer"
							{...props.control?.register('functionSearchSummarizer')}
						/>
						<div
							className={`relative w-11 h-6 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-white rounded-full peer bg-gray-600 peer-checked:bg-yellow-300 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all border-gray-600`}
						></div>
						<span
							className={`text-sm mr-2 font-medium ${field.value ? 'text-yellow-400' : 'text-gray-400'}`}
						>
							{field.value ? 'Enabled' : 'Disabled'}
						</span>
					</label>
				</div>
			</div>
		</div>
	);
};
export default SummarizerSearch;
