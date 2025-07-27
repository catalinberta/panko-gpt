'use client';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { ReactElement } from 'react';
import { Switch as SwitchComponent } from '@/components/ui/switch';

interface SwitchProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	vertical?: boolean;
	className?: string;
	componentClassName?: string;
	label?: string | ReactElement;
	placeholder?: string;
	description?: string;
}

const Switch = <T extends FieldValues>({
	control,
	name,
	label,
	description,
	vertical,
	className,
	componentClassName
}: SwitchProps<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className={cn('flex', vertical ? 'flex-col' : 'flex-row', className)}>
					{label && <FormLabel className="flex-1">{label}</FormLabel>}
					<FormControl>
						<div className="flex items-center space-x-2">
							<SwitchComponent
								onCheckedChange={field.onChange}
								checked={field.value}
								className={cn(componentClassName, 'cursor-pointer')}
								id={name}
							/>
						</div>
					</FormControl>
					<FormDescription>{description}</FormDescription>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
};

export default Switch;
