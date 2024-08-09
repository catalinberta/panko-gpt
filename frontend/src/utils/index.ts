export const paramToCapitalizedString = (queryParam: string): string => {
	return (
		queryParam
			// Split the string into words by dashes
			.split('-')
			// Capitalize the first letter of each word
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			// Join the words back into a string, with spaces instead of dashes
			.join(' ')
	)
}
