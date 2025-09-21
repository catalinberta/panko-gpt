'use client';
import { FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form';
import { Control, FieldValues, Path } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Button as ShadcnButton } from '@/components/ui/button';
import { ReactElement } from 'react';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import React from 'react';

interface TextInputProps<T extends FieldValues> {
	control: Control<T>;
	name: Path<T>;
	className?: string;
	type?: string;
	label?: string;
	placeholder?: string;
	description?: string | ReactElement;
}

const TextInput = <T extends FieldValues>({
	className,
	control,
	name,
	label,
	type = 'text',
	description,
	placeholder = ''
}: TextInputProps<T>) => {
	const [showPassword, setShowPassword] = React.useState(false);
	const isPassword = type === 'password';
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => {
				const disabled = field.value === '' || field.value === undefined || field.disabled;
				return (
					<FormItem className={className}>
						<FormLabel>{label}</FormLabel>
						<FormControl>
							<div className="relative">
								<Input
									type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
									placeholder={placeholder}
									{...field}
								/>
								{isPassword && (
									<ShadcnButton
										type="button"
										variant="ghost"
										size="sm"
										className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() => setShowPassword(prev => !prev)}
										disabled={disabled}
									>
										{showPassword && !disabled ? (
											<EyeIcon className="h-4 w-4" aria-hidden="true" />
										) : (
											<EyeOffIcon className="h-4 w-4" aria-hidden="true" />
										)}
										<span className="sr-only">
											{showPassword ? 'Hide password' : 'Show password'}
										</span>
									</ShadcnButton>
								)}
							</div>
						</FormControl>
						<FormDescription>{description}</FormDescription>
						<FormMessage />
					</FormItem>
				);
			}}
		/>
	);
};

export default TextInput;
