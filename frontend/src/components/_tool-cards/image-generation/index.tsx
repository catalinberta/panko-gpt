'use client';
import Switch from '@/components/_form/switch';
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { JSX } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';

interface IImageGenerationToolCardProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
}

const ImageGenerationToolCard: <T extends FieldValues>(
	props: IImageGenerationToolCardProps<T>
) => JSX.Element = props => {
	return (
		<Card className="w-full">
			<CardHeader>
				<CardTitle>Image Generation</CardTitle>
				<CardDescription>Enable the companion to use the Image Generation API.</CardDescription>
				<CardAction>
					<Switch className="gap-0" name={props.name} control={props.control} />
				</CardAction>
			</CardHeader>
			<CardContent></CardContent>
		</Card>
	);
};
export default ImageGenerationToolCard;
