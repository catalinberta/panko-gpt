'use client';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { ReactElement } from 'react';

interface TextInputProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	className?: string;
	label?: string;
	placeholder?: string;
	description?: string | ReactElement;
}

const TextInput = <T extends FieldValues>({
	className,
	control,
	name,
	label,
	description,
	placeholder = ''
}: TextInputProps<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={className}>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input placeholder={placeholder} {...field} />
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export default TextInput;
