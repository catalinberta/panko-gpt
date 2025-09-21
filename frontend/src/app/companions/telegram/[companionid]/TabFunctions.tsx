import ImageSearch from '@/components/_tool-cards/image-search';
import LanguageDetetionToolCard from '@/components/_tool-cards/language-detection';
import RemindersToolCard from '@/components/_tool-cards/reminders';
import WebSearch from '@/components/_tool-cards/web-search';
import WebpageContentToolCard from '@/components/_tool-cards/webpage-content';
import { Control, FieldValues, Path } from 'react-hook-form';

interface TabFunctionsProps<T extends FieldValues> {
	control: Control<T>;
}

const TabFunctions = <T extends FieldValues>({ control }: TabFunctionsProps<T>) => {
	return (
		<div className="grid grid-cols-2 justify-between gap-4 mt-5">
			<WebpageContentToolCard control={control} name={'functionUrlSummarizer' as Path<T>} />
			<WebSearch control={control} name={'functionWebSearch' as Path<T>} />
			<ImageSearch control={control} name={'functionImageSearch' as Path<T>} />
			<LanguageDetetionToolCard control={control} name={'functionLanguageDetection' as Path<T>} />
			<RemindersToolCard control={control} name={'functionReminders' as Path<T>} />
		</div>
	);
};
export default TabFunctions;
