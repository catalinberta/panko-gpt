'use client';
import { FormField, FormItem, FormControl, FormDescription, FormMessage, FormLabel } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import {
	Select as SelectComponent,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectGroup,
	SelectLabel,
	SelectItem
} from '@/components/ui/select';
import { Loader2Icon } from 'lucide-react';
import { LabelValueObject } from '@/global';

interface SelectProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	data: LabelValueObject[];
	label?: string;
	description?: string;
	placeholder?: string;
}

const Select = <T extends FieldValues>({
	control,
	name,
	label,
	description,
	placeholder = '',
	data
}: SelectProps<T>) => {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				return (
					<FormItem>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<SelectComponent
								value={field.value}
								onValueChange={e => {
									if (e) field.onChange(e);
								}}
							>
								<SelectTrigger className="w-full max-w-3xl">
									<SelectValue
										placeholder={
											data.length ? (
												placeholder
											) : (
												<span className="flex flex-row items-center">
													<Loader2Icon className="animate-spin mr-1" /> Loading data...
												</span>
											)
										}
									/>
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{data.map(entry => (
											<SelectItem key={entry.value} value={entry.value}>
												{entry.label}
											</SelectItem>
										))}
										<SelectLabel>{data.length ? placeholder : 'No data found.'}</SelectLabel>
									</SelectGroup>
								</SelectContent>
							</SelectComponent>
						</FormControl>
						<FormDescription>{description}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

export default Select;
