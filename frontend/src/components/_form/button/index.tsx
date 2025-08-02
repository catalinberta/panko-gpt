import { useEffect, useRef, useState } from 'react';
import { Button as ButtonComponent } from '@/components/ui/button';
import { CircleCheck, Loader2Icon } from 'lucide-react';

interface ButtonSubmitProps {
	label: string;
	onClick?: () => void;
	disabled?: boolean;
	pulse?: boolean;
	isSubmitting?: boolean;
	success?: boolean;
}
const Button: React.FC<ButtonSubmitProps> = props => {
	const buttonElement = useRef(null);
	const [showPulser, setShowPulser] = useState(false);

	const observer = useRef<IntersectionObserver>(null);
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
		<div
			onClick={props.onClick}
			ref={buttonElement}
			className={`relative flex items-center justify-center rounded-md ${
				props.pulse ? 'animation-button-pulse' : ''
			}`}
		>
			{showPulser && (
				<div
					className={`has-tooltip w-4 h-4 rounded-lg ${
						props.isSubmitting ? 'bg-gray-300' : 'bg-yellow-500'
					} fixed animation-button-pulse`}
					style={{ position: 'fixed', bottom: '20px' }}
				>
					{props.success && <CircleCheck />}
					<div className="tooltip absolute rounded-md font-normal -mt-8 -ml-12 bg-black px-2 py-1 text-white text-xs whitespace-nowrap">
						Unsaved changes
					</div>
				</div>
			)}

			<ButtonComponent
				className="cursor-pointer"
				disabled={props.disabled}
				variant={props.disabled || props.isSubmitting ? 'outline' : 'default'}
			>
				{props.isSubmitting && <Loader2Icon className="animate-spin" />}
				{props.success && <CircleCheck className="" color="#537300" />}
				{props.label}
			</ButtonComponent>
		</div>
	);
};

export default Button;
