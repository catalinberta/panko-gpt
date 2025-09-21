import Switch from '@/components/_form/switch';
import TextInput from '@/components/_form/text-input';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Control, FieldValues, Path } from 'react-hook-form';

interface ImageSearchProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const ImageSearch = <T extends FieldValues>(props: ImageSearchProps<T>) => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Image Search</CardTitle>
				<CardDescription>Use Google Search to get real-time images.</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent>
				<TextInput
					type="password"
					control={props.control}
					name={'functionImageSearchGoogleApiKey' as Path<T>}
					label="Google API Key"
				/>
				<TextInput
					className="mt-5"
					type="password"
					control={props.control}
					name={'functionImageSearchGoogleCseKey' as Path<T>}
					label="Google CSE (aka CX) Id"
					description='Ensure the key has access to "Custom Search API" and that your CSE is set to search the entire web.'
				/>
			</CardContent>
		</Card>
	);
};
export default ImageSearch;
