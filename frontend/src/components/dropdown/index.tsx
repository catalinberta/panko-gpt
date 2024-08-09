import { LabelValueObject } from '../../global'
import { FieldError, FieldValues, Path, UseFormRegister } from 'react-hook-form'

interface DropdownProps<T extends FieldValues> {
	name: Path<T>
	options: LabelValueObject[]
	label?: string
	error?: FieldError
	register: UseFormRegister<T>
}

function Dropdown<T extends FieldValues>(props: DropdownProps<T>) {
	const { label, error } = props
	return (
		<div className="mt-5 col-span-full">
			<label
				htmlFor="projectId"
				className="block text-sm font-medium leading-6 text-gray-300"
			>
				{label}
			</label>
			<select
				id="projectId"
				className="bg-gray-300 border border-gray-300 text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 "
				{...props.register(props.name)}
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
		</div>
	)
}

Dropdown.defaultProps = {
	options: []
}

export default Dropdown
