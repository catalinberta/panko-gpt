export const paramToCapitalizedString = (queryParam: string): string => {
	return queryParam
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};
export const validatePhoneNumber = (phoneNumber: string) => {
	const phoneNumberRegex = /^\+(?:[0-9] ?){6,14}[0-9]$/;
	return phoneNumberRegex.test(phoneNumber);
};
