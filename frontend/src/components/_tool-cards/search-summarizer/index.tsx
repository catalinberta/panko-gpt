import Switch from '@/components/_form/switch';
import TextInput from '@/components/_form/text-input';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Control, FieldValues, Path } from 'react-hook-form';

interface SummarizerSearchProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const SummarizerSearch = <T extends FieldValues>(props: SummarizerSearchProps<T>) => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Search Summarizer</CardTitle>
				<CardDescription>Use Brave Search AI Summarizer to get up-to-date information.</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent>
				<TextInput control={props.control} name={'functionSearchSummarizerKey' as Path<T>} label="API Key" />
			</CardContent>
		</Card>
	);
};
export default SummarizerSearch;
