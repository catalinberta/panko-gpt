import { Loader2Icon } from 'lucide-react';

const PageLoader = () => {
	return (
		<span className="flex w-full h-full flex-row items-center justify-center">
			<Loader2Icon className="animate-spin mr-1 opacity-20" size={100} />
		</span>
	);
};

export default PageLoader;
