export const paramToCapitalizedString = (queryParam: string): string => {
	return queryParam
		.split('-')
		.map(word => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ');
};
