import { LabelValueObject } from '../../global'
import { Control, FieldError, FieldValues, Path, useController, UseFormRegister } from 'react-hook-form'

interface DropdownProps<T extends FieldValues> {
	name: Path<T>
	defaultValue?: string;
	options: LabelValueObject[]
	label?: string
	error?: FieldError
	register: UseFormRegister<T>
	control: Control<T>
	hint?: string;
}

function Dropdown<T extends FieldValues>(props: DropdownProps<T>) {
	const { label, error } = props
	const  { field }= useController({name: props.name, control: props.control})
	
	return (
		<div className="col-span-full">
			<label
				htmlFor="projectId"
				className="block text-sm font-medium leading-6 text-gray-300"
			>
				{label}
			</label>
			<select
				id="projectId"
				className="bg-gray-300 border mt-2 border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-[0.45rem]"
				{...props.register(props.name)}
				value={field.value}
			>
				{props.options.map((option, index) => (
					<option key={index} value={option.value}>
						{option.label}
					</option>
				))}
			</select>
			{error && (
				<div className="mt-1 text-red-500 text-xs">{error.message}</div>
			)}
			{props.hint && <p className="mt-1 text-sm leading-6 text-gray-400">
				{props.hint}
			</p>}
		</div>
	)
}

export default Dropdown
