'use client';
import Switch from '@/components/_form/switch';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface IRemindersToolCardProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const RemindersToolCard: <T extends FieldValues>(props: IRemindersToolCardProps<T>) => JSX.Element = props => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Reminders</CardTitle>
				<CardDescription>Enable the companion to add and manage reminders for each user.</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent></CardContent>
		</Card>
	);
};
export default RemindersToolCard;
