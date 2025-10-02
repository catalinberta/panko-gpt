import { tool } from '@langchain/core/tools';
import { z } from 'zod';

import { Platforms } from '../../../constants';
import logger from '../../logger';
import {
	addNewsTopic,
	getNewsTopicById,
	getServerNewsTopics,
	removeNewsTopicById,
	updateNewsTopic
} from '../../../models/NewsTopic';

const schema = z.object({
	createdAt: z.string().min(1, { message: 'createdAt is required' }).describe('Current Full Date with hour'),
	lastUpdateAt: z.string().min(1, { message: 'lastUpdateAt is required' }).describe('Current Full Date with hour'),
	frequency: z
		.number()
		.min(1, { message: 'frequency is required' })
		.describe(
			'Frequency in seconds. This needs to be confirmed by the user with accepted entries of minimum daily and maximum monthly'
		),
	companionId: z.string().optional().default('').describe('Optional, companionId is post-added in user context'),
	platform: z
		.string()
		.min(1, { message: 'Platform is required' })
		.describe(`Platform user is asking news topic on, can be ${Platforms.Discord} or ${Platforms.Telegram}`),
	serverId: z.string().min(1, { message: 'serverId is required' }).describe('serverId pulled from context'),
	channelId: z.string().min(1, { message: 'channelId is required' }).describe('channelId pulled from context'),
	userId: z.string().min(1, { message: 'userId is required' }).describe('userId pulled from context'),
	userName: z
		.string()
		.min(1, { message: 'userName is required' })
		.describe('User name provided in user context, user is not supplying this.'),
	query: z.string().describe('1-5 words describing the news query to search'),
	interest: z
		.string()
		.describe(
			'Precise detailed interest in the news topic. This needs to be confirmed by the user and converted into an at least 30-80 tokens long description'
		)
});
const schemaExtendedWithId = schema.extend({
	_id: z.string().describe('_id from existing entry.')
});
const schemaId = z.object({
	_id: z.string().describe('_id property from the getAllNewsTopics or getNewsTopicById tools')
});
const schemaServer = z.object({
	serverId: z.string().min(1, { message: 'serverId is required' }).describe('Server unique ID')
});
const getAllNewsTopicsFormatted = async ({ serverId }: any) => {
	let newsTopics;

	try {
		newsTopics = await getServerNewsTopics(serverId);
	} catch (e) {
		logger.error(e);
		return `Error getting all news topics: ${String(e)}`;
	}
	if (!newsTopics.length) return 'No news topics found.';
	return JSON.stringify(newsTopics);
};

const getNewsTopicByIdFormatted = async ({ _id }: z.infer<typeof schemaExtendedWithId>) => {
	let newsTopic;
	try {
		newsTopic = await getNewsTopicById(_id);
	} catch (e) {
		logger.error(e);
	}
	return JSON.stringify(newsTopic);
};

const updateNewsTopicFormatted = async (props: z.infer<typeof schemaExtendedWithId>) => {
	try {
		await updateNewsTopic(props._id, props);
	} catch (e) {
		logger.error(e);
		return `Error updating news topic: ${String(e)}`;
	}
	return `News Topic with id ${props._id} updated.`;
};

const addNewsTopicFormatted = async (configId: string, props: z.infer<typeof schema>) => {
	props.companionId = configId;
	let response;
	try {
		logger.silly(`Adding news topic: ${JSON.stringify(props)}`);
		response = await addNewsTopic(props);
	} catch (e) {
		logger.error(e);
		return `Error adding news topic: ${String(e)}`;
	}
	return `News topic added for ${props.userName} with _id ${response._id}.`;
};

const removeNewsTopicByIdFormatted = async ({ _id }: z.infer<typeof schemaId>) => {
	try {
		await removeNewsTopicById(_id);
	} catch (e) {
		logger.error(e);
		return String(e);
	}
	return 'News topic removed';
};

export const getAllNewsTopicsTool = () =>
	tool(getAllNewsTopicsFormatted, {
		name: 'getAllNewsTopics',
		description:
			"Get a list of all news topics with value of _id property included in the response and the time converted to user's timezone e.g. if user is from Germany, then we add 1h.",
		schema: schemaServer
	});

export const getNewsTopicByIdTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for getNewsTopicById';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return getNewsTopicByIdFormatted(parseResult.data);
		},
		{
			name: 'getNewsTopicById',
			description: 'Get a news topic by _id that always includes the _id value in the response',
			schema: schemaExtendedWithId
		}
	);

export const addNewsTopicTool = (configId: string) =>
	tool(
		async (input: unknown) => {
			const parseResult = schema.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for addNewsTopicTool:';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return addNewsTopicFormatted(configId, parseResult.data);
		},
		{
			name: 'addNewsTopic',
			description:
				'Add a new news topic if the user explicitly requests it (e.g., using phrases like "track this news topic: NEWS_QUERY_HERE", "notify me about new news for this topic: NEWS_TOPIC_HERE", or "Keep me informed on this topic"). Do not call this for vague mentions of dates, times, or events without clear intent to create one. ',
			schema
		}
	);
export const updateNewsTopicTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for updateNewsTopicTool';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return updateNewsTopicFormatted(parseResult.data);
		},
		{
			name: 'updateNewsTopic',
			description:
				"Update an existing news topic ONLY if the user explicitly requests changes (e.g., 'update news topic X to...', 'change my news topic details with...",
			schema: schemaExtendedWithId
		}
	);
export const removeNewsTopicTool = () =>
	tool(
		async (input: unknown) => {
			const parseResult = schemaExtendedWithId.safeParse(input);
			if (!parseResult.success) {
				const errorMessage = 'Invalid input for removeNewsTopic';
				logger.warn(errorMessage, parseResult.error);
				return errorMessage;
			}
			return removeNewsTopicByIdFormatted(parseResult.data);
		},
		{
			name: 'removeNewsTopic',
			description:
				"Remove a news topic ONLY if the user explicitly asks to delete it (e.g., 'delete news track ID X', 'remove my news topic for...",
			schema: schemaId
		}
	);
