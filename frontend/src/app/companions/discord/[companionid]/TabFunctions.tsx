import LanguageDetetionToolCard from '@/components/_tool-cards/language-detection';
import RemindersToolCard from '@/components/_tool-cards/reminders';
import SummarizerSearch from '@/components/_tool-cards/search-summarizer';
import WebpageContentToolCard from '@/components/_tool-cards/webpage-content';
import { Control, FieldValues, Path } from 'react-hook-form';

interface TabFunctionsProps<T extends FieldValues> {
	control: Control<T>;
}

const TabFunctions = <T extends FieldValues>({ control }: TabFunctionsProps<T>) => {
	return (
		<div className="grid grid-cols-2 justify-between gap-4 mt-5">
			<WebpageContentToolCard control={control} name={'functionUrlSummarizer' as Path<T>} />
			<SummarizerSearch control={control} name={'functionSearchSummarizer' as Path<T>} />
			<LanguageDetetionToolCard control={control} name={'functionLanguageDetection' as Path<T>} />
			<RemindersToolCard control={control} name={'functionReminders' as Path<T>} />
		</div>
	);
};
export default TabFunctions;
