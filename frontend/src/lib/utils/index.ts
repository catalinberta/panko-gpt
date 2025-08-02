import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function extractErrorMessage(error: unknown): string {
	if (!error) return 'Unknown error';

	if (
		typeof error === 'object' &&
		error !== null &&
		'response' in error &&
		error['response'] &&
		typeof error['response'] === 'object' &&
		error['response'] !== null &&
		'data' in error['response']
	) {
		const data = error.response.data;
		if (typeof data === 'string') return data;
		if (typeof data === 'object' && data !== null) {
			if ('message' in data && typeof data.message === 'string') return data.message;
			if ('error' in data && typeof data.error === 'string') return data.error;
		}
	}

	if (typeof error === 'object' && error !== null && 'message' in error && typeof error['message'] === 'string') {
		return error['message'];
	}

	if (typeof error === 'string') return error;

	return 'An unknown error occurred';
}

export const validatePhoneNumber = (phoneNumber: string) => {
	const phoneNumberRegex = /^\+(?:[0-9] ?){6,14}[0-9]$/;
	return phoneNumberRegex.test(phoneNumber);
};
