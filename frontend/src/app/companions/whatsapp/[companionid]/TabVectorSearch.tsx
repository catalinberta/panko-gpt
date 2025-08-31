import Textarea from '@/components/_form/textarea';
import KnowledgebaseModal from '@/components/_modals/knowledgebase-chunks';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';
import { useState } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface TabVectorSearchProps<T extends FieldValues> {
	control: Control<T>;
	companionId: string;
}

const TabVectorSearch = <T extends FieldValues>({ control, companionId }: TabVectorSearchProps<T>) => {
	const [isKnowledgebaseModalOpen, setKnowledgebaseModalOpen] = useState(false);
	return (
		<div className="space-y-8 mt-5">
			<Textarea
				componentClassName="h-100"
				name={'knowledgebase' as Path<T>}
				control={control}
				label={
					<div className="flex flex-1 items-center justify-between">
						<span>Knowledgebase</span>
						<Dialog open={isKnowledgebaseModalOpen} onOpenChange={setKnowledgebaseModalOpen}>
							<DialogTrigger className="cursor-pointer rounded-sm h-7">
								<span className="flex items-center">
									<Eye className="mr-2" /> View structured knowledgebase
								</span>
							</DialogTrigger>

							<KnowledgebaseModal open={isKnowledgebaseModalOpen} botId={companionId} />
						</Dialog>
					</div>
				}
				description="Dump your entire knowledge base here and it will be structured into small chunks and served as context to the bot via vector search."
			/>
		</div>
	);
};
export default TabVectorSearch;
