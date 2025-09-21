import Switch from '@/components/_form/switch';
import TextInput from '@/components/_form/text-input';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Control, FieldValues, Path } from 'react-hook-form';

interface LanguageDetetionToolCardProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const LanguageDetetionToolCard = <T extends FieldValues>(props: LanguageDetetionToolCardProps<T>) => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Language Detection</CardTitle>
				<CardDescription>
					Enable the use of an offline tool to attempt the language of the last message in order to answer in
					the same language.
				</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent>
				<TextInput
					control={props.control}
					name={'functionLanguageDetectionWhitelist' as Path<T>}
					label="Language Whitelist"
					description={
						'Restrict language detection only to a specific whitelist. Enter a comma-separated list of ISO2 language codes e.g. en,es,it'
					}
				/>
			</CardContent>
		</Card>
	);
};
export default LanguageDetetionToolCard;
