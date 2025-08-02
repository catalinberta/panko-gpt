'use client';
import { FormField, FormItem, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { Label } from '@/components/ui/label';
import { Checkbox as CheckboxComponent } from '@/components/ui/checkbox';

interface CheckboxProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	label?: string;
	description?: string;
}

const Checkbox = <T extends FieldValues>({ control, name, label, description }: CheckboxProps<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					<FormControl>
						<div className="max-w-3xl flex items-center gap-3">
							<CheckboxComponent id={name} checked={field.value} onCheckedChange={field.onChange} />
							<Label htmlFor={name}>{label}</Label>
						</div>
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export default Checkbox;
