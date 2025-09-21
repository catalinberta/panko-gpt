'use client';
import Switch from '@/components/_form/switch';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface IWebpageContentToolCardProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const WebpageContentToolCard: <T extends FieldValues>(
	props: IWebpageContentToolCardProps<T>
) => JSX.Element = props => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>URL Summarizer</CardTitle>
				<CardDescription>
					This enables the bot to scrape urls inside messages and read their content.
				</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent></CardContent>
			{/* <CardFooter className="flex-col gap-2">
				<Button variant="outline" className="w-full cursor-pointer" type="button">
					Configuration
				</Button>
			</CardFooter> */}
		</Card>
	);
};
export default WebpageContentToolCard;
