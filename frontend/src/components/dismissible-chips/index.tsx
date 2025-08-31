import { validatePhoneNumber } from '@/lib/utils';
import { ChangeEvent, KeyboardEventHandler, useEffect, useState } from 'react';
import { Control, FieldError, FieldValues, Path, useController, UseFormRegister } from 'react-hook-form';

interface DismissibleChipsProps<T extends FieldValues> {
	label: string;
	name: Path<T>;
	register: UseFormRegister<T>;
	control: Control<T>;
	placeholder?: string;
	error?: FieldError;
}

const DismissibleChips = <P extends FieldValues>(props: DismissibleChipsProps<P>) => {
	const [value, setValue] = useState('');
	const [errorMessage, setErrorMessage] = useState('');
	const { field, fieldState } = useController({
		name: props.name,
		control: props.control
	});
	const { error } = fieldState;

	useEffect(() => {
		let errorMessage = '';
		if (error && Array.isArray(error)) {
			error.map(errorMsg => {
				errorMessage += errorMsg.message;
			});
			setErrorMessage(errorMessage);
		} else {
			setErrorMessage(error?.message || '');
		}
	}, [error]);

	const onChange = (e: ChangeEvent<HTMLInputElement>) => {
		setValue(e.target.value);
	};

	const onKeyDown: KeyboardEventHandler<HTMLInputElement> = e => {
		if ((value && e.code === 'Enter') || e.code === 'NumpadEnter') {
			onAdd();
		}
	};

	const onAdd = () => {
		const currentList = field.value;
		field.onChange([...currentList, value]);
		setValue('');
	};

	const onRemove = (value: string) => {
		const currentList = field.value;
		currentList.splice(currentList.indexOf(value), 1);
		field.onChange(currentList);
	};

	return (
		<>
			<div className="col-span-full">
				<label htmlFor="street-address" className="block text-sm font-medium leading-6 text-gray-300">
					{props.label}
				</label>
				<div className="flex flex-row flex-wrap">
					{field.value.map((value: string, index: string) => (
						<Chip key={index} value={value} onRemove={onRemove} />
					))}
				</div>
				<div className="mt-2 flex flex-row">
					<input
						type="text"
						placeholder={props.placeholder}
						onKeyDown={onKeyDown}
						onChange={onChange}
						value={value}
						className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive"
					/>
					<button
						type="button"
						disabled={!value}
						className={`ml-5 rounded-md ${
							value ? 'bg-[var(--tertiary)]' : 'bg-gray-300 opacity-50'
						}  disabled:bg-gray-200 px-10 py-2 text-sm font-semibold text-[var(--tertiary-foreground)] cursor-pointer shadow-sm ${
							value ? 'hover:bg-green-200' : ''
						} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 `}
						onClick={() => value && onAdd()}
					>
						Add
					</button>
				</div>
			</div>
			{true && <div className="mt-1 text-red-500 text-xs">{errorMessage}</div>}
		</>
	);
};

const Chip = (props: { value: string; onRemove: (value: string) => void }) => {
	const isValid = validatePhoneNumber(props.value);
	return (
		<div
			className={`mt-1 mr-2 rounded-md flex items-center w-fit  from-slate-800 to-slate-700 ${
				isValid ? 'bg-gradient-to-tr' : 'bg-red-900'
			} py-0.5 pl-2.5 pr-1 border border-transparent text-sm text-white transition-all shadow-sm`}
		>
			<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4 mr-1.5">
				<path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 0 0-11.215 0c-.22.578.254 1.139.872 1.139h9.47Z" />
			</svg>
			<span>{props.value}</span>
			<button
				className="ml-2 cursor-pointer flex items-center justify-center transition-all p-1 rounded-md text-white hover:bg-white/10 active:bg-white/10"
				type="button"
				onClick={props.onRemove.bind(null, props.value)}
			>
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-4 h-4">
					<path d="M5.28 4.22a.75.75 0 0 0-1.06 1.06L6.94 8l-2.72 2.72a.75.75 0 1 0 1.06 1.06L8 9.06l2.72 2.72a.75.75 0 1 0 1.06-1.06L9.06 8l2.72-2.72a.75.75 0 0 0-1.06-1.06L8 6.94 5.28 4.22Z" />
				</svg>
			</button>
		</div>
	);
};

export default DismissibleChips;
