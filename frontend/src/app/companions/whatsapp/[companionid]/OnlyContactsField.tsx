import Select from '@/components/_form/select';
import Switch from '@/components/_form/switch';
import DismissibleChips from '@/components/dismissible-chips';
import { Control, FieldValues, Path, UseFormRegister } from 'react-hook-form';

interface OnlyContactsFieldProps<T extends FieldValues> {
	control: Control<T>;
	contactsFilterType: string;
	onlyContacts: boolean;
	register: UseFormRegister<T>;
}

const OnlyContactsField = <T extends FieldValues>({
	control,
	onlyContacts,
	contactsFilterType,
	register
}: OnlyContactsFieldProps<T>) => {
	return (
		<>
			<Switch
				name={'onlyContacts' as Path<T>}
				label="Respond only to selected contacts"
				description="Whether to respond to all unknown numbers or only to selected contacts from the linked device."
				vertical
				control={control}
			/>
			{onlyContacts && (
				<>
					<div className="ml-5 mt-5 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
						<Select
							name={'contactsFilterType' as Path<T>}
							label="Select contacts filter"
							control={control}
							data={[
								{
									label: 'All contacts',
									value: 'all'
								},
								{
									label: 'Whitelist',
									value: 'whitelist'
								},
								{
									label: 'Blacklist',
									value: 'blacklist'
								}
							]}
						/>
					</div>
					{contactsFilterType === 'whitelist' && (
						<div className="ml-5 mt-5">
							<DismissibleChips
								name={'contactsWhitelist' as Path<T>}
								label="Whitelist"
								placeholder="Add number"
								control={control}
								register={register}
							/>
						</div>
					)}
					{contactsFilterType === 'blacklist' && (
						<div className="ml-5 mt-5">
							<DismissibleChips
								name={'contactsBlacklist' as Path<T>}
								label="Blacklist"
								placeholder="Add number"
								control={control}
								register={register}
							/>
						</div>
					)}
				</>
			)}
		</>
	);
};

export default OnlyContactsField;
