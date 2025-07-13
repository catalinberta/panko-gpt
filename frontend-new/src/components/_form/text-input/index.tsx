'use client';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';

interface TextInputProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	label?: string;
	placeholder?: string;
	description?: string;
}

const TextInput = <T extends FieldValues>({
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
				<FormItem>
					<FormLabel>{label}</FormLabel>
					<FormControl>
						<Input placeholder={placeholder} className="max-w-3xl" {...field} />
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export default TextInput;
