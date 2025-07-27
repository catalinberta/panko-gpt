'use client';
import Switch from '@/components/_form/switch';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle
} from '@/components/ui/card';
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
					This enables the bot to both access urls inside messages and access the internet via web urls as it
					sees fit in order to enrich its context.
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
