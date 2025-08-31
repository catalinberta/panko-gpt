'use client';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { Textarea as TextareaComponent } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { ReactElement } from 'react';

interface TextInputProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	className?: string;
	componentClassName?: string;
	label?: string | ReactElement;
	placeholder?: string;
	description?: string | ReactElement;
}

const Textarea = <T extends FieldValues>({
	control,
	name,
	label,
	description,
	placeholder = '',
	className,
	componentClassName
}: TextInputProps<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<TextareaComponent
							placeholder={placeholder}
							className={cn('h-30', componentClassName)}
							{...field}
						/>
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export default Textarea;
