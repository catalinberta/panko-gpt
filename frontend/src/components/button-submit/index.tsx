import { useEffect, useRef, useState } from 'react';

interface ButtonSubmitProps {
	label: string;
	onClick?: () => void;
	disabled?: boolean;
	pulse?: boolean;
	isSubmitting?: boolean;
	success?: boolean;
}
const ButtonSubmit: React.FC<ButtonSubmitProps> = props => {
	const buttonElement = useRef(null);
	const [showPulser, setShowPulser] = useState(false);

	const observer = useRef<IntersectionObserver>();
	useEffect(() => {
		if (!buttonElement.current) return;
		observer.current?.unobserve(buttonElement.current);
		observer.current = new IntersectionObserver(
			entries => {
				const isInViewport = entries[0].isIntersecting;
				const shouldPulse = Boolean((!isInViewport && props.pulse) || (!isInViewport && props.success));
				setShowPulser(shouldPulse);
			},
			{ threshold: 1 }
		);

		observer.current.observe(buttonElement.current);
	}, [buttonElement, props.pulse, props.success]);

	return (
		<button
			onClick={props.onClick}
			disabled={props.disabled}
			ref={buttonElement}
			className={` relative rounded-md ${props.pulse ? 'animation-button-pulse' : ''}  px-10 py-2 text-sm ${
				props.isSubmitting || props.success ? 'text-transparent' : ''
			} font-semibold text-gray-900 shadow-sm ${
				!props.disabled ? 'bg-testcolor hover:bg-yellow-200' : 'bg-gray-200 hover:bg-gray-300'
			} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600`}
		>
			{showPulser && (
				<div
					className={`has-tooltip w-4 h-4 ml-1 rounded-lg ${
						props.isSubmitting ? 'bg-gray-300' : 'bg-yellow-300'
					} fixed bottom-1 animation-button-pulse`}
					style={{ position: 'fixed', bottom: '20px' }}
				>
					{props.success && (
						<svg
							className="absolute -mt-1 -ml-1 w-6 h-6"
							aria-hidden="true"
							xmlns="http://www.w3.org/2000/svg"
							fill="#537300"
							viewBox="0 0 20 20"
						>
							<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
						</svg>
					)}
					<div className="tooltip absolute rounded-md font-normal -mt-8 -ml-12 bg-black px-2 py-1 text-white text-xs whitespace-nowrap">
						Unsaved changes
					</div>
				</div>
			)}
			{props.isSubmitting && (
				<svg
					aria-hidden="true"
					role="status"
					className="absolute inline w-4 h-4 me-3 text-white animate-spin"
					viewBox="0 0 100 101"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
						fill="#E5E7EB"
					/>
					<path
						d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
						fill="currentColor"
					/>
				</svg>
			)}
			{props.label}
			{props.success && (
				<svg
					className="w-5 h-5 absolute m-auto top-0 left-0 right-0 bottom-0"
					aria-hidden="true"
					xmlns="http://www.w3.org/2000/svg"
					fill="#537300"
					viewBox="0 0 20 20"
				>
					<path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
				</svg>
			)}
		</button>
	);
};

export default ButtonSubmit;
