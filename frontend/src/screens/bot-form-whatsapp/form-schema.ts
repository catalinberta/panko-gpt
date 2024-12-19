import { validatePhoneNumber } from '@utils/index';
import { z } from 'zod';

const formSchema = z
	.object({
		enabled: z.boolean(),
		internalName: z.string(),
		openAiKey: z.string().min(1, 'This field is required'),
		chatGptModel: z.string().min(1, 'This field is required'),
		customChatGptModel: z.boolean(),
		linked: z.boolean().default(false),
		context: z.string().min(1, 'This field is required'),
		knowledgebase: z.string(),
		onlyContacts: z.boolean(),
		contactsFilterType: z.string(),
		contactsWhitelist: z.array(
			z.string().refine(validatePhoneNumber, value => {
				return {
					code: z.ZodIssueCode.custom,
					message: `${value} is not a valid number. Example: +37 135 142 404 `
				};
			})
		),
		contactsBlacklist: z.array(
			z.string().refine(validatePhoneNumber, value => {
				return {
					code: z.ZodIssueCode.custom,
					message: `${value} is not a valid number. Example: +37 135 142 404 `
				};
			})
		),
		functionUrlSummarizer: z.boolean(),
		functionSearchSummarizer: z.boolean(),
		functionSearchSummarizerKey: z.string()
	})
	.superRefine((values, ctx) => {
		if (values.contactsFilterType === 'whitelist' && values.contactsWhitelist.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'You enabled contacts whitelisting, therefore, add least one valid number (e.g. +37 135 142 404)',
				path: ['contactsWhitelist']
			});
		}
		if (values.contactsFilterType === 'blacklist' && values.contactsBlacklist.length === 0) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				message:
					'You enabled contacts blacklisting, therefore, add least one valid number (e.g. +37 135 142 404)',
				path: ['contactsBlacklist']
			});
		}
	}).refine(
		(data) => !data.functionSearchSummarizer || data.functionSearchSummarizerKey.trim() !== '',
		{
			message: 'The Brave Search API Key is required to enable Search Summarizer.',
			path: ['functionSearchSummarizerKey'],
		}
	);

export default formSchema;
